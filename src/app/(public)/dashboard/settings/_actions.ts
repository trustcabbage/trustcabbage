'use server'

import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { teamSeatLimit, type Plan } from '@/lib/plan-limits'
import { buildTeamInviteEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type InviteState = { error?: string; success?: string } | undefined
export type SimpleResult = { ok: true } | { ok: false; error: string }

// The original claimant is the account owner: only they can invite or remove
// teammates. Every company_admin sharing this company_id otherwise has equal
// dashboard access, there is no separate "member" permission tier.
async function getOwner() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()
  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) {
    throw new Error('Forbidden')
  }
  const companyId = (profile as any).company_id as string

  const { data: co } = await supabase
    .from('companies').select('name, slug, claimed_by, plan').eq('id', companyId).single()
  if (!co || (co as any).claimed_by !== user.id) {
    throw new Error('Only the account owner can manage the team.')
  }

  return { userId: user.id, companyId, company: co as any }
}

export async function inviteTeamMember(_prev: InviteState, formData: FormData): Promise<InviteState> {
  let owner: Awaited<ReturnType<typeof getOwner>>
  try {
    owner = await getOwner()
  } catch (err: any) {
    return { error: err?.message ?? 'Not allowed.' }
  }
  const { userId, companyId, company } = owner

  const email = ((formData.get('email') as string) ?? '').trim().toLowerCase()
  if (!email || !EMAIL_RE.test(email)) return { error: 'Enter a valid email address.' }

  const admin = createAdminClient()

  const { data: existingUser } = await admin
    .from('users').select('id').eq('company_id', companyId).ilike('email', email).maybeSingle()
  if (existingUser) return { error: 'This person is already on your team.' }

  const { count: seatCount } = await admin
    .from('users').select('id', { count: 'exact', head: true }).eq('company_id', companyId)
  const limit = teamSeatLimit((company.plan ?? 'free') as Plan)
  if (isFinite(limit) && (seatCount ?? 0) >= limit) {
    return { error: `Your plan includes ${limit} team seat${limit !== 1 ? 's' : ''}. Upgrade to invite more.` }
  }

  // Re-inviting replaces any existing pending invite for this email.
  await admin
    .from('company_team_invites')
    .delete()
    .eq('company_id', companyId)
    .eq('email', email)
    .eq('status', 'pending')

  const { data: invite, error: insertErr } = await admin
    .from('company_team_invites')
    .insert({ company_id: companyId, email, invited_by: userId })
    .select('token')
    .single()
  if (insertErr || !invite) return { error: 'Could not create the invite. Try again.' }

  const { data: inviterProfile } = await admin.from('users').select('display_name').eq('id', userId).single()
  const inviterName = (inviterProfile as any)?.display_name || 'Your teammate'

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrl = `${siteUrl}/team-invite/${(invite as any).token}`
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

  try {
    await resend.emails.send({
      from: fromAddress,
      to: [email],
      subject: `${inviterName} invited you to join ${company.name} on Trust Cabbage`,
      html: buildTeamInviteEmail(company.name, inviterName, inviteUrl),
    })
  } catch {
    return { error: 'Invite created but the email failed to send. Try again or share the link manually.' }
  }

  revalidatePath('/dashboard/settings')
  return { success: `Invite sent to ${email}.` }
}

export async function revokeInvite(inviteId: string): Promise<SimpleResult> {
  let owner: Awaited<ReturnType<typeof getOwner>>
  try {
    owner = await getOwner()
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Not allowed.' }
  }

  const admin = createAdminClient()
  await admin
    .from('company_team_invites')
    .delete()
    .eq('id', inviteId)
    .eq('company_id', owner.companyId)
    .eq('status', 'pending')

  revalidatePath('/dashboard/settings')
  return { ok: true }
}

export async function removeTeamMember(memberUserId: string): Promise<SimpleResult> {
  let owner: Awaited<ReturnType<typeof getOwner>>
  try {
    owner = await getOwner()
  } catch (err: any) {
    return { ok: false, error: err?.message ?? 'Not allowed.' }
  }
  if (memberUserId === owner.userId) {
    return { ok: false, error: 'You cannot remove yourself as the owner.' }
  }

  const admin = createAdminClient()
  await admin
    .from('users')
    .update({ role: 'reviewer', company_id: null })
    .eq('id', memberUserId)
    .eq('company_id', owner.companyId)

  revalidatePath('/dashboard/settings')
  return { ok: true }
}

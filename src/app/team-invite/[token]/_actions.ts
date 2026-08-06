'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export type AcceptResult = { ok: true; companySlug: string } | { ok: false; error: string }

// The invitee accepts their own invite. Identity is verified by matching the
// logged-in user's email against the invite (case-insensitive), then the
// write runs on the admin client, the same trusted-write pattern used for
// claim approval and Service Desk resolution actions.
export async function acceptTeamInvite(token: string): Promise<AcceptResult> {
  if (!token) return { ok: false, error: 'Invalid invite link.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !user.email) return { ok: false, error: 'Sign in first.' }

  const admin = createAdminClient()
  const { data: inviteRaw } = await admin
    .from('company_team_invites')
    .select('id, email, status, company_id, companies(name, slug)')
    .eq('token', token)
    .maybeSingle()

  if (!inviteRaw) return { ok: false, error: 'This invite link is not valid.' }
  const invite = inviteRaw as any
  if (invite.status !== 'pending') return { ok: false, error: 'This invite has already been used.' }
  if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
    return { ok: false, error: `This invite was sent to ${invite.email}. Sign in with that email instead.` }
  }

  // Additive, never a swap: accepting grants access to this company without
  // touching any other company this account already belongs to. company_id
  // becomes the active dashboard (accepting takes you there), but their
  // membership in whatever was active before is untouched and still reachable
  // via the company switcher.
  await admin.from('company_members').upsert({ user_id: user.id, company_id: invite.company_id }, { onConflict: 'user_id,company_id' })
  await admin.from('users').update({ role: 'company_admin', company_id: invite.company_id }).eq('id', user.id)
  await admin.from('company_team_invites').update({ status: 'accepted', accepted_at: new Date().toISOString() }).eq('id', invite.id)

  return { ok: true, companySlug: invite.companies.slug }
}

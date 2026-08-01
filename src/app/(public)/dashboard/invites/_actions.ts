'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { emailInviteLimit } from '@/lib/plan-limits'
import { buildCompanyInviteEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export type InviteResult = { email: string; status: 'sent' | 'failed'; error?: string }
export type InviteState = { results?: InviteResult[]; limitError?: string } | undefined

async function getCompanyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/invites')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  return { supabase, userId: user.id, companyId: (profile as any).company_id as string }
}

export async function sendInvites(_prev: InviteState, formData: FormData): Promise<InviteState> {
  const { supabase, userId, companyId } = await getCompanyAdmin()

  const raw = (formData.get('emails') as string) ?? ''
  const emails = raw
    .split(/[\n,;]+/)
    .map(e => e.trim().toLowerCase())
    .filter(e => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

  if (emails.length === 0) return { results: [] }

  // Load company info
  const { data: co } = await supabase
    .from('companies').select('name, slug, invite_token, plan').eq('id', companyId).single()
  if (!co) return { limitError: 'Company not found' }

  const coName = (co as any).name as string
  const slug = (co as any).slug as string
  const token = (co as any).invite_token as string
  const plan = ((co as any).plan ?? 'free') as 'free' | 'starter' | 'growth'

  // Check monthly limit
  const limit = emailInviteLimit(plan)
  if (isFinite(limit)) {
    const { data: countData } = await supabase.rpc('invite_emails_this_month', { p_company_id: companyId })
    const used = (countData as number) ?? 0
    const remaining = limit - used
    if (remaining <= 0) {
      return { limitError: `Monthly email invite limit reached (${limit}/month on your plan). Upgrade to send more.` }
    }
    if (emails.length > remaining) {
      return { limitError: `You can only send ${remaining} more invite${remaining !== 1 ? 's' : ''} this month (${limit}/month on your plan).` }
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrl = `${siteUrl}/review/${slug}?ref=${token}&src=email`
  const results: InviteResult[] = []

  for (const email of emails) {
    try {
      const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'
      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: `Share your experience with ${coName}, leave a review`,
        html: buildCompanyInviteEmail(coName, inviteUrl),
      })

      if (error) {
        results.push({ email, status: 'failed', error: error.message })
        await supabase.from('invite_email_logs').insert({
          company_id: companyId, sent_by: userId, recipient: email, status: 'failed',
        })
      } else {
        results.push({ email, status: 'sent' })
        await supabase.from('invite_email_logs').insert({
          company_id: companyId, sent_by: userId, recipient: email,
          status: 'sent', resend_id: (data as any)?.id ?? null,
        })
      }
    } catch (err: any) {
      results.push({ email, status: 'failed', error: err?.message ?? 'Unknown error' })
    }
  }

  return { results }
}

'use server'

import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { emailInviteLimit } from '@/lib/plan-limits'

const resend = new Resend(process.env.RESEND_API_KEY)

export type InviteResult = { email: string; status: 'sent' | 'failed'; error?: string }
export type InviteState = { results?: InviteResult[]; limitError?: string } | undefined

function buildInviteEmail(companyName: string, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#1e1b4b;border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0;color:#a78bfa;font-weight:900;font-size:18px;letter-spacing:-0.5px;">
          Trust <span style="color:#fff;">Cabbage</span>
        </p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
          Share your experience with ${companyName}
        </h1>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
          You've been invited to leave an honest review for <strong>${companyName}</strong> on Trust Cabbage — India's verified B2B review platform. It takes about 3 minutes.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#6d28d9;color:#fff;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          Write my review →
        </a>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          You received this because ${companyName} invited you to share your feedback on Trust Cabbage.
          Reviews are permanent and publicly visible. If you did not work with this company, you can ignore this email.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

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
        subject: `Share your experience with ${coName} — leave a review`,
        html: buildInviteEmail(coName, inviteUrl),
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

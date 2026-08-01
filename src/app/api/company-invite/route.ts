import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { authenticateApiKey } from '@/lib/api-auth'
import { buildCompanyInviteEmail } from '@/lib/email-templates'
import { emailInviteLimit } from '@/lib/plan-limits'

const resend = new Resend(process.env.RESEND_API_KEY)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status })
}

// Company-level review invite (no product context). Shares the exact same
// monthly quota as the manual "Send email invites" dashboard tool, tracked
// in the same invite_email_logs table via invite_emails_this_month() — an
// API-triggered send counts against the plan just like a manual one, so the
// API can't be used to bypass the plan's monthly cap.
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return json(401, { error: auth.error })
  const { company, supabase } = auth

  if (!company.claimed_by) {
    return json(409, { error: 'This company page has not been claimed yet.' })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Request body must be JSON.' })
  }

  const customerEmail = String(body?.customer_email ?? '').trim().toLowerCase()
  if (!customerEmail || !EMAIL_RE.test(customerEmail)) {
    return json(400, { error: 'customer_email is required and must be a valid email.' })
  }

  // ── Monthly quota — same limit and same table the dashboard tool uses ─────
  const limit = emailInviteLimit(company.plan)
  if (isFinite(limit)) {
    const { data: countData } = await supabase.rpc('invite_emails_this_month', { p_company_id: company.id })
    const used = (countData as number) ?? 0
    if (used >= limit) {
      return json(429, { error: `Monthly email invite limit reached (${limit}/month on your plan).` })
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrl = `${siteUrl}/review/${company.slug}?ref=${company.invite_token}&src=api`
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

  try {
    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromAddress,
      to: [customerEmail],
      subject: `Share your experience with ${company.name}, leave a review`,
      html: buildCompanyInviteEmail(company.name, inviteUrl),
    })

    if (sendErr) {
      await supabase.from('invite_email_logs').insert({
        company_id: company.id,
        sent_by: company.claimed_by,
        recipient: customerEmail,
        status: 'failed',
      })
      return json(502, { error: 'Email delivery failed. The invite was not sent.' })
    }

    await supabase.from('invite_email_logs').insert({
      company_id: company.id,
      sent_by: company.claimed_by,
      recipient: customerEmail,
      status: 'sent',
      resend_id: (sent as any)?.id ?? null,
    })

    return json(200, { status: 'sent' })
  } catch {
    return json(502, { error: 'Email delivery failed. The invite was not sent.' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import { buildServiceReminderEmail, buildConfirmReminderEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

// Daily Service Desk maintenance. Everything here is once-per-record: the
// reminder_sent_at / confirm_reminder_sent_at stamps are the guard, so a
// double-invocation of the cron cannot double-email anyone.
//
// Note: the 72h publication itself needs no cron, public reads filter on
// publish_at <= now(), so cases go live on their own.
export async function GET(req: NextRequest) {
  // Vercel Cron sends this header; CRON_SECRET must be set in the project env.
  const secret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const now = Date.now()
  const threeDaysAgo = new Date(now - 3 * 24 * 3600 * 1000).toISOString()
  const sevenDaysAgo = new Date(now - 7 * 24 * 3600 * 1000).toISOString()
  const fourteenDaysAgo = new Date(now - 14 * 24 * 3600 * 1000).toISOString()

  const result = { requestReminders: 0, confirmReminders: 0, expiredRequests: 0, errors: [] as string[] }

  // ── 1. Unanswered requests, 3 days old, one nudge ever ────────────────────
  // Only deliberate Service Desk sends: 'invite'/'api' rows are a secondary
  // door inside review-invite emails and must never generate their own email.
  const { data: staleRequests } = await supabase
    .from('service_requests')
    .select('id, token, customer_name, customer_email, companies(name), products_services(name)')
    .eq('source', 'service')
    .in('status', ['invited', 'opened'])
    .is('reminder_sent_at', null)
    .lte('created_at', threeDaysAgo)
    .limit(100)

  for (const r of (staleRequests ?? []) as any[]) {
    const companyName = r.companies?.name
    if (!companyName) continue
    try {
      await resend.emails.send({
        from: FROM,
        to: [r.customer_email],
        subject: r.products_services?.name
          ? `Still time to tell us about your ${r.products_services.name}`
          : `Still time to share your experience with ${companyName}`,
        html: buildServiceReminderEmail(
          companyName,
          r.customer_name,
          r.products_services?.name ?? null,
          `${SITE_URL}/service/${r.token}`
        ),
      })
      await supabase.from('service_requests').update({ reminder_sent_at: new Date().toISOString() }).eq('id', r.id)
      result.requestReminders++
    } catch (err: any) {
      result.errors.push(`request ${r.id}: ${err?.message ?? 'send failed'}`)
    }
  }

  // ── 2. Resolution offers unanswered for 7 days, one nudge ever ────────────
  const { data: staleOffers } = await supabase
    .from('service_cases')
    .select('id, title, request_id, companies(name)')
    .eq('status', 'resolution_offered')
    .is('confirm_reminder_sent_at', null)
    .lte('resolution_offered_at', sevenDaysAgo)
    .limit(100)

  for (const c of (staleOffers ?? []) as any[]) {
    const companyName = c.companies?.name
    if (!companyName) continue
    const { data: reqRow } = await supabase
      .from('service_requests')
      .select('token, customer_email')
      .eq('id', c.request_id)
      .single()
    if (!reqRow) continue
    try {
      await resend.emails.send({
        from: FROM,
        to: [(reqRow as any).customer_email],
        subject: `Reminder: did ${companyName} resolve your issue?`,
        html: buildConfirmReminderEmail(companyName, c.title, `${SITE_URL}/service/${(reqRow as any).token}`),
      })
      await supabase.from('service_cases').update({ confirm_reminder_sent_at: new Date().toISOString() }).eq('id', c.id)
      result.confirmReminders++
    } catch (err: any) {
      result.errors.push(`case ${c.id}: ${err?.message ?? 'send failed'}`)
    }
  }

  // ── 3. Expire untouched requests after 14 days ────────────────────────────
  // Cases are never auto-resolved: an offer the customer ignores stays
  // "resolution_offered" (publicly "awaiting customer") forever, by design.
  const { data: expired } = await supabase
    .from('service_requests')
    .update({ status: 'expired' })
    .in('status', ['invited', 'opened'])
    .lte('created_at', fourteenDaysAgo)
    .select('id')
  result.expiredRequests = (expired ?? []).length

  return NextResponse.json({ ok: true, ...result })
}

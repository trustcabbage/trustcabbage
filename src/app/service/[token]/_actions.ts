'use server'

import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/server'
import {
  buildComplaintAckEmail,
  buildComplaintAlertEmail,
  buildCaseResolvedEmail,
  buildCustomerReplyEmail,
} from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const CATEGORIES = ['Delivery', 'Product quality', 'Refund or return', 'Billing', 'Customer support', 'Other'] as const

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
const FROM = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

export type SubmitCaseResult = { ok: true; type: 'feedback' | 'complaint' } | { ok: false; error: string }
export type SimpleResult = { ok: true } | { ok: false; error: string }

function deriveFirstName(name: string | null, email: string): string {
  const trimmed = (name ?? '').trim()
  if (trimmed) return trimmed.split(/\s+/)[0]
  const local = email.split('@')[0].replace(/[._\-+0-9].*$/, '')
  return local ? local.charAt(0).toUpperCase() + local.slice(1) : 'Customer'
}

// All customer-side writes are token-validated and run with the service role:
// possession of the emailed token IS the customer's verification (the company
// itself sent it to this customer's inbox).
async function loadRequestByToken(token: string) {
  if (!token || token.length < 16) return null
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('service_requests')
    .select('id, status, company_id, product_service_id, customer_name, customer_email, token')
    .eq('token', token)
    .maybeSingle()
  return data ? { supabase, request: data as any } : null
}

async function notifyCompanyAdmins(
  supabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  subject: string,
  html: string
) {
  const { data: admins } = await supabase
    .from('users')
    .select('email')
    .eq('company_id', companyId)
    .eq('role', 'company_admin')
  const emails = ((admins ?? []) as any[]).map(a => a.email).filter(Boolean)
  if (emails.length === 0) return
  try {
    await resend.emails.send({ from: FROM, to: emails, subject, html })
  } catch {
    // Notification failure must never block the customer's submission.
  }
}

export async function submitServiceCase(token: string, formData: FormData): Promise<SubmitCaseResult> {
  const loaded = await loadRequestByToken(token)
  if (!loaded) return { ok: false, error: 'This link is not valid.' }
  const { supabase, request } = loaded
  if (request.status === 'submitted') return { ok: false, error: 'You have already responded to this request.' }

  const type = formData.get('type') === 'complaint' ? 'complaint' : 'feedback'
  const satisfaction = Math.min(5, Math.max(1, parseInt((formData.get('satisfaction') as string) ?? '0') || 0))
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!satisfaction) return { ok: false, error: 'Please select a rating.' }
  if (body.length < 10) return { ok: false, error: 'Please write at least a few words.' }

  // First name only in public display; the email and full name stay private.
  // Requests from the old invite tool / API may have no name, fall back to the
  // email's local part.
  const customerDisplay = deriveFirstName(request.customer_name, request.customer_email)

  let title: string
  let category: string | null = null
  let expectedResolution: string | null = null
  let publishAt: string

  if (type === 'complaint') {
    const rawCategory = (formData.get('category') as string) ?? ''
    category = (CATEGORIES as readonly string[]).includes(rawCategory) ? rawCategory : 'Other'
    title = ((formData.get('title') as string) ?? '').trim()
    expectedResolution = ((formData.get('expected_resolution') as string) ?? '').trim() || null
    if (title.length < 5) return { ok: false, error: 'Please add a short title for your complaint.' }
    // 72h grace window: the company sees it immediately, the public sees it
    // when publish_at passes. Publication needs no cron, reads filter on it.
    publishAt = new Date(Date.now() + 72 * 3600 * 1000).toISOString()
  } else {
    title = `Feedback from ${customerDisplay}`
    publishAt = new Date().toISOString()
  }

  const { error: insertErr } = await supabase.from('service_cases').insert({
    request_id: request.id,
    company_id: request.company_id,
    product_service_id: request.product_service_id,
    type,
    category,
    satisfaction,
    title,
    body,
    expected_resolution: expectedResolution,
    customer_display: customerDisplay,
    publish_at: publishAt,
  })

  if (insertErr) {
    console.error('service_cases insert failed:', insertErr)
    return { ok: false, error: `Could not submit: ${insertErr.message}` }
  }

  await supabase.from('service_requests').update({ status: 'submitted' }).eq('id', request.id)

  if (type === 'complaint') {
    const serviceUrl = `${SITE_URL}/service/${request.token}`
    try {
      await resend.emails.send({
        from: FROM,
        to: [request.customer_email],
        subject: 'Your complaint has been submitted',
        html: buildComplaintAckEmail(await companyName(supabase, request.company_id), title, serviceUrl),
      })
    } catch { /* non-blocking */ }
    await notifyCompanyAdmins(
      supabase,
      request.company_id,
      `New complaint: ${title}`,
      buildComplaintAlertEmail(customerDisplay, title, category ?? 'Other', `${SITE_URL}/dashboard/service`)
    )
  }

  return { ok: true, type }
}

async function companyName(supabase: ReturnType<typeof createAdminClient>, companyId: string): Promise<string> {
  const { data } = await supabase.from('companies').select('name').eq('id', companyId).single()
  return (data as any)?.name ?? 'The company'
}

// Customer writes back on their open complaint thread (public, like every
// other event; locked once the case is resolved).
export async function customerReply(token: string, body: string): Promise<SimpleResult> {
  const trimmed = (body ?? '').trim()
  if (trimmed.length < 2) return { ok: false, error: 'Write a message first.' }

  const loaded = await loadRequestByToken(token)
  if (!loaded) return { ok: false, error: 'This link is not valid.' }
  const { supabase, request } = loaded

  const { data: caseRaw } = await supabase
    .from('service_cases')
    .select('id, type, status, title, customer_display, company_id')
    .eq('request_id', request.id)
    .maybeSingle()
  if (!caseRaw) return { ok: false, error: 'No complaint found for this link.' }
  const kase = caseRaw as any
  if (kase.type !== 'complaint') return { ok: false, error: 'Only complaints have a conversation thread.' }
  if (kase.status === 'resolved' || kase.status === 'unresolved') {
    return { ok: false, error: 'This case is closed. You can still write a review of your overall experience.' }
  }

  const { error: insertErr } = await supabase
    .from('service_case_events')
    .insert({ case_id: kase.id, author: 'customer', kind: 'reply', body: trimmed })
  if (insertErr) return { ok: false, error: 'Could not send. Please try again.' }

  await notifyCompanyAdmins(
    supabase,
    kase.company_id,
    `Customer replied: ${kase.title}`,
    buildCustomerReplyEmail(kase.customer_display, kase.title, `${SITE_URL}/dashboard/service`)
  )

  return { ok: true }
}

// Customer closes the loop. 'yes' works from BOTH states: confirming a
// company's offered resolution, or marking an open case resolved on their own
// (the company fixed it in reality but never clicked "Offer resolution" — the
// customer's word is the most trustworthy signal here and only their token can
// give it). 'no' only makes sense against an offered resolution.
export async function confirmResolution(token: string, answer: 'yes' | 'no', comment?: string): Promise<SimpleResult> {
  const loaded = await loadRequestByToken(token)
  if (!loaded) return { ok: false, error: 'This link is not valid.' }
  const { supabase, request } = loaded

  const { data: caseRaw } = await supabase
    .from('service_cases')
    .select('id, type, status, title, customer_display, company_id')
    .eq('request_id', request.id)
    .maybeSingle()
  if (!caseRaw) return { ok: false, error: 'No complaint found for this link.' }
  const kase = caseRaw as any
  if (kase.type !== 'complaint') return { ok: false, error: 'Only complaints can be resolved.' }
  if (kase.status === 'resolved' || kase.status === 'unresolved') return { ok: false, error: 'This case is already closed.' }
  if (answer === 'no' && kase.status !== 'resolution_offered') {
    return { ok: false, error: 'There is no resolution awaiting your confirmation.' }
  }

  if (answer === 'yes') {
    await supabase.from('service_cases').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', kase.id)
    await supabase.from('service_case_events').insert({ case_id: kase.id, author: 'customer', kind: 'customer_confirm', body: null })
    await notifyCompanyAdmins(
      supabase,
      kase.company_id,
      'Resolution confirmed by the customer',
      buildCaseResolvedEmail(kase.customer_display, kase.title, `${SITE_URL}/dashboard/service`)
    )
  } else {
    await supabase.from('service_cases').update({ status: 'open' }).eq('id', kase.id)
    await supabase.from('service_case_events').insert({
      case_id: kase.id,
      author: 'customer',
      kind: 'customer_decline',
      body: (comment ?? '').trim() || null,
    })
  }

  return { ok: true }
}

// Escalation valve: if the company has not even replied within 24 hours, the
// customer can publish the complaint immediately instead of waiting out 72h.
export async function escalatePublish(token: string): Promise<SimpleResult> {
  const loaded = await loadRequestByToken(token)
  if (!loaded) return { ok: false, error: 'This link is not valid.' }
  const { supabase, request } = loaded

  const { data: caseRaw } = await supabase
    .from('service_cases')
    .select('id, type, created_at, first_company_reply_at, publish_at')
    .eq('request_id', request.id)
    .maybeSingle()
  if (!caseRaw) return { ok: false, error: 'No complaint found for this link.' }
  const kase = caseRaw as any

  if (kase.type !== 'complaint') return { ok: false, error: 'Only complaints can be published early.' }
  if (kase.first_company_reply_at) return { ok: false, error: 'The company has already replied, publication continues on schedule.' }
  if (new Date(kase.publish_at).getTime() <= Date.now()) return { ok: false, error: 'Your complaint is already public.' }
  if (Date.now() - new Date(kase.created_at).getTime() < 24 * 3600 * 1000) {
    return { ok: false, error: 'Early publication unlocks 24 hours after submission if the company has not replied.' }
  }

  await supabase.from('service_cases').update({ publish_at: new Date().toISOString() }).eq('id', kase.id)
  return { ok: true }
}

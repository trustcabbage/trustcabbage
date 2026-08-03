'use server'

import { Resend } from 'resend'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { serviceRequestLimit, type Plan } from '@/lib/plan-limits'
import {
  buildServiceRequestEmail,
  buildCompanyReplyEmail,
  buildResolutionOfferEmail,
} from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type RequestResult = { name: string; email: string; status: 'sent' | 'failed'; error?: string }
export type RequestState = { results?: RequestResult[]; limitError?: string; formError?: string } | undefined

async function getCompanyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/service')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  return { supabase, userId: user.id, companyId: (profile as any).company_id as string }
}

type Recipient = { name: string; email: string }

// Bulk lines are "Name, email" (comma or tab separated); single mode passes
// name/email fields directly. Product, purchase date, and order ref apply to
// all recipients in the batch.
function parseRecipients(formData: FormData): Recipient[] {
  const mode = formData.get('mode') === 'bulk' ? 'bulk' : 'single'
  if (mode === 'single') {
    const name = ((formData.get('customer_name') as string) ?? '').trim()
    const email = ((formData.get('customer_email') as string) ?? '').trim().toLowerCase()
    return name && EMAIL_RE.test(email) ? [{ name, email }] : []
  }
  const raw = (formData.get('bulk') as string) ?? ''
  const out: Recipient[] = []
  const seen = new Set<string>()
  for (const line of raw.split('\n')) {
    const parts = line.split(/[,\t]/).map(p => p.trim()).filter(Boolean)
    if (parts.length < 2) continue
    const email = parts[parts.length - 1].toLowerCase()
    const name = parts.slice(0, -1).join(' ')
    if (!name || !EMAIL_RE.test(email) || seen.has(email)) continue
    seen.add(email)
    out.push({ name, email })
  }
  return out
}

export async function sendServiceRequests(_prev: RequestState, formData: FormData): Promise<RequestState> {
  const { supabase, userId, companyId } = await getCompanyAdmin()

  const recipients = parseRecipients(formData)
  if (recipients.length === 0) {
    return { formError: 'Add at least one customer with a name and a valid email.' }
  }

  const productServiceId = ((formData.get('product_service_id') as string) ?? '').trim() || null
  const purchaseDate = ((formData.get('purchase_date') as string) ?? '').trim() || null
  const orderRef = ((formData.get('order_ref') as string) ?? '').trim() || null

  const { data: co } = await supabase
    .from('companies').select('name, slug, plan').eq('id', companyId).single()
  if (!co) return { formError: 'Company not found' }
  const coName = (co as any).name as string
  const plan = ((co as any).plan ?? 'free') as Plan

  // Resolve product name for the email when a product is attached
  let productName: string | null = null
  if (productServiceId) {
    const { data: prod } = await supabase
      .from('products_services')
      .select('name')
      .eq('id', productServiceId)
      .eq('company_id', companyId)
      .single()
    if (!prod) return { formError: 'Selected product not found' }
    productName = (prod as any).name
  }

  // Monthly limit
  const limit = serviceRequestLimit(plan)
  if (isFinite(limit)) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      // Piggyback rows from review-invite emails have their own channel
      // limits; only deliberate Service Desk sends count against this quota.
      .eq('source', 'service')
      .gte('created_at', monthStart.toISOString())
    const used = count ?? 0
    const remaining = limit - used
    if (remaining <= 0) {
      return { limitError: `Monthly service request limit reached (${limit}/month on your plan). Upgrade to send more.` }
    }
    if (recipients.length > remaining) {
      return { limitError: `You can only send ${remaining} more request${remaining !== 1 ? 's' : ''} this month (${limit}/month on your plan).` }
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'
  const results: RequestResult[] = []

  for (const { name, email } of recipients) {
    // Insert first so the row's generated token drives the link; RLS insert
    // policy scopes this to the caller's own company.
    const { data: reqRow, error: insertErr } = await supabase
      .from('service_requests')
      .insert({
        company_id: companyId,
        product_service_id: productServiceId,
        customer_name: name,
        customer_email: email,
        purchase_date: purchaseDate,
        order_ref: orderRef,
        sent_by: userId,
      })
      .select('id, token')
      .single()

    if (insertErr || !reqRow) {
      const duplicate = insertErr?.code === '23505'
      results.push({
        name, email, status: 'failed',
        error: duplicate ? 'Already requested for this order' : 'Could not create the request',
      })
      continue
    }

    const serviceUrl = `${siteUrl}/service/${(reqRow as any).token}`
    try {
      const { data: sent, error: sendErr } = await resend.emails.send({
        from: fromAddress,
        to: [email],
        subject: productName
          ? `How was your ${productName} from ${coName}?`
          : `How was your experience with ${coName}?`,
        html: buildServiceRequestEmail(coName, name, productName, serviceUrl),
      })

      if (sendErr) {
        await supabase.from('service_requests').update({ status: 'failed' }).eq('id', (reqRow as any).id)
        results.push({ name, email, status: 'failed', error: sendErr.message })
      } else {
        await supabase.from('service_requests').update({ resend_id: (sent as any)?.id ?? null }).eq('id', (reqRow as any).id)
        results.push({ name, email, status: 'sent' })
      }
    } catch (err: any) {
      await supabase.from('service_requests').update({ status: 'failed' }).eq('id', (reqRow as any).id)
      results.push({ name, email, status: 'failed', error: err?.message ?? 'Unknown error' })
    }
  }

  revalidatePath('/dashboard/service')
  return { results }
}

export type CaseActionResult = { ok: true } | { ok: false; error: string }

// Loads a case after verifying it belongs to the caller's company (the select
// runs on the user client, so RLS does the ownership check), then returns a
// service client for the writes (cases/events have no write policies for
// normal clients by design).
async function loadOwnCase(caseId: string) {
  const { supabase, companyId } = await getCompanyAdmin()

  const { data: caseRaw } = await supabase
    .from('service_cases')
    .select('id, request_id, company_id, type, status, title, first_company_reply_at, companies(name)')
    .eq('id', caseId)
    .eq('company_id', companyId)
    .maybeSingle()
  if (!caseRaw) return null

  const service = createAdminClient()
  const { data: reqRaw } = await service
    .from('service_requests')
    .select('customer_email, token')
    .eq('id', (caseRaw as any).request_id)
    .single()

  return { service, kase: caseRaw as any, request: reqRaw as any }
}

async function emailCustomer(to: string, subject: string, html: string) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>',
      to: [to],
      subject,
      html,
    })
  } catch {
    // The reply is saved either way; delivery failure must not lose it.
  }
}

export async function replyToCase(caseId: string, body: string): Promise<CaseActionResult> {
  const trimmed = (body ?? '').trim()
  if (trimmed.length < 5) return { ok: false, error: 'Write a reply first.' }

  const loaded = await loadOwnCase(caseId)
  if (!loaded) return { ok: false, error: 'Case not found.' }
  const { service, kase, request } = loaded

  if (kase.status === 'resolved') return { ok: false, error: 'This case is already resolved.' }

  const { error: insertErr } = await service
    .from('service_case_events')
    .insert({ case_id: kase.id, author: 'company', kind: 'reply', body: trimmed })
  if (insertErr) return { ok: false, error: 'Could not save the reply. Try again.' }

  if (!kase.first_company_reply_at) {
    await service
      .from('service_cases')
      .update({ first_company_reply_at: new Date().toISOString() })
      .eq('id', kase.id)
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const companyName = (kase.companies as any)?.name ?? 'The company'
  if (request?.customer_email) {
    await emailCustomer(
      request.customer_email,
      `${companyName} replied to your complaint`,
      buildCompanyReplyEmail(companyName, kase.title, `${siteUrl}/service/${request.token}`)
    )
  }

  revalidatePath('/dashboard/service')
  return { ok: true }
}

export async function offerResolution(caseId: string, summary: string): Promise<CaseActionResult> {
  const trimmed = (summary ?? '').trim()
  if (trimmed.length < 10) return { ok: false, error: 'Describe the resolution in a sentence, it becomes the public resolution note.' }

  const loaded = await loadOwnCase(caseId)
  if (!loaded) return { ok: false, error: 'Case not found.' }
  const { service, kase, request } = loaded

  if (kase.type !== 'complaint') return { ok: false, error: 'Only complaints can be resolved.' }
  if (kase.status === 'resolved') return { ok: false, error: 'This case is already resolved.' }
  if (kase.status === 'resolution_offered') return { ok: false, error: 'A resolution is already awaiting customer confirmation.' }

  const now = new Date().toISOString()
  const { error: updateErr } = await service
    .from('service_cases')
    .update({
      status: 'resolution_offered',
      resolution_summary: trimmed,
      resolution_offered_at: now,
      // An offer counts as a first reply for response-time metrics
      ...(kase.first_company_reply_at ? {} : { first_company_reply_at: now }),
    })
    .eq('id', kase.id)
  if (updateErr) return { ok: false, error: 'Could not save. Try again.' }

  await service
    .from('service_case_events')
    .insert({ case_id: kase.id, author: 'company', kind: 'resolution_offer', body: trimmed })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const companyName = (kase.companies as any)?.name ?? 'The company'
  if (request?.customer_email) {
    await emailCustomer(
      request.customer_email,
      `Did ${companyName} resolve your issue?`,
      buildResolutionOfferEmail(companyName, kase.title, trimmed, `${siteUrl}/service/${request.token}`)
    )
  }

  revalidatePath('/dashboard/service')
  return { ok: true }
}

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceClient } from '@/lib/supabase/server'
import { authenticateApiKey } from '@/lib/api-auth'
import { buildProductInviteEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const DAILY_INVITE_LIMIT = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

async function findUniqueProductSlug(
  supabase: Awaited<ReturnType<typeof createServiceClient>>,
  companyId: string,
  base: string
): Promise<string> {
  let slug = base || 'product'
  let i = 2
  while (true) {
    const { data } = await supabase
      .from('products_services')
      .select('id')
      .eq('company_id', companyId)
      .eq('slug', slug)
      .maybeSingle()
    if (!data) return slug
    slug = `${base}-${i++}`
  }
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status })
}

export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return json(401, { error: auth.error })
  const { company, supabase } = auth

  // ── Validate body ─────────────────────────────────────────────────────────
  let body: any
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Request body must be JSON.' })
  }

  // customer_email is optional: omit it to register a product without sharing
  // any customer PII with Trust Cabbage, e.g. when you plan to send your own
  // invite email and never intended to use ours for this product at all.
  const rawEmail = String(body?.customer_email ?? '').trim().toLowerCase()
  const customerEmail = rawEmail || null
  const productId = String(body?.product_id ?? '').trim()
  const productName = String(body?.product_name ?? '').trim()
  const orderId = body?.order_id ? String(body.order_id).trim() : null
  const customerName = body?.customer_name ? String(body.customer_name).trim() || null : null

  if (customerEmail && !EMAIL_RE.test(customerEmail)) {
    return json(400, { error: 'customer_email must be a valid email if provided.' })
  }
  if (!productId) {
    return json(400, { error: 'product_id is required (your own SKU or product ID).' })
  }

  if (customerEmail) {
    // ── Dedup: same company + order + email only ever invited once ──────────
    if (orderId) {
      const { data: existing } = await supabase
        .from('api_invite_logs')
        .select('id')
        .eq('company_id', company.id)
        .eq('order_id', orderId)
        .eq('customer_email', customerEmail)
        .eq('status', 'sent')
        .maybeSingle()
      if (existing) return json(200, { status: 'already_sent' })
    }

    // ── Daily cap ─────────────────────────────────────────────────────────────
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count } = await supabase
      .from('api_invite_logs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('sent_at', dayAgo)
    if ((count ?? 0) >= DAILY_INVITE_LIMIT) {
      return json(429, { error: `Daily invite limit reached (${DAILY_INVITE_LIMIT}/day during early access).` })
    }
  }

  // ── Find or auto-create the product ───────────────────────────────────────
  let productServiceId: string | null = null
  let productDisplayName = productName || productId

  const { data: existingProduct } = await supabase
    .from('products_services')
    .select('id, name')
    .eq('company_id', company.id)
    .eq('external_id', productId)
    .maybeSingle()

  if (existingProduct) {
    productServiceId = (existingProduct as any).id
    productDisplayName = (existingProduct as any).name
  } else {
    const slug = await findUniqueProductSlug(supabase, company.id, toSlug(productDisplayName))
    const { data: created, error: createErr } = await supabase
      .from('products_services')
      .insert({
        company_id: company.id,
        name: productDisplayName,
        type: 'product',
        external_id: productId,
        slug,
        auto_created: true,
        is_active: true,
      })
      .select('id')
      .single()
    if (createErr || !created) {
      return json(500, { error: 'Failed to register the product. Try again.' })
    }
    productServiceId = (created as any).id
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'

  // No email provided: registration only, nothing sent, no PII logged.
  if (!customerEmail) {
    return json(200, {
      status: 'registered',
      product_id: productId,
      product_name: productDisplayName,
      write_review_url: `${siteUrl}/company/${company.slug}/write-review?product=${encodeURIComponent(productId)}&src=email`,
    })
  }

  // ── Service Desk door (secondary option in the email) ─────────────────────
  // A per-customer request row so the invite email can also offer "raise an
  // issue". Re-sends for the same (order, email) reuse the existing token.
  let serviceUrl: string | undefined
  {
    const { data: reqRow, error: reqErr } = await supabase
      .from('service_requests')
      .insert({
        company_id: company.id,
        product_service_id: productServiceId,
        customer_email: customerEmail,
        customer_name: customerName,
        order_ref: orderId,
        source: 'api',
      })
      .select('token')
      .single()
    if (reqRow) {
      serviceUrl = `${siteUrl}/service/${(reqRow as any).token}`
    } else if (reqErr?.code === '23505' && orderId) {
      const { data: existingReq } = await supabase
        .from('service_requests')
        .select('token')
        .eq('company_id', company.id)
        .eq('order_ref', orderId)
        .eq('customer_email', customerEmail)
        .maybeSingle()
      if (existingReq) serviceUrl = `${siteUrl}/service/${(existingReq as any).token}`
    }
  }

  // ── Send the invite email ─────────────────────────────────────────────────
  const inviteUrl = `${siteUrl}/review/${company.slug}?ref=${company.invite_token}&src=api&product=${encodeURIComponent(productId)}`
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

  try {
    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromAddress,
      to: [customerEmail],
      subject: `How was your ${productDisplayName}? Leave a review`,
      html: buildProductInviteEmail(company.name, productDisplayName, inviteUrl, serviceUrl),
    })

    if (sendErr) {
      await supabase.from('api_invite_logs').insert({
        company_id: company.id,
        product_service_id: productServiceId,
        customer_email: customerEmail,
        order_id: orderId,
        status: 'failed',
      })
      return json(502, { error: 'Email delivery failed. The invite was not sent.' })
    }

    await supabase.from('api_invite_logs').insert({
      company_id: company.id,
      product_service_id: productServiceId,
      customer_email: customerEmail,
      order_id: orderId,
      status: 'sent',
      resend_id: (sent as any)?.id ?? null,
    })

    return json(200, { status: 'sent', product_id: productId })
  } catch {
    return json(502, { error: 'Email delivery failed. The invite was not sent.' })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { authenticateApiKey } from '@/lib/api-auth'
import { serviceRequestLimit } from '@/lib/plan-limits'
import { buildServiceRequestEmail } from '@/lib/email-templates'

const resend = new Resend(process.env.RESEND_API_KEY)

const DAILY_CAP = 500
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status })
}

// Company-triggered Service Desk request: sends our neutral "how was your
// experience?" email whose tokened page routes the customer to a review,
// quick feedback, or a complaint. The automation-first sibling of the
// dashboard's "Send a feedback request" form; both count as source 'service'.
export async function POST(req: NextRequest) {
  const auth = await authenticateApiKey(req)
  if (!auth.ok) return json(401, { error: auth.error })
  const { company, supabase } = auth

  let body: any
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Request body must be JSON.' })
  }

  const customerEmail = String(body?.customer_email ?? '').trim().toLowerCase()
  const customerName = body?.customer_name ? String(body.customer_name).trim() || null : null
  const productId = body?.product_id ? String(body.product_id).trim() : null
  const productName = body?.product_name ? String(body.product_name).trim() : null
  const orderId = body?.order_id ? String(body.order_id).trim() : null
  const purchaseDate = body?.purchase_date ? String(body.purchase_date).trim() : null

  if (!customerEmail || !EMAIL_RE.test(customerEmail)) {
    return json(400, { error: 'customer_email is required and must be a valid email.' })
  }
  if (purchaseDate && !DATE_RE.test(purchaseDate)) {
    return json(400, { error: 'purchase_date must be YYYY-MM-DD if provided.' })
  }

  // ── Caps ──────────────────────────────────────────────────────────────────
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const { count: dayCount } = await supabase
    .from('service_requests')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', company.id)
    .eq('source', 'service')
    .gte('created_at', dayAgo)
  if ((dayCount ?? 0) >= DAILY_CAP) {
    return json(429, { error: `Daily service request limit reached (${DAILY_CAP}/day during early access).` })
  }

  const limit = serviceRequestLimit(company.plan)
  if (isFinite(limit)) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('service_requests')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('source', 'service')
      .gte('created_at', monthStart.toISOString())
    if ((count ?? 0) >= limit) {
      return json(429, { error: `Monthly service request limit reached (${limit}/month on your plan).` })
    }
  }

  // ── Optional product: find or auto-register by external id ────────────────
  let productServiceId: string | null = null
  let productDisplayName: string | null = null
  if (productId) {
    const { data: existing } = await supabase
      .from('products_services')
      .select('id, name')
      .eq('company_id', company.id)
      .eq('external_id', productId)
      .maybeSingle()
    if (existing) {
      productServiceId = (existing as any).id
      productDisplayName = (existing as any).name
    } else {
      productDisplayName = productName || productId
      const base = toSlug(productDisplayName) || 'product'
      let slug = base
      for (let i = 2; ; i++) {
        const { data: taken } = await supabase
          .from('products_services')
          .select('id')
          .eq('company_id', company.id)
          .eq('slug', slug)
          .maybeSingle()
        if (!taken) break
        slug = `${base}-${i}`
      }
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
      if (createErr || !created) return json(500, { error: 'Failed to register the product. Try again.' })
      productServiceId = (created as any).id
    }
  }

  // ── Create the request (dedup on company + order + email) ─────────────────
  const { data: reqRow, error: insertErr } = await supabase
    .from('service_requests')
    .insert({
      company_id: company.id,
      product_service_id: productServiceId,
      customer_email: customerEmail,
      customer_name: customerName,
      order_ref: orderId,
      purchase_date: purchaseDate,
      source: 'service',
    })
    .select('id, token')
    .single()

  if (insertErr || !reqRow) {
    if (insertErr?.code === '23505') return json(200, { status: 'already_sent' })
    return json(500, { error: 'Could not create the request. Try again.' })
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const serviceUrl = `${siteUrl}/service/${(reqRow as any).token}`
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'Trust Cabbage <noreply@trustcabbage.com>'

  try {
    const { data: sent, error: sendErr } = await resend.emails.send({
      from: fromAddress,
      to: [customerEmail],
      subject: productDisplayName
        ? `How was your ${productDisplayName} from ${company.name}?`
        : `How was your experience with ${company.name}?`,
      html: buildServiceRequestEmail(company.name, customerName, productDisplayName, serviceUrl),
    })

    if (sendErr) {
      await supabase.from('service_requests').update({ status: 'failed' }).eq('id', (reqRow as any).id)
      return json(502, { error: 'Email delivery failed. The request was not sent.' })
    }

    await supabase.from('service_requests').update({ resend_id: (sent as any)?.id ?? null }).eq('id', (reqRow as any).id)
    return json(200, { status: 'sent' })
  } catch {
    await supabase.from('service_requests').update({ status: 'failed' }).eq('id', (reqRow as any).id)
    return json(502, { error: 'Email delivery failed. The request was not sent.' })
  }
}

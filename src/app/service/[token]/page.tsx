import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { ResponseFlow } from './_components/response-flow'
import { CaseStatus, type CaseData, type CaseEvent } from './_components/case-status'
import { CheckCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Share your experience | Trust Cabbage', robots: { index: false } }

type Props = { params: Promise<{ token: string }> }

export default async function ServiceTokenPage({ params }: Props) {
  const { token } = await params
  if (!token || token.length < 16) notFound()

  // Token pages are anonymous by design: possession of the emailed link is the
  // customer's verification, so lookups need the service role (RLS hides
  // service_requests from anon clients).
  const supabase = createAdminClient()

  const { data: reqRaw } = await supabase
    .from('service_requests')
    .select('id, status, customer_name, product_service_id, companies(name, slug), products_services(name, slug, external_id)')
    .eq('token', token)
    .maybeSingle()

  if (!reqRaw) notFound()
  const request = reqRaw as any
  const company = request.companies as { name: string; slug: string }
  const product = request.products_services as { name: string; slug: string | null; external_id: string | null } | null

  // First open: invited → opened (fire-and-forget bookkeeping)
  if (request.status === 'invited') {
    await supabase.from('service_requests').update({ status: 'opened' }).eq('id', request.id)
  }

  const productParam = product?.slug ?? product?.external_id ?? null
  const reviewUrl = `/company/${company.slug}/write-review?src=service${productParam ? `&product=${encodeURIComponent(productParam)}` : ''}`

  // After submission the link becomes the customer's case tracker.
  let caseData: CaseData | null = null
  let events: CaseEvent[] = []
  if (request.status === 'submitted') {
    const { data: caseRaw } = await supabase
      .from('service_cases')
      .select('id, type, status, title, body, category, resolution_summary, publish_at, created_at, first_company_reply_at')
      .eq('request_id', request.id)
      .maybeSingle()
    if (caseRaw) {
      caseData = caseRaw as any
      const { data: eventsRaw } = await supabase
        .from('service_case_events')
        .select('id, author, kind, body, created_at')
        .eq('case_id', (caseRaw as any).id)
        .order('created_at', { ascending: true })
      events = (eventsRaw ?? []) as any
    }
  }

  return (
    <div className="min-h-screen bg-[#1e1b4b] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <p className="text-lg font-black text-white">
            Trust<span className="text-[#a78bfa]">Cabbage</span>
          </p>
        </div>

        {request.status === 'submitted' ? (
          caseData ? (
            <CaseStatus
              token={token}
              companyName={company.name}
              companySlug={company.slug}
              reviewUrl={reviewUrl}
              caseData={caseData}
              events={events}
            />
          ) : (
            // Submitted but no case row: they went down the review lane.
            <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h1 className="text-xl font-black text-white">Already submitted</h1>
              <p className="text-sm text-slate-400 mt-2">
                You have already responded to this request. Thank you!
              </p>
              <Link
                href={`/company/${company.slug}`}
                className="inline-block mt-5 text-sm font-black text-violet-300 hover:text-violet-200 transition-colors"
              >
                Visit {company.name} on Trust Cabbage →
              </Link>
            </div>
          )
        ) : (
          <ResponseFlow
            token={token}
            companyName={company.name}
            companySlug={company.slug}
            customerName={request.customer_name ?? ''}
            productName={product?.name ?? null}
            productParam={productParam}
          />
        )}
      </div>
    </div>
  )
}

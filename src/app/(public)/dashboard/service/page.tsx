import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { RequestForm } from './_components/request-form'
import { CaseCard, type DashCase, type DashCaseEvent } from './_components/case-card'
import { ChevronLeft, HeartHandshake, Clock, AlertTriangle, Star } from 'lucide-react'
import { ServiceBadge, qualifiesForServiceBadge } from '@/components/service-badge'

export const metadata: Metadata = { title: 'Service Desk | Dashboard' }

const REQUEST_STATUS_STYLES: Record<string, string> = {
  invited: 'bg-slate-100 text-slate-600',
  opened: 'bg-blue-50 text-blue-700',
  submitted: 'bg-green-50 text-green-700',
  failed: 'bg-rose-50 text-rose-700',
  expired: 'bg-slate-100 text-slate-400',
}

function hoursUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600000))
}

export default async function ServiceDeskPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/service')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id as string

  const [{ data: productsRaw }, { data: requestsRaw }, { data: casesRaw }, { data: coStatsRaw }, { count: serviceReviewCount }] = await Promise.all([
    supabase
      .from('products_services')
      .select('id, name')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('service_requests')
      .select('id, customer_name, customer_email, status, order_ref, created_at, products_services(name)')
      .eq('company_id', companyId)
      // Only requests sent deliberately from this form; the piggyback rows
      // created inside review-invite emails stay out of the log (their cases
      // still surface in the inbox above if the customer raises something).
      .eq('source', 'service')
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('service_cases')
      .select('id, type, category, satisfaction, title, body, expected_resolution, status, resolution_summary, customer_display, publish_at, created_at, products_services(name)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('companies')
      .select('service_complaints_total, service_resolved_total, service_avg_resolution_hours, service_avg_first_reply_hours')
      .eq('id', companyId)
      .single(),
    supabase
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('review_source', 'service'),
  ])

  const products = (productsRaw ?? []) as any[]
  const requests = (requestsRaw ?? []) as any[]
  const cases: DashCase[] = ((casesRaw ?? []) as any[]).map(c => ({
    ...c,
    product_name: c.products_services?.name ?? null,
  }))

  // Thread events for all listed cases in one query
  const caseIds = cases.map(c => c.id)
  const { data: eventsRaw } = caseIds.length > 0
    ? await supabase
        .from('service_case_events')
        .select('id, case_id, author, kind, body, created_at')
        .in('case_id', caseIds)
        .order('created_at', { ascending: true })
    : { data: [] }
  const eventsByCase: Record<string, DashCaseEvent[]> = {}
  for (const e of (eventsRaw ?? []) as any[]) {
    if (!eventsByCase[e.case_id]) eventsByCase[e.case_id] = []
    eventsByCase[e.case_id].push(e)
  }

  // Performance stats (trigger-maintained on companies, complaints only)
  const coStats = coStatsRaw as any
  const complaintsTotal: number = coStats?.service_complaints_total ?? 0
  const resolvedTotal: number = coStats?.service_resolved_total ?? 0
  const resolutionRate = complaintsTotal > 0 ? Math.round(resolvedTotal / complaintsTotal * 100) : null
  const requestsSubmitted = requests.filter(r => r.status === 'submitted').length
  const categoryCounts = new Map<string, number>()
  for (const c of cases) {
    if (c.type !== 'complaint' || !c.category) continue
    categoryCounts.set(c.category, (categoryCounts.get(c.category) ?? 0) + 1)
  }
  const topCategories = Array.from(categoryCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)
  const badgeStats = {
    complaints: complaintsTotal,
    resolved: resolvedTotal,
    avgResolutionHours: coStats?.service_avg_resolution_hours != null ? Number(coStats.service_avg_resolution_hours) : null,
  }
  const hasBadge = qualifiesForServiceBadge(badgeStats)

  const openComplaints = cases.filter(c => c.type === 'complaint' && c.status === 'open')
  const awaitingCustomer = cases.filter(c => c.type === 'complaint' && c.status === 'resolution_offered')
  const closedComplaints = cases.filter(c => c.type === 'complaint' && (c.status === 'resolved' || c.status === 'unresolved'))
  const feedback = cases.filter(c => c.type === 'feedback')

  const sections: { title: string; hint: string; items: DashCase[] }[] = [
    { title: 'Open complaints', hint: 'Respond fast, these publish on schedule whether or not you act.', items: openComplaints },
    { title: 'Awaiting customer confirmation', hint: 'You offered a resolution, the customer decides.', items: awaitingCustomer },
    { title: 'Feedback', hint: 'Quick positive feedback from your customers, already public.', items: feedback },
    { title: 'Closed complaints', hint: 'Resolved and unresolved cases, part of your public record.', items: closedComplaints },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="bg-[#1e1b4b] pt-8 pb-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-xs text-violet-300/70 hover:text-violet-200 transition-colors mb-3">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-teal-500/20 flex items-center justify-center">
              <HeartHandshake className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Service Desk</h1>
              <p className="text-slate-400 text-sm">Collect feedback, resolve complaints in public, earn trust.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Open complaints alert */}
        {openComplaints.length > 0 && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <span className="font-black">{openComplaints.length} open complaint{openComplaints.length !== 1 ? 's' : ''}.</span>{' '}
              Earliest publishes in {Math.min(...openComplaints.map(c => hoursUntil(c.publish_at)))}h.
              Resolve before publication and it goes public already marked resolved.
            </p>
          </div>
        )}

        {/* Performance stats */}
        {complaintsTotal > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-black text-slate-950">Your service record</h2>
              {hasBadge
                ? <ServiceBadge />
                : (
                  <span className="text-xs text-slate-400 font-bold">
                    Badge: {Math.max(0, 10 - complaintsTotal) > 0
                      ? `${Math.max(0, 10 - complaintsTotal)} more resolved cases needed`
                      : resolutionRate !== null && resolutionRate < 80
                        ? 'resolution rate must reach 80%'
                        : 'typical resolution must be under 72h'}
                  </span>
                )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className={`text-2xl font-black ${resolutionRate !== null && resolutionRate >= 80 ? 'text-green-600' : 'text-slate-950'}`}>{resolutionRate}%</p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">resolution rate</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-950">{badgeStats.avgResolutionHours !== null ? `~${Math.round(badgeStats.avgResolutionHours)}h` : '-'}</p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">avg time to resolve</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-950">{coStats?.service_avg_first_reply_hours != null ? `~${Math.round(Number(coStats.service_avg_first_reply_hours))}h` : '-'}</p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">avg first reply</p>
              </div>
              <div className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-2xl font-black text-slate-950 flex items-center gap-1">{serviceReviewCount ?? 0} <Star className="h-4 w-4 text-amber-400 fill-amber-400" /></p>
                <p className="text-xs text-slate-500 font-bold mt-0.5">reviews via requests</p>
              </div>
            </div>
            {topCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-400 font-bold">Top complaint areas:</span>
                {topCategories.map(([cat, n]) => (
                  <span key={cat} className="rounded-full bg-slate-100 text-slate-600 font-bold px-2.5 py-1">{cat} ({n})</span>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              {requestsSubmitted} of {requests.length} recent requests got a response.
              Public metrics on your company page count published cases only.
            </p>
          </div>
        )}

        {/* Send requests */}
        <div>
          <h2 className="text-lg font-black text-slate-950 mb-1">Send a feedback request</h2>
          <p className="text-sm text-slate-500 mb-4">
            We email your customer a neutral &ldquo;how was your experience?&rdquo; link.
            Happy customers are guided to a review, unhappy ones raise a complaint you can resolve before it publishes.
          </p>
          <RequestForm products={products} />
        </div>

        {/* Inbox */}
        {cases.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <Clock className="h-6 w-6 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No responses yet. Send your first requests above.</p>
          </div>
        ) : (
          sections.filter(s => s.items.length > 0).map(section => (
            <div key={section.title}>
              <h2 className="text-lg font-black text-slate-950">{section.title} <span className="text-slate-400 font-bold text-sm">({section.items.length})</span></h2>
              <p className="text-xs text-slate-500 mb-3">{section.hint}</p>
              <div className="space-y-3">
                {section.items.map(c => (
                  <CaseCard key={c.id} kase={c} events={eventsByCase[c.id] ?? []} />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Request log */}
        <div>
          <h2 className="text-lg font-black text-slate-950 mb-4">Requests sent</h2>
          {requests.length === 0 ? (
            <p className="text-sm text-slate-500">Nothing sent yet.</p>
          ) : (
            <div className="rounded-xl bg-white border border-slate-200 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-400 uppercase tracking-wide">
                    <th className="px-4 py-3 font-black">Customer</th>
                    <th className="px-4 py-3 font-black">Product</th>
                    <th className="px-4 py-3 font-black">Status</th>
                    <th className="px-4 py-3 font-black">Sent</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map(r => (
                    <tr key={r.id} className="border-b border-slate-50 last:border-0">
                      <td className="px-4 py-3">
                        <p className="font-bold text-slate-950">{r.customer_name}</p>
                        <p className="text-xs text-slate-400">{r.customer_email}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{(r as any).products_services?.name ?? '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[11px] font-black px-2 py-0.5 rounded-full ${REQUEST_STATUS_STYLES[r.status] ?? REQUEST_STATUS_STYLES.invited}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

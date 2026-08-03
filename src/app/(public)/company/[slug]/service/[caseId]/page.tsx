import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CheckCircle, Building2, User, ChevronLeft, ShieldCheck } from 'lucide-react'

type Props = { params: Promise<{ slug: string; caseId: string }> }

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolution_offered: { label: 'Resolution offered', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  unresolved: { label: 'Unresolved', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

// Public reads run on the anon/user client: RLS only exposes cases whose
// publish_at has passed, so unpublished complaints 404 here automatically.
async function loadCase(slug: string, caseId: string) {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const { data: caseRaw } = await supabase
    .from('service_cases')
    .select('id, type, category, title, body, expected_resolution, status, resolution_summary, customer_display, created_at, resolved_at, publish_at, companies(name, slug), products_services(name, slug)')
    .eq('id', caseId)
    .lte('publish_at', nowIso)
    .maybeSingle()
  if (!caseRaw) return null
  const kase = caseRaw as any
  if (kase.companies?.slug !== slug) return null
  return { supabase, kase }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, caseId } = await params
  const loaded = await loadCase(slug, caseId)
  if (!loaded) return { title: 'Complaint | Trust Cabbage' }
  const { kase } = loaded
  const company = kase.companies.name
  const resolved = kase.status === 'resolved'
  const title = `${kase.title} | ${company} ${kase.type === 'complaint' ? 'complaint' : 'feedback'}${resolved ? ', resolved' : ''}`
  const description = resolved
    ? `A verified customer's complaint about ${company}, resolved and confirmed by the customer on Trust Cabbage.`
    : `A verified customer's ${kase.type} about ${company}, handled publicly on Trust Cabbage.`
  return {
    title,
    description,
    alternates: { canonical: `/company/${slug}/service/${caseId}` },
    openGraph: { title, description },
  }
}

export default async function PublicCasePage({ params }: Props) {
  const { slug, caseId } = await params
  const loaded = await loadCase(slug, caseId)
  if (!loaded) notFound()
  const { supabase, kase } = loaded

  const { data: eventsRaw } = await supabase
    .from('service_case_events')
    .select('id, author, kind, body, created_at')
    .eq('case_id', kase.id)
    .order('created_at', { ascending: true })
  const events = (eventsRaw ?? []) as any[]

  const companyName = kase.companies.name as string
  const st = STATUS[kase.status] ?? STATUS.open
  const resolvedHours = kase.resolved_at
    ? Math.max(1, Math.round((new Date(kase.resolved_at).getTime() - new Date(kase.created_at).getTime()) / 3600000))
    : null

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <nav className="text-xs text-slate-400 mb-5">
          <Link href={`/company/${slug}`} className="hover:text-slate-600 transition-colors inline-flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" /> {companyName}
          </Link>
          <span className="mx-2">/</span>
          <Link href={`/company/${slug}?tab=service`} className="hover:text-slate-600 transition-colors">Service & complaints</Link>
        </nav>

        <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${st.cls}`}>{st.label}</span>
            {kase.category && <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{kase.category}</span>}
            {kase.products_services?.name && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">{kase.products_services.name}</span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-950 mt-3 leading-snug">{kase.title}</h1>
          <p className="text-xs text-slate-400 mt-1.5">
            Raised by {kase.customer_display} · Verified customer · {fmt(kase.created_at)}
          </p>

          {/* Resolved banner */}
          {kase.status === 'resolved' && (
            <div className="mt-5 rounded-xl bg-green-50 border border-green-200 px-4 py-3.5">
              <p className="text-sm text-green-800 font-black flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" />
                Resolved in {resolvedHours}h, confirmed by the customer
              </p>
              {kase.resolution_summary && (
                <p className="text-sm text-green-700 mt-1">{kase.resolution_summary}</p>
              )}
            </div>
          )}

          {/* Thread */}
          <div className="mt-6 space-y-5">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-bold">{kase.customer_display} · {fmt(kase.created_at)}</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{kase.body}</p>
                {kase.expected_resolution && (
                  <p className="text-xs text-slate-500 mt-2">
                    <span className="font-black">Expected resolution:</span> {kase.expected_resolution}
                  </p>
                )}
              </div>
            </div>

            {events.map(e => (
              <div key={e.id} className="flex gap-3">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.author === 'company' ? 'bg-violet-100' : 'bg-slate-100'}`}>
                  {e.author === 'company' ? <Building2 className="h-4 w-4 text-violet-600" /> : <User className="h-4 w-4 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-bold">
                    {e.author === 'company' ? companyName : kase.customer_display} · {fmt(e.created_at)}
                    {e.kind === 'resolution_offer' && <span className="text-blue-600 ml-1">offered a resolution</span>}
                    {e.kind === 'customer_confirm' && <span className="text-green-600 ml-1">confirmed resolved</span>}
                    {e.kind === 'customer_decline' && <span className="text-rose-600 ml-1">said not resolved</span>}
                  </p>
                  {e.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-line leading-relaxed">{e.body}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Trust footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-start gap-3">
            <ShieldCheck className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              This is a verified customer complaint handled through Trust Cabbage Service Desk.
              Neither the customer nor {companyName} can edit or delete this thread, and only the customer can mark it resolved.
              Complaints appear publicly no later than 72 hours after submission.
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          Powered by <span className="font-black text-slate-500">Trust Cabbage Service Desk</span> ·{' '}
          <Link href="/for-businesses" className="text-[#6d28d9] font-bold hover:underline">Run your post-sales service in public</Link>
        </p>
      </div>
    </div>
  )
}

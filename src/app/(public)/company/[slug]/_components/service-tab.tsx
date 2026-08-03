import Link from 'next/link'
import { CheckCircle, Clock, ShieldCheck, MessageSquare } from 'lucide-react'

export interface PublicServiceCase {
  id: string
  type: 'feedback' | 'complaint'
  category: string | null
  satisfaction: number | null
  title: string
  body: string
  status: string
  resolution_summary: string | null
  customer_display: string
  created_at: string
  resolved_at: string | null
  products_services: { name: string; slug: string | null } | null
}

export interface ServiceStats {
  complaints: number
  resolved: number
  open: number
  avgResolutionHours: number | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolution_offered: { label: 'Resolution offered', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  unresolved: { label: 'Unresolved', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

function resolutionHours(c: PublicServiceCase): number | null {
  if (!c.resolved_at) return null
  return Math.max(1, Math.round((new Date(c.resolved_at).getTime() - new Date(c.created_at).getTime()) / 3600000))
}

export function ServiceTab({ companyName, companySlug, cases, stats }: {
  companyName: string
  companySlug: string
  cases: PublicServiceCase[]
  stats: ServiceStats
}) {
  const complaints = cases.filter(c => c.type === 'complaint')
  const feedback = cases.filter(c => c.type === 'feedback')
  const resolutionRate = stats.complaints > 0 ? Math.round(stats.resolved / stats.complaints * 100) : null

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-black text-slate-950">Service & complaints</h2>
        <p className="text-sm text-slate-500 mt-1">
          Real complaints from verified customers, and how {companyName} handled them. Nothing here can be edited or removed by the company.
        </p>
      </div>

      {/* Metrics strip: only once there is enough signal */}
      {stats.complaints >= 3 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <p className={`text-2xl font-black ${resolutionRate !== null && resolutionRate >= 80 ? 'text-green-600' : resolutionRate !== null && resolutionRate >= 50 ? 'text-amber-600' : 'text-rose-600'}`}>
              {resolutionRate}%
            </p>
            <p className="text-xs text-slate-500 font-bold mt-0.5">complaints resolved</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <p className="text-2xl font-black text-slate-950">
              {stats.avgResolutionHours !== null ? `~${stats.avgResolutionHours}h` : '-'}
            </p>
            <p className="text-xs text-slate-500 font-bold mt-0.5">typical time to resolve</p>
          </div>
          <div className="rounded-xl bg-white border border-slate-200 p-4 text-center">
            <p className="text-2xl font-black text-slate-950">{stats.open}</p>
            <p className="text-xs text-slate-500 font-bold mt-0.5">open right now</p>
          </div>
        </div>
      )}

      {/* Complaints timeline */}
      {complaints.length > 0 && (
        <div className="space-y-3">
          {complaints.map(c => {
            const st = STATUS[c.status] ?? STATUS.open
            const hours = resolutionHours(c)
            return (
              <Link
                key={c.id}
                href={`/company/${companySlug}/service/${c.id}`}
                className="block rounded-xl bg-white border border-slate-200 p-5 hover:border-violet-300 hover:shadow-sm transition-all"
              >
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                  {c.status === 'resolved' && hours !== null && (
                    <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-green-50 text-green-700 inline-flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Resolved in {hours}h, confirmed by customer
                    </span>
                  )}
                  {c.category && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{c.category}</span>}
                  {c.products_services?.name && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{c.products_services.name}</span>
                  )}
                </div>
                <p className="font-black text-slate-950">{c.title}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2 whitespace-pre-line">{c.body}</p>
                {c.status === 'resolved' && c.resolution_summary && (
                  <p className="text-sm text-green-700 mt-2">
                    <span className="font-black">Resolution:</span> {c.resolution_summary}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">
                  {c.customer_display} · Verified customer · {new Date(c.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </Link>
            )
          })}
        </div>
      )}

      {/* Quick feedback strip */}
      {feedback.length > 0 && (
        <div>
          <h3 className="text-sm font-black text-slate-950 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-violet-500" /> Recent feedback
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {feedback.slice(0, 6).map(f => (
              <div key={f.id} className="rounded-xl bg-white border border-slate-200 p-4">
                <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{f.body}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {f.customer_display} · Verified customer{f.satisfaction ? ` · ${f.satisfaction}/5` : ''}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* The trust contract, spelled out */}
      <div className="rounded-xl bg-slate-100 border border-slate-200 px-5 py-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          Complaints are raised through email requests {companyName} sends its own customers, so every complainant is a verified customer.
          Companies get up to 72 hours to respond before a complaint appears here, and publication cannot be delayed or prevented.
          Only the customer can mark a complaint resolved.
        </p>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-400">
        <Clock className="h-3.5 w-3.5" />
        Powered by Trust Cabbage Service Desk.{' '}
        <Link href="/for-businesses" className="text-[#6d28d9] font-bold hover:underline">Run your post-sales service in public →</Link>
      </div>
    </div>
  )
}

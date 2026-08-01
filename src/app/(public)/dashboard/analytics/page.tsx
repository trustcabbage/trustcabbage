import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, TrendingUp } from 'lucide-react'

export const metadata: Metadata = { title: 'Analytics | Trust Cabbage Dashboard' }

type ReviewRow = {
  rating_overall: number | null
  would_recommend: string | null
  review_source: string | null
  association_type: string | null
  created_at: string
  helpful_votes: number | null
  review_type: string | null
}

function pct(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0
}

const SOURCE_LABELS: Record<string, string> = {
  direct: 'Direct visit',
  invite_link: 'Invite link',
  widget: 'Widget',
  whatsapp: 'WhatsApp',
  csv_invite: 'Email invite',
  email: 'Email',
}

const ASSOC_LABELS: Record<string, string> = {
  current_client: 'Current client',
  past_client: 'Past client',
  pilot: 'Pilot',
  partner: 'Partner',
  vendor: 'Vendor',
  evaluator: 'Evaluator',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/analytics')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const [{ data: coRaw }, { data: reviewsRaw }] = await Promise.all([
    supabase.from('companies').select('name, slug, business_type').eq('id', companyId).single(),
    supabase
      .from('reviews')
      .select('rating_overall, would_recommend, review_source, association_type, created_at, helpful_votes, review_type')
      .eq('company_id', companyId)
      .eq('status', 'published')
      .order('created_at', { ascending: true }),
  ])

  const co = coRaw as any
  const reviews = (reviewsRaw ?? []) as ReviewRow[]
  const total = reviews.length

  // Key stats
  const avgRating = total > 0
    ? reviews.reduce((sum, r) => sum + (r.rating_overall ?? 0), 0) / total
    : 0
  const helpfulVotes = reviews.reduce((sum, r) => sum + (r.helpful_votes ?? 0), 0)
  const recommendYes = reviews.filter(r => r.would_recommend === 'yes').length
  const recommendPct = pct(recommendYes, total)

  // Monthly trend, last 12 months
  const now = new Date()
  type MonthBucket = { key: string; label: string; count: number }
  const months: MonthBucket[] = []
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('en-IN', { month: 'short' })
    months.push({ key, label, count: 0 })
  }
  for (const r of reviews) {
    const d = new Date(r.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const m = months.find(mb => mb.key === key)
    if (m) m.count++
  }
  const maxMonthCount = Math.max(...months.map(m => m.count), 1)

  // Rating distribution 5→1
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => Math.round(r.rating_overall ?? 0) === star).length,
  }))

  // Would recommend breakdown
  const recDist = [
    { key: 'yes', label: 'Yes', color: 'bg-green-500' },
    { key: 'conditional', label: 'Conditional', color: 'bg-amber-400' },
    { key: 'no', label: 'No', color: 'bg-rose-500' },
  ].map(r => ({ ...r, count: reviews.filter(rv => rv.would_recommend === r.key).length }))
  const recTotal = recDist.reduce((s, r) => s + r.count, 0)

  // Review source
  const sourceMap = new Map<string, number>()
  for (const r of reviews) {
    const s = r.review_source ?? 'direct'
    sourceMap.set(s, (sourceMap.get(s) ?? 0) + 1)
  }
  const sourceDist = [...sourceMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }))

  // Association type, B2B reviews (review_type === 'b2b' or null for pre-migration reviews)
  const isB2B = co.business_type === 'business_services' || co.business_type === 'both'
  const assocMap = new Map<string, number>()
  if (isB2B) {
    for (const r of reviews.filter(r => r.review_type === 'b2b' || r.review_type === null)) {
      if (!r.association_type) continue
      assocMap.set(r.association_type, (assocMap.get(r.association_type) ?? 0) + 1)
    }
  }
  const assocDist = [...assocMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([key, count]) => ({ key, count }))
  const assocTotal = assocDist.reduce((s, a) => s + a.count, 0)

  const BAR_HEIGHT = 120

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header breadcrumb */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-xs font-black text-slate-400 hover:text-[#6d28d9] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-700">Analytics</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Page title */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-950">Analytics</h1>
            <p className="text-sm text-slate-400 mt-0.5">Review performance for {co.name}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 pt-1">
            <TrendingUp className="h-3.5 w-3.5" />
            {total} review{total !== 1 ? 's' : ''} all time
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: 'Total reviews',
              value: total || '—',
              sub: total === 1 ? '1 review' : `${total} reviews`,
            },
            {
              label: 'Average rating',
              value: avgRating > 0 ? avgRating.toFixed(2) : '—',
              sub: 'out of 5.0',
            },
            {
              label: 'Would recommend',
              value: total > 0 ? `${recommendPct}%` : '—',
              sub: `${recommendYes} of ${total} said yes`,
            },
            {
              label: 'Helpful votes',
              value: helpfulVotes || '—',
              sub: 'total across all reviews',
            },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-black text-slate-950 mt-1">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Monthly bar chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-black text-slate-950 text-sm mb-6">Reviews per month (last 12 months)</h2>
          {total === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No reviews yet, share your invite link to start collecting.</p>
          ) : (
            <>
              <div
                className="flex items-end gap-1"
                style={{ height: `${BAR_HEIGHT}px` }}
              >
                {months.map(m => {
                  const barH = maxMonthCount > 0
                    ? Math.max(3, Math.round((m.count / maxMonthCount) * BAR_HEIGHT))
                    : 3
                  return (
                    <div
                      key={m.key}
                      className="flex-1 rounded-t-sm transition-all"
                      style={{
                        height: `${barH}px`,
                        background: m.count > 0 ? '#6d28d9' : '#e2e8f0',
                      }}
                      title={`${m.label}: ${m.count} review${m.count !== 1 ? 's' : ''}`}
                    />
                  )
                })}
              </div>
              {/* Count row */}
              <div className="flex items-center gap-1 mt-1.5 mb-1">
                {months.map(m => (
                  <div key={m.key} className="flex-1 text-center">
                    {m.count > 0 && (
                      <span className="text-[10px] font-black text-[#6d28d9]">{m.count}</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Month labels */}
              <div className="flex items-center gap-1 border-t border-slate-100 pt-2">
                {months.map(m => (
                  <div key={m.key} className="flex-1 text-center">
                    <span className="text-[9px] text-slate-400 leading-none">{m.label}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Three-column breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Rating distribution */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-black text-slate-950 text-sm mb-4">Rating distribution</h2>
            {total === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {ratingDist.map(r => (
                  <div key={r.star} className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-500 w-5 flex-shrink-0">{r.star}★</span>
                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${pct(r.count, total)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-600 w-5 text-right flex-shrink-0">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Would recommend */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-black text-slate-950 text-sm mb-4">Would recommend</h2>
            {recTotal === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-3">
                {recDist.map(r => (
                  <div key={r.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-600">{r.label}</span>
                      <span className="text-xs font-black text-slate-700">{pct(r.count, recTotal)}%</span>
                    </div>
                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${r.color}`}
                        style={{ width: `${pct(r.count, recTotal)}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5">{r.count} reviewer{r.count !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Review source */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-black text-slate-950 text-sm mb-4">Review source</h2>
            {sourceDist.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No data yet</p>
            ) : (
              <div className="space-y-2.5">
                {sourceDist.map(s => (
                  <div key={s.key} className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 flex-1 truncate min-w-0">
                      {SOURCE_LABELS[s.key] ?? s.key}
                    </span>
                    <div className="w-16 h-3 bg-slate-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full bg-violet-400 rounded-full transition-all"
                        style={{ width: `${pct(s.count, total)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-600 w-5 text-right flex-shrink-0">{s.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Association type, B2B companies only */}
        {isB2B && assocDist.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
            <h2 className="font-black text-slate-950 text-sm mb-1">Reviewer relationship</h2>
            <p className="text-xs text-slate-400 mb-4">B2B reviews only · {assocTotal} reviews</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {assocDist.map(a => (
                <div key={a.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700">{ASSOC_LABELS[a.key] ?? a.key}</span>
                    <span className="text-xs font-black text-slate-500">{pct(a.count, assocTotal)}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#6d28d9] rounded-full transition-all"
                      style={{ width: `${pct(a.count, assocTotal)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{a.count} review{a.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state prompt */}
        {total === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-12 text-center">
            <p className="text-3xl mb-3">📊</p>
            <p className="text-base font-black text-slate-950">No analytics data yet</p>
            <p className="text-sm text-slate-500 mt-2 mb-5">
              Analytics populate as reviews come in. Share your invite link to get your first review.
            </p>
            <Link
              href="/dashboard/invites"
              className="inline-block rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors"
            >
              Send review invites →
            </Link>
          </div>
        )}

      </div>
    </div>
  )
}

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { VerifiedBadge } from '@/components/verified-badge'
import { CheckCircle, AlertCircle, ExternalLink, Mail, ArrowRight, Code2, QrCode, Settings, BarChart2, Star, Terminal, MessageCircleQuestion, HeartHandshake } from 'lucide-react'
import { ShareTools } from './_components/share-tools'
import { CompanySwitcher, type SwitcherCompany } from './_components/company-switcher'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id, display_name')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const [{ data: coRaw }, { data: categoriesRaw }, { data: productsRaw }, { data: recentReviewsRaw }, { data: openComplaintsRaw }, { data: membershipsRaw }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('company_categories').select('categories(id, name, slug, parent_id)').eq('company_id', companyId),
    supabase.from('products_services').select('id, name, type, is_active').eq('company_id', companyId).eq('is_active', true).order('sort_order'),
    supabase.from('reviews').select('id, rating_overall, what_went_well, created_at, is_anonymous, users(display_name)').eq('company_id', companyId).eq('status', 'published').order('created_at', { ascending: false }).limit(5),
    supabase.from('service_cases').select('id, publish_at').eq('company_id', companyId).eq('type', 'complaint').eq('status', 'open'),
    // RLS scopes this to the caller's own rows (user_id = auth.uid()), safe
    // on the regular client. Powers the company switcher, only shown when
    // this account belongs to more than one company.
    supabase.from('company_members').select('companies(id, name, slug, logo_url)').eq('user_id', user.id).order('created_at', { ascending: true }),
  ])

  const co = coRaw as any
  const myCompanies: SwitcherCompany[] = ((membershipsRaw ?? []) as any[]).map(m => m.companies).filter(Boolean)

  const BUSINESS_TYPE_LABELS: Record<string, string> = {
    business_services: 'Business Services Company',
    online_b2c: 'Online B2C Company',
    retail_chain: 'Retail Chain / Retail Store',
    both: 'B2B + B2C',
  }
  const categories = ((categoriesRaw ?? []) as any[]).map(r => r.categories).filter(Boolean)
  const products = (productsRaw ?? []) as any[]
  const recentReviews = (recentReviewsRaw ?? []) as any[]

  // Open Service Desk complaints, publication clock running
  const openComplaints = (openComplaintsRaw ?? []) as any[]
  const earliestPublishHours = openComplaints.length > 0
    ? Math.max(0, Math.min(...openComplaints.map(c => Math.round((new Date(c.publish_at).getTime() - Date.now()) / 3600000))))
    : null

  // Unanswered product questions across all of this company's products
  let unansweredCount = 0
  const productIds = products.map(p => p.id)
  if (productIds.length > 0) {
    const { data: questionRows } = await supabase
      .from('product_questions')
      .select('id')
      .in('product_id', productIds)
    const questionIds = ((questionRows ?? []) as any[]).map(q => q.id)
    if (questionIds.length > 0) {
      const { data: companyAnswers } = await supabase
        .from('product_answers')
        .select('question_id')
        .in('question_id', questionIds)
        .eq('is_company_answer', true)
      const answeredIds = new Set(((companyAnswers ?? []) as any[]).map(a => a.question_id))
      unansweredCount = questionIds.filter(id => !answeredIds.has(id)).length
    }
  }

  // Profile completeness checklist
  const checks = [
    { label: 'Company name', done: !!co.name },
    { label: 'Description', done: !!co.description },
    { label: 'Website', done: !!co.website },
    { label: 'Logo', done: !!co.logo_url },
    { label: 'City & state', done: !!co.city && !!co.state },
    { label: 'At least one category', done: categories.length > 0 },
    { label: 'Products / services listed', done: products.length > 0 },
    { label: 'Founded year', done: !!co.founded_year },
  ]
  const completedCount = checks.filter(c => c.done).length
  const completionPct = Math.round((completedCount / checks.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {co.logo_url
                ? <img src={co.logo_url} alt={co.name} className="h-10 w-10 object-cover" />
                : <span className="font-black text-[#6d28d9] text-base">{co.name[0]}</span>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-950 text-sm">{co.name}</span>
                {co.is_verified && <VerifiedBadge />}
                <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-black">Claimed</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{[co.city, co.state].filter(Boolean).join(', ') || 'Location not set'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {myCompanies.length > 1 && <CompanySwitcher current={companyId} companies={myCompanies} />}
            <Link href={`/company/${co.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
              <ExternalLink className="h-3.5 w-3.5" /> View public page
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Overall rating', value: co.average_rating > 0 ? co.average_rating.toFixed(1) : '—', sub: co.total_reviews > 0 ? `${co.total_reviews} reviews` : 'No reviews yet' },
            { label: 'Profile complete', value: `${completionPct}%`, sub: `${completedCount} of ${checks.length} fields` },
            { label: 'Products listed', value: products.length || '0', sub: products.length === 1 ? '1 active' : `${products.length} active` },
            { label: 'Categories', value: categories.length || '0', sub: categories.length === 1 ? '1 category' : `${categories.length} categories` },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 shadow-sm">
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-black text-slate-950 mt-1">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Open Service Desk complaints */}
        {openComplaints.length > 0 && (
          <Link
            href="/dashboard/service"
            className="flex items-center gap-3 rounded-xl bg-rose-50 border border-rose-200 px-5 py-4 hover:bg-rose-100/60 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-rose-900">
                {openComplaints.length} open complaint{openComplaints.length !== 1 ? 's' : ''} on your Service Desk
              </p>
              <p className="text-xs text-rose-700 mt-0.5">
                {earliestPublishHours !== null && earliestPublishHours > 0
                  ? `Earliest goes public in ${earliestPublishHours}h. Resolve first and it publishes as resolved.`
                  : 'Already public. Resolving it still improves your service record.'}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-rose-600 flex-shrink-0" />
          </Link>
        )}

        {/* Unanswered product questions */}
        {unansweredCount > 0 && (
          <Link
            href="/dashboard/qa"
            className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 hover:bg-amber-100/60 transition-colors"
          >
            <div className="h-9 w-9 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="h-4.5 w-4.5 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-amber-900">
                {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''} on your products
              </p>
              <p className="text-xs text-amber-700 mt-0.5">Answer them to help buyers decide, unanswered questions cost sales.</p>
            </div>
            <ArrowRight className="h-4 w-4 text-amber-600 flex-shrink-0" />
          </Link>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left col: profile overview + completeness */}
          <div className="lg:col-span-2 space-y-5">

            {/* Profile overview */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-black text-slate-950 text-sm">Company profile</h2>
                <Link href="/dashboard/edit" className="text-xs font-black text-[#6d28d9] hover:underline">Edit profile →</Link>
              </div>
              <div className="divide-y divide-slate-100">
                {[
                  { label: 'Website', value: co.website, href: co.website },
                  { label: 'Description', value: co.description ? co.description.slice(0, 120) + (co.description.length > 120 ? '…' : '') : null },
                  { label: 'Founded', value: co.founded_year ? String(co.founded_year) : null },
                  { label: 'Team size', value: co.employee_count || null },
                  { label: 'Location', value: [co.city, co.state].filter(Boolean).join(', ') || null },
                  { label: 'GST', value: co.gst_number || null },
                  { label: 'CIN', value: co.cin_number || null },
                ].map(row => (
                  <div key={row.label} className="flex items-start gap-3 px-5 py-3">
                    <span className="text-xs font-black text-slate-400 w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                    {row.value ? (
                      row.href
                        ? <a href={row.href} target="_blank" rel="noopener noreferrer" className="text-xs text-[#6d28d9] font-bold hover:underline break-all">{row.value}</a>
                        : <span className="text-xs text-slate-700 font-bold">{row.value}</span>
                    ) : (
                      <span className="text-xs text-slate-300 italic">Not set</span>
                    )}
                  </div>
                ))}
              </div>
              {/* Company type */}
              <div className="flex items-start gap-3 px-5 py-3 border-t border-slate-100">
                <span className="text-xs font-black text-slate-400 w-24 flex-shrink-0 pt-0.5">Company type</span>
                <span className="text-xs text-slate-700 font-bold flex-1">
                  {BUSINESS_TYPE_LABELS[co.business_type] ?? co.business_type ?? 'Not set'}
                </span>
                <Link href="/dashboard/settings" className="text-xs font-black text-[#6d28d9] hover:underline flex-shrink-0">
                  Change →
                </Link>
              </div>

              {/* Categories */}
              <div className="flex items-start gap-3 px-5 py-3 border-t border-slate-100">
                <span className="text-xs font-black text-slate-400 w-24 flex-shrink-0 pt-0.5">Categories</span>
                {categories.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{categories.map((c: any) => <Link key={c.id} href={`/categories/${c.slug}`} className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-bold hover:border-[#6d28d9] hover:text-[#6d28d9] transition-colors">{c.name}</Link>)}</div>
                  : <span className="text-xs text-slate-300 italic">Not set</span>}
              </div>
              {/* Products */}
              <div className="flex items-start gap-3 px-5 py-3 border-t border-slate-100">
                <span className="text-xs font-black text-slate-400 w-24 flex-shrink-0 pt-0.5">Products</span>
                {products.length > 0
                  ? <div className="flex flex-wrap gap-1.5">{products.map((p: any) => <span key={p.id} className="rounded-full bg-slate-100 text-slate-700 px-2.5 py-0.5 text-xs font-bold capitalize">{p.name} <span className="text-slate-400">({p.type})</span></span>)}</div>
                  : <span className="text-xs text-slate-300 italic">Not set</span>}
              </div>
            </div>

            {/* Recent reviews */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-black text-slate-950 text-sm">Recent reviews</h2>
                <Link href={`/company/${co.slug}`} className="text-xs font-black text-[#6d28d9] hover:underline">View &amp; reply →</Link>
              </div>
              {recentReviews.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm text-slate-400 font-bold">No reviews yet</p>
                  <p className="text-xs text-slate-400 mt-1">Share your invite link to start collecting reviews.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {recentReviews.map((r: any) => (
                    <div key={r.id} className="px-5 py-4">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-xs font-black text-slate-700">
                          {r.is_anonymous ? 'Anonymous' : (r.users?.display_name ?? 'Reviewer')}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <StarRating value={r.rating_overall} size="sm" />
                          <span className="text-xs font-black text-slate-700">{r.rating_overall.toFixed(1)}</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{r.what_went_well}</p>
                      <p className="text-[10px] text-slate-400 mt-1.5">{new Date(r.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right col: completeness + tools */}
          <div className="space-y-5">

            {/* Profile completeness */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-black text-slate-950 text-sm">Profile completeness</h2>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-500 font-bold">{completionPct}% complete</span>
                    <span className="text-slate-400">{completedCount}/{checks.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6d28d9] transition-all"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 space-y-2.5">
                {checks.map(c => (
                  <div key={c.label} className="flex items-center gap-2.5">
                    {c.done
                      ? <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      : <AlertCircle className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />}
                    <span className={`text-xs font-bold ${c.done ? 'text-slate-700' : 'text-slate-400'}`}>{c.label}</span>
                  </div>
                ))}
              </div>
              {!co.is_verified && (
                <div className="mx-5 mb-4 rounded-lg bg-violet-50 border border-violet-200 px-3 py-2.5">
                  <p className="text-xs font-black text-violet-900">Verified badge</p>
                  <p className="text-xs text-violet-700 mt-0.5">Complete your profile and the Trust Cabbage team will review your page for a verified badge.</p>
                </div>
              )}
            </div>

            {/* Get Featured CTA */}
            {!co.is_featured && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 shadow-sm p-5">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Star className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">Get featured</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      Featured companies appear first in category listings with a Featured badge, more visibility, more reviews.
                    </p>
                    <a
                      href={`mailto:hello@trustcabbage.com?subject=Featured listing request, ${co.name}&body=Hi, I'd like to get ${co.name} featured on Trust Cabbage.`}
                      className="inline-block mt-3 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 text-xs transition-colors"
                    >
                      Request featured slot →
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Share tools */}
            <ShareTools slug={co.slug} companyName={co.name} inviteToken={co.invite_token ?? ''} />

            {/* Coming soon tools */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-black text-slate-950 text-sm">Review collection tools</h2>
              </div>
              <div className="px-5 py-4 space-y-3">
                <Link href="/dashboard/analytics" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Analytics</p>
                    <p className="text-[10px] text-slate-400">Review trends, rating breakdown, sources</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/invites" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Mail className="h-3.5 w-3.5 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Email invites</p>
                    <p className="text-[10px] text-slate-400">Send branded invite emails to clients</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/widget" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-sky-100 flex items-center justify-center flex-shrink-0">
                    <Code2 className="h-3.5 w-3.5 text-sky-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Website widget</p>
                    <p className="text-[10px] text-slate-400">Embed your rating badge on your website</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/qrcode" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                    <QrCode className="h-3.5 w-3.5 text-rose-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">QR code</p>
                    <p className="text-[10px] text-slate-400">Download print-ready PNG for proposals &amp; invoices</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/api" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Product Reviews API</p>
                    <p className="text-[10px] text-slate-400">Collect reviews per product, via API or widget</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/qa" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <MessageCircleQuestion className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Q&amp;A inbox</p>
                    <p className="text-[10px] text-slate-400">Answer questions across all your products</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/service" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <HeartHandshake className="h-3.5 w-3.5 text-teal-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Service Desk</p>
                    <p className="text-[10px] text-slate-400">Collect feedback, resolve complaints in public</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
                <Link href="/dashboard/settings" className="flex items-center gap-3 hover:bg-slate-50 rounded-xl px-1 py-1 -mx-1 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Settings className="h-3.5 w-3.5 text-slate-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-black text-slate-700">Company settings</p>
                    <p className="text-[10px] text-slate-400">Update business type and other settings</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { Search, Star, Handshake, ShieldCheck, TrendingUp, Globe, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { HomeSearch } from '@/components/layout/home-search'

export const metadata: Metadata = {
  title: 'Trust Cabbage — Find Companies & Brands You Can Actually Trust',
  description: 'Real reviews from real customers. India\'s first company & brand review platform — verified reviews for service companies, online brands, and D2C stores across India.',
}

type CategoryRow = { id: string; name: string; slug: string; icon: string | null; platform_type: string }
type FeaturedCompany = {
  id: string; name: string; slug: string; logo_url: string | null
  average_rating: number; total_reviews: number; city: string | null; state: string | null
  is_verified: boolean; is_featured: boolean
}
type RecentReview = {
  id: string; rating_overall: number; what_went_well: string
  created_at: string; is_anonymous: boolean; is_verified_buyer: boolean
  companies: { name: string; slug: string; city: string | null } | null
  users: { display_name: string | null } | null
}

function reviewerLabel(review: RecentReview): string {
  if (review.is_anonymous) return 'Anonymous reviewer'
  const name = review.users?.display_name
  if (!name) return 'Reviewer'
  const parts = name.trim().split(' ')
  const short = parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : parts[0]
  const city = review.companies?.city
  return city ? `${short}, ${city}` : short
}

function daysAgo(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (days === 0) return 'today'
  if (days === 1) return '1 day ago'
  return `${days} days ago`
}

function formatCount(n: number, fallback: string): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k+`
  if (n > 0) return `${n}+`
  return fallback
}

export default async function HomePage() {
  const supabase = await createClient()

  const [
    { data: categoriesRaw },
    { data: featuredRaw },
    { data: recentRaw },
    { count: companyCount },
    { count: reviewCount },
    { count: categoryCount },
  ] = await Promise.all([
    supabase.from('categories').select('id, name, slug, icon, platform_type').eq('is_active', true).is('parent_id', null).order('sort_order').limit(30),
    supabase.from('companies').select('id, name, slug, logo_url, average_rating, total_reviews, city, state, is_verified, is_featured').eq('is_featured', true).order('total_reviews', { ascending: false }).limit(8),
    supabase.from('reviews').select('id, rating_overall, what_went_well, created_at, is_anonymous, is_verified_buyer, companies(name, slug, city), users(display_name)').eq('status', 'published').order('created_at', { ascending: false }).limit(6),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('categories').select('*', { count: 'exact', head: true }).eq('is_active', true),
  ])

  const allCats = (categoriesRaw ?? []) as CategoryRow[]
  const b2bCats = allCats.filter(c => c.platform_type === 'b2b' || c.platform_type === 'both').slice(0, 12)
  const b2cCats = allCats.filter(c => c.platform_type === 'b2c' || c.platform_type === 'both').slice(0, 12)
  const featured = (featuredRaw ?? []) as FeaturedCompany[]
  const recentReviews = (recentRaw ?? []) as unknown as RecentReview[]

  const statsCompanies = formatCount(companyCount ?? 0, '4,200+')
  const statsReviews = formatCount(reviewCount ?? 0, '18,000+')
  const statsCategories = formatCount(categoryCount ?? 0, '340+')

  return (
    <div>

      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-violet-50 via-white to-slate-50 pt-12 pb-10 lg:pt-16 lg:pb-14">
        {/* Top orange accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6d28d9] via-violet-400 to-violet-300" />
        {/* Blobs clipped to their own layer so they don't cut off the dropdown */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-40" />
          <div className="absolute -bottom-16 -left-16 w-72 h-72 bg-violet-100 rounded-full blur-3xl opacity-30" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block rounded-full bg-[#6d28d9]/10 border border-[#6d28d9]/20 text-[#6d28d9] px-4 py-1 text-xs font-black uppercase tracking-widest mb-5">
            India&apos;s Company &amp; Brand Review Platform
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-tight">
            Find companies and brands you can trust —{' '}
            <span className="text-[#6d28d9]">Decide with confidence.</span>
          </h1>
          <p className="mt-4 text-sm sm:text-lg leading-relaxed text-slate-500 max-w-xl mx-auto">
            Real reviews from real customers. No fluff, no paid opinions. India&apos;s first detailed product company review platform.
          </p>
          <div className="mt-6 relative z-10">
            <HomeSearch />
          </div>
          <p className="mt-4 text-xs text-slate-400">
            Are you a business?{' '}
            <Link href="/for-businesses" className="text-[#6d28d9] hover:underline font-bold transition-colors">List or claim your company →</Link>
          </p>

          {/* Trust signals inside hero */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-slate-500">
            {[
              { value: statsCompanies, label: 'companies listed' },
              { value: statsReviews, label: 'verified reviews' },
              { value: statsCategories, label: 'service categories' },
              { value: '100%', label: 'free to use' },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2">
                <span className="text-[#6d28d9] font-black text-base">◈</span>
                <span><span className="font-black text-slate-950">{s.value}</span> {s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Trust Cabbage ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2e1065] via-[#4c1d95] to-[#6d28d9] py-20">
        {/* Background texture blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[300px] bg-violet-400/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          {/* Heading */}
          <div className="text-center mb-12">
            <span className="inline-block rounded-full bg-white/10 border border-white/20 text-violet-200 px-4 py-1 text-xs font-black uppercase tracking-widest mb-5">
              Our purpose
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
              Why Trust Cabbage
            </h2>
          </div>

          {/* Body paragraphs */}
          <div className="max-w-3xl mx-auto space-y-5 text-violet-100 text-base sm:text-lg leading-relaxed">
            <p>
              When you partner with a service company, or order from an online brand — everything looks great on the surface.
              The website is polished. The pitch is confident. The promises are big.
              The real picture only comes after you&apos;ve signed, ordered, paid, and started working together.
            </p>
            <p>
              Trust Cabbage exists to change that. Real clients and buyers share their honest experiences — the good,
              the not-so-good, and everything in between. So the next person making that decision doesn&apos;t have to go in blind.
            </p>
            <p>
              Search any company, any service, any brand. See who the best in their space really are — not according to them,
              but according to the people who&apos;ve actually worked with them.
            </p>
          </div>

          {/* Closing quote */}
          <div className="mt-14 max-w-3xl mx-auto text-center">
            <div className="inline-block border-t border-b border-white/20 py-6 px-4">
              <p className="text-xl sm:text-2xl lg:text-3xl font-black text-white leading-snug">
                Because the best time to know about a company is before you need them — not after.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Browse B2B Services ── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#6d28d9] mb-1">For businesses</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Find a B2B service provider</h2>
            </div>
            <Link href="/categories" className="hidden sm:flex items-center gap-1 text-sm font-black text-[#6d28d9] hover:text-[#7c3aed] transition-colors">
              All B2B categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-slate-500 text-sm mb-8">Agencies, SaaS, logistics, consulting and more — read verified reviews before you sign</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(b2bCats.length > 0 ? b2bCats : PLACEHOLDER_CATEGORIES).map((cat) => (
              <Link
                key={(cat as any).id ?? (cat as any).name}
                href={b2bCats.length > 0 ? `/categories/${cat.slug}` : '/categories'}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-[#6d28d9] hover:shadow-sm hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-2xl leading-none">{cat.icon ?? '🏢'}</span>
                <span className="font-black text-slate-800 group-hover:text-[#6d28d9] text-sm leading-snug">{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 sm:hidden text-center">
            <Link href="/categories" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2.5 text-sm font-black text-slate-700 hover:border-[#6d28d9] hover:text-[#6d28d9] transition-colors">
              All B2B categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Browse Online Brands & Stores ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-rose-500 mb-1">For consumers</p>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Discover Online Brands & Stores</h2>
            </div>
            <Link href="/categories?tab=b2c" className="hidden sm:flex items-center gap-1 text-sm font-black text-rose-500 hover:text-rose-600 transition-colors">
              All B2C categories <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-slate-500 text-sm mb-8">Fashion, beauty, electronics, food and more — read real reviews before you order</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(b2cCats.length > 0 ? b2cCats : PLACEHOLDER_B2C_CATEGORIES).map((cat) => (
              <Link
                key={(cat as any).id ?? (cat as any).name}
                href={b2cCats.length > 0 ? `/categories/${cat.slug}` : '/categories?tab=b2c'}
                className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:border-rose-300 hover:shadow-sm hover:-translate-y-0.5 transition-all group"
              >
                <span className="text-2xl leading-none">{cat.icon ?? '🛍️'}</span>
                <span className="font-black text-slate-800 group-hover:text-rose-600 text-sm leading-snug">{cat.name}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 sm:hidden text-center">
            <Link href="/categories?tab=b2c" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2.5 text-sm font-black text-slate-700 hover:border-rose-300 hover:text-rose-600 transition-colors">
              All B2C categories <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-slate-50 py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2 text-center">How Trust Cabbage works</h2>
          <p className="text-slate-500 text-sm text-center mb-12">Three steps. Find the right company or brand in minutes.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 lg:gap-12">
            {[
              {
                icon: Search,
                step: '01',
                title: 'Search any company, brand, service, or hashtag',
                desc: 'Type a company name, a brand you\'ve heard of, or a hashtag like #PaymentGateway. The search instantly shows matching companies, categories, products, and tags — all in one dropdown.',
              },
              {
                icon: Star,
                step: '02',
                title: 'Read detailed, honest reviews',
                desc: 'Every review covers key factors — quality, delivery, customer support, communication, and more. Written by actual clients and customers, not anonymous strangers.',
              },
              {
                icon: Handshake,
                step: '03',
                title: 'Choose with confidence',
                desc: 'Compare companies and brands side by side. See what real clients and customers say before you sign a contract or place an order.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-[#6d28d9]/10 border border-[#6d28d9]/20 mb-4">
                  <item.icon className="h-6 w-6 text-[#6d28d9]" />
                </div>
                <p className="text-xs font-black text-[#6d28d9] tracking-widest uppercase mb-2">{item.step}</p>
                <h3 className="font-black text-slate-950 mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/search" className="inline-flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-7 py-3 text-sm transition-colors">
              Start searching <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured companies ── */}
      {featured.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-2">
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950">Top-rated companies this month</h2>
              <Link href="/search" className="text-sm font-black text-[#6d28d9] hover:text-[#7c3aed] transition-colors hidden sm:flex items-center gap-1">
                See all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-400 mb-8">Featured listings — companies with the highest verified review scores in their category</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {featured.map((company) => (
                <Link
                  key={company.id}
                  href={`/company/${company.slug}`}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-3 shadow-sm"
                >
                  <div className="h-11 w-11 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {company.logo_url
                      ? <img src={company.logo_url} alt={company.name} className="h-11 w-11 rounded-xl object-cover" />
                      : <span className="rounded-lg bg-[#6d28d9] h-7 w-7 flex items-center justify-center text-white text-xs font-black">{company.name[0]}</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="font-black text-slate-950 text-sm truncate">{company.name}</p>
                      {company.is_verified && <span className="rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-bold text-[#6d28d9] flex-shrink-0">✓</span>}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <StarRating value={company.average_rating} size="sm" />
                      <span className="text-xs text-slate-500">{(company.average_rating ?? 0).toFixed(1)} ({company.total_reviews ?? 0})</span>
                    </div>
                    {(company.city || company.state) && (
                      <p className="text-xs text-slate-400 mt-0.5">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Why Trust Cabbage is different ── */}
      <section className="bg-[#1e1b4b] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white text-center mb-2">Built for Indian businesses & brands. Not adapted from somewhere else.</h2>
          <p className="text-slate-400 text-sm text-center mb-12">Designed specifically for how business and commerce get done in India</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: ShieldCheck,
                tag: 'For buyers',
                title: 'Reviews you can verify',
                body: 'Every reviewer confirms their identity before writing. Their purchase type, experience, and duration are all declared. You know exactly who wrote what and why.',
              },
              {
                icon: TrendingUp,
                tag: 'For businesses',
                title: 'Your reputation, permanently visible',
                body: 'A good track record should work for you even when you\'re not pitching. Trust Cabbage puts your best reviews in front of buyers actively searching for what you offer.',
              },
              {
                icon: Globe,
                tag: 'For the ecosystem',
                title: 'Raising the bar for Indian businesses & brands',
                body: 'Too many companies win clients and customers on connections, not merit. Trust Cabbage shifts that — the best companies and brands rise, regardless of network or marketing budget.',
              },
            ].map(item => (
              <div key={item.tag} className="rounded-2xl bg-white/5 border border-white/10 p-6">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-[#6d28d9]/20 mb-4">
                  <item.icon className="h-6 w-6 text-[#6d28d9]" />
                </div>
                <span className="inline-block rounded-full bg-[#6d28d9]/20 text-violet-300 px-2.5 py-0.5 text-xs font-black mb-3">{item.tag}</span>
                <h3 className="font-black text-white mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm leading-6 text-slate-400">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent reviews live feed ── */}
      {recentReviews.length > 0 && (
        <section className="bg-slate-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">What people are saying right now</h2>
            <p className="text-slate-500 text-sm mb-8">Recent reviews from verified clients and customers across India</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentReviews.map(review => (
                <Link
                  key={review.id}
                  href={review.companies?.slug ? `/company/${review.companies.slug}` : '/search'}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <StarRating value={review.rating_overall} size="sm" />
                    <span className="text-xs text-slate-400 flex-shrink-0">{daysAgo(review.created_at)}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed line-clamp-3 flex-1">
                    &ldquo;{review.what_went_well}&rdquo;
                  </p>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-950 truncate">{reviewerLabel(review)}</p>
                      {review.companies?.name && (
                        <p className="text-xs text-slate-400 truncate">Reviewed: {review.companies.name}</p>
                      )}
                    </div>
                    {review.is_verified_buyer && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-[#6d28d9] flex-shrink-0">Verified</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/search" className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-2.5 text-sm font-black text-slate-700 hover:border-[#6d28d9] hover:text-[#6d28d9] transition-colors">
                Read more reviews <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── For businesses CTA band ── */}
      <section className="bg-[#6d28d9] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
            Your clients are looking for you.<br className="hidden sm:block" />
            Make sure they find the real you.
          </h2>
          <p className="text-violet-100 text-base mb-8 max-w-xl mx-auto leading-relaxed">
            List your company free. Claim your existing page. Start collecting verified reviews from your actual clients — and let your work speak for itself.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/for-businesses/add" className="rounded-xl bg-white text-[#6d28d9] font-black px-7 py-3.5 text-sm hover:bg-violet-50 transition-colors shadow-lg">
              List my company — it&apos;s free
            </Link>
            <Link href="/for-businesses/add" className="rounded-xl border-2 border-white/40 text-white font-black px-7 py-3.5 text-sm hover:bg-white/10 transition-colors">
              Search if your company is already listed →
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-violet-100">
            {['Free to list', 'No review deletion — ever', 'GST-verified company pages'].map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <span className="text-white font-black">◈</span> {p}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 text-center mb-12">Trust Cabbage in numbers</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: statsCompanies, label: 'Companies listed', sub: 'across all categories' },
              { value: statsReviews, label: 'Reviews published', sub: 'by verified buyers & customers' },
              { value: '96%', label: 'Reviewers verified', sub: 'email-confirmed accounts' },
              { value: statsCategories, label: 'Service categories', sub: 'and growing' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="text-3xl sm:text-4xl font-black text-[#6d28d9] mb-1">{s.value}</p>
                <p className="font-black text-slate-950 text-sm">{s.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

const PLACEHOLDER_CATEGORIES = [
  { id: '1', name: 'Web & App Development', slug: '', icon: '💻', platform_type: 'b2b' },
  { id: '2', name: 'Digital Marketing', slug: '', icon: '📣', platform_type: 'b2b' },
  { id: '3', name: 'Accounting & Finance', slug: '', icon: '📊', platform_type: 'b2b' },
  { id: '4', name: 'Legal & Compliance', slug: '', icon: '⚖️', platform_type: 'b2b' },
  { id: '5', name: 'HR & Recruitment', slug: '', icon: '👥', platform_type: 'b2b' },
  { id: '6', name: 'Logistics & Supply Chain', slug: '', icon: '📦', platform_type: 'b2b' },
  { id: '7', name: 'IT Infrastructure', slug: '', icon: '🖥️', platform_type: 'b2b' },
  { id: '8', name: 'Business Consulting', slug: '', icon: '🧠', platform_type: 'b2b' },
  { id: '9', name: 'Ecommerce Services', slug: '', icon: '🛒', platform_type: 'b2b' },
  { id: '10', name: 'Creative & Design', slug: '', icon: '🎨', platform_type: 'b2b' },
  { id: '11', name: 'Customer Support / BPO', slug: '', icon: '🎧', platform_type: 'b2b' },
  { id: '12', name: 'Cloud & SaaS Tools', slug: '', icon: '☁️', platform_type: 'b2b' },
]

const PLACEHOLDER_B2C_CATEGORIES = [
  { id: 'b1', name: 'Fashion & Apparel', slug: '', icon: '👗', platform_type: 'b2c' },
  { id: 'b2', name: 'Beauty & Personal Care', slug: '', icon: '💄', platform_type: 'b2c' },
  { id: 'b3', name: 'Home & Living', slug: '', icon: '🏠', platform_type: 'b2c' },
  { id: 'b4', name: 'Electronics & Gadgets', slug: '', icon: '📱', platform_type: 'b2c' },
  { id: 'b5', name: 'Food & Beverages', slug: '', icon: '🍽️', platform_type: 'b2c' },
  { id: 'b6', name: 'Health & Wellness', slug: '', icon: '🌿', platform_type: 'b2c' },
  { id: 'b7', name: 'Books, Hobbies & Learning', slug: '', icon: '📚', platform_type: 'b2c' },
  { id: 'b8', name: 'Baby & Kids', slug: '', icon: '👶', platform_type: 'b2c' },
  { id: 'b9', name: 'Pets', slug: '', icon: '🐾', platform_type: 'b2c' },
  { id: 'b10', name: 'Automotive', slug: '', icon: '🚗', platform_type: 'b2c' },
  { id: 'b11', name: 'Sustainable & Eco Brands', slug: '', icon: '♻️', platform_type: 'b2c' },
  { id: 'b12', name: 'Retail / Multi-brand', slug: '', icon: '🏪', platform_type: 'b2c' },
]

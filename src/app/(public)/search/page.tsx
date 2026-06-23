import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { SearchInput } from './_components/search-input'

type Props = {
  searchParams: Promise<{
    q?: string; tab?: string; sort?: string; rating?: string; state?: string; verified?: string; type?: string
  }>
}

type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null; description: string | null
  average_rating: number | null; total_reviews: number | null; city: string | null; state: string | null
  is_verified: boolean; matchedTag?: string
}

type CategoryRow = {
  id: string; name: string; slug: string; icon: string | null; description: string | null; parent_id: string | null
}

type ProductRow = {
  id: string; name: string; description: string | null; type: string; price_range: string | null
  companies: { id: string; name: string; slug: string; logo_url: string | null } | null
}

type TagRow = { id: string; name: string; slug: string }

export const metadata: Metadata = { title: 'Search — Trust Cabbage' }

function buildUrl(current: Record<string, string>, override: Record<string, string | null>) {
  const p = new URLSearchParams(current)
  for (const [k, v] of Object.entries(override)) {
    if (v === null || v === '') p.delete(k)
    else p.set(k, v)
  }
  const s = p.toString()
  return s ? `/search?${s}` : '/search'
}

const TABS = ['companies', 'categories', 'products', 'tags'] as const
const SORTS = [
  { value: 'most_reviewed', label: 'Most reviewed' },
  { value: 'top_rated', label: 'Highest rated' },
  { value: 'newest', label: 'Newest' },
] as const
const RATINGS = [5, 4, 3] as const

export default async function SearchPage({ searchParams }: Props) {
  const params = await searchParams
  const q = params.q ?? ''
  const tab = (params.tab && TABS.includes(params.tab as typeof TABS[number])) ? params.tab as typeof TABS[number] : 'companies'
  const sort = params.sort ?? 'most_reviewed'
  const minRating = params.rating ? parseInt(params.rating) : 0
  const stateFilter = params.state ?? ''
  const verifiedOnly = params.verified === '1'
  const typeFilter = params.type === 'b2b' || params.type === 'b2c' ? params.type : ''

  const supabase = await createClient()
  const query = q.trim()

  // Base params object for link building (only non-empty values)
  const base: Record<string, string> = {}
  if (q) base.q = q
  if (tab !== 'companies') base.tab = tab
  if (sort !== 'most_reviewed') base.sort = sort
  if (minRating) base.rating = String(minRating)
  if (stateFilter) base.state = stateFilter
  if (verifiedOnly) base.verified = '1'
  if (typeFilter) base.type = typeFilter

  let companies: CompanyRow[] = []
  let categories: CategoryRow[] = []
  let products: ProductRow[] = []
  let tags: TagRow[] = []
  let stateOptions: string[] = []

  // Fetch distinct states for sidebar (only useful for companies tab)
  if (tab === 'companies') {
    const { data: stateData } = await supabase
      .from('companies')
      .select('state')
      .not('state', 'is', null)
      .order('state')
      .limit(300)
    stateOptions = [...new Set((stateData as any[] ?? []).map((r: any) => r.state).filter(Boolean))].sort() as string[]
  }

  if (query.length > 1) {
    const cols = 'id, name, slug, logo_url, average_rating, total_reviews, city, state, is_verified, description'

    if (tab === 'companies') {
      let compQ = supabase
        .from('companies')
        .select(cols)
        .or(`name.ilike.%${query}%,website.ilike.%${query}%`)

      if (minRating) compQ = compQ.gte('average_rating', minRating)
      if (stateFilter) compQ = compQ.eq('state', stateFilter)
      if (verifiedOnly) compQ = compQ.eq('is_verified', true)
      if (typeFilter === 'b2b') compQ = compQ.in('business_type', ['business_services', 'both'])
      else if (typeFilter === 'b2c') compQ = compQ.in('business_type', ['online_b2c', 'retail_chain', 'both'])

      if (sort === 'top_rated') compQ = compQ.order('average_rating', { ascending: false })
      else if (sort === 'newest') compQ = compQ.order('created_at', { ascending: false })
      else compQ = compQ.order('total_reviews', { ascending: false })

      const [{ data: byName }, { data: matchedTags }] = await Promise.all([
        compQ.limit(20),
        supabase.from('tags').select('id, name').or(`name.ilike.%${query}%,slug.ilike.%${query}%`).limit(10),
      ])

      const seen = new Set<string>()
      for (const c of (byName as unknown as CompanyRow[]) ?? []) {
        if (!seen.has(c.id)) { seen.add(c.id); companies.push(c) }
      }

      if (matchedTags && matchedTags.length > 0) {
        const tagIds = (matchedTags as any[]).map((t: any) => t.id)
        const tagNameById = Object.fromEntries((matchedTags as any[]).map((t: any) => [t.id, t.name]))

        const { data: ctRows } = await supabase
          .from('company_tags')
          .select('company_id, tag_id')
          .in('tag_id', tagIds)
          .limit(30)

        if (ctRows && ctRows.length > 0) {
          const companyIds = [...new Set((ctRows as any[]).map((ct: any) => ct.company_id))]

          let taggedQ = supabase.from('companies').select(cols).in('id', companyIds)
          if (minRating) taggedQ = taggedQ.gte('average_rating', minRating)
          if (stateFilter) taggedQ = taggedQ.eq('state', stateFilter)
          if (verifiedOnly) taggedQ = taggedQ.eq('is_verified', true)
          if (typeFilter === 'b2b') taggedQ = taggedQ.in('business_type', ['business_services', 'both'])
          else if (typeFilter === 'b2c') taggedQ = taggedQ.in('business_type', ['online_b2c', 'retail_chain', 'both'])
          if (sort === 'top_rated') taggedQ = taggedQ.order('average_rating', { ascending: false })
          else if (sort === 'newest') taggedQ = taggedQ.order('created_at', { ascending: false })
          else taggedQ = taggedQ.order('total_reviews', { ascending: false })

          const { data: taggedRows } = await taggedQ

          for (const c of (taggedRows as unknown as CompanyRow[]) ?? []) {
            if (!seen.has(c.id)) {
              seen.add(c.id)
              const ct = (ctRows as any[]).find((row: any) => row.company_id === c.id)
              companies.push({ ...c, matchedTag: ct ? tagNameById[ct.tag_id] : undefined })
            }
          }
        }
      }
    }

    if (tab === 'categories') {
      const { data } = await supabase
        .from('categories')
        .select('id, name, slug, icon, description, parent_id')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('parent_id', { ascending: true, nullsFirst: true })
        .order('name')
        .limit(30)
      categories = (data as unknown as CategoryRow[]) ?? []
    }

    if (tab === 'products') {
      const { data } = await supabase
        .from('products_services')
        .select('id, name, description, type, price_range, companies(id, name, slug, logo_url)')
        .ilike('name', `%${query}%`)
        .eq('is_active', true)
        .order('name')
        .limit(30)
      products = (data as unknown as ProductRow[]) ?? []
    }

    if (tab === 'tags') {
      const { data } = await supabase
        .from('tags')
        .select('id, name, slug')
        .ilike('name', `%${query}%`)
        .neq('type', 'sentiment')
        .order('name')
        .limit(40)
      tags = (data as unknown as TagRow[]) ?? []
    }
  }

  const resultCount = tab === 'companies' ? companies.length
    : tab === 'categories' ? categories.length
    : tab === 'products' ? products.length
    : tags.length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <SearchInput initialQuery={q} />
        </div>

        {/* Tabs — only shown when there's an active query */}
        {q && <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-0 -mb-px">
            {TABS.map(t => {
              const label = t.charAt(0).toUpperCase() + t.slice(1)
              const href = buildUrl({ ...(q ? { q } : {}) }, { tab: t === 'companies' ? null : t })
              const active = tab === t
              return (
                <Link
                  key={t}
                  href={href}
                  className={`px-5 py-3.5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${
                    active
                      ? 'border-[#6d28d9] text-[#6d28d9]'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
                  }`}
                >
                  {label}
                </Link>
              )
            })}
          </nav>
        </div>}
      </div>

      {!q && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center text-slate-400">
          <p className="text-4xl mb-4">🔍</p>
          <p className="font-black text-slate-700 text-lg">Search for anything</p>
          <p className="text-sm mt-2">Companies, categories, products &amp; services, or tags</p>
        </div>
      )}

      {q && <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className={tab === 'companies' ? 'flex gap-8' : ''}>

          {/* Sidebar — companies tab only */}
          {tab === 'companies' && (
            <aside className="hidden lg:block w-52 shrink-0">

              {/* Sort */}
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Sort by</p>
                <div className="space-y-1">
                  {SORTS.map(s => {
                    const active = sort === s.value || (!sort && s.value === 'most_reviewed')
                    const href = buildUrl(base, { sort: s.value === 'most_reviewed' ? null : s.value })
                    return (
                      <Link
                        key={s.value}
                        href={href}
                        className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          active ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {s.label}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Min rating */}
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Min rating</p>
                <div className="space-y-1">
                  <Link
                    href={buildUrl(base, { rating: null })}
                    className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                      !minRating ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Any rating
                  </Link>
                  {RATINGS.map(r => {
                    const active = minRating === r
                    return (
                      <Link
                        key={r}
                        href={buildUrl(base, { rating: active ? null : String(r) })}
                        className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg transition-colors ${
                          active ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {r}+ <span className="text-amber-400">★</span>
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Verified */}
              <div className="mb-6">
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Status</p>
                <Link
                  href={buildUrl(base, { verified: verifiedOnly ? null : '1' })}
                  className={`block text-sm px-3 py-1.5 rounded-lg transition-colors ${
                    verifiedOnly ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Verified only
                </Link>
              </div>

              {/* State */}
              {stateOptions.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">State</p>
                  <div className="space-y-1 max-h-60 overflow-y-auto pr-1">
                    {stateFilter && (
                      <Link
                        href={buildUrl(base, { state: null })}
                        className="block text-xs px-3 py-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                      >
                        ✕ Clear state
                      </Link>
                    )}
                    {stateOptions.map(s => {
                      const active = stateFilter === s
                      return (
                        <Link
                          key={s}
                          href={buildUrl(base, { state: active ? null : s })}
                          className={`block text-sm px-3 py-1.5 rounded-lg transition-colors truncate ${
                            active ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {s}
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* Main results */}
          <div className="flex-1 min-w-0">

            {/* Type filter pills — companies tab only */}
            {tab === 'companies' && (
              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { value: '',    label: 'All types' },
                  { value: 'b2b', label: '🏢 B2B Services' },
                  { value: 'b2c', label: '🛍️ Online Brands & Stores' },
                ].map(opt => (
                  <Link
                    key={opt.value || 'all'}
                    href={buildUrl(base, { type: opt.value || null })}
                    className={`rounded-full px-4 py-1.5 text-xs font-black border transition-colors ${
                      typeFilter === opt.value
                        ? 'bg-[#6d28d9] border-[#6d28d9] text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#6d28d9] hover:text-[#6d28d9]'
                    }`}
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            )}

            {/* Zero results */}
            {query && resultCount === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                <p className="text-2xl mb-3">🔍</p>
                <p className="text-lg font-black text-slate-950">No {tab} found for &ldquo;{q}&rdquo;</p>
                <p className="text-sm text-slate-500 mt-2 mb-6">
                  {tab === 'companies' && 'Try a different search term or browse categories.'}
                  {tab !== 'companies' && 'Try a different search term.'}
                </p>
                {tab === 'companies' && (
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href={`/for-businesses/add?q=${encodeURIComponent(q)}`}
                      className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors"
                    >
                      Add &ldquo;{q}&rdquo; to Trust Cabbage →
                    </Link>
                    <Link href="/categories" className="text-sm text-[#6d28d9] font-bold hover:underline">
                      Browse categories
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Companies results */}
            {tab === 'companies' && companies.length > 0 && (
              <div className="space-y-3">
                {companies.map(company => (
                  <Link
                    key={company.id}
                    href={`/company/${company.slug}`}
                    prefetch={false}
                    className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <div className="h-14 w-14 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {company.logo_url
                        ? <img src={company.logo_url} alt={company.name} className="h-14 w-14 object-cover" />
                        : <span className="rounded-lg bg-[#6d28d9] h-9 w-9 flex items-center justify-center text-white font-black text-lg">{company.name[0]}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-950">{company.name}</p>
                        {company.is_verified && (
                          <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-[#6d28d9]">Verified</span>
                        )}
                        {company.matchedTag && (
                          <span className="rounded-full bg-[#6d28d9]/10 border border-[#6d28d9]/20 px-2 py-0.5 text-xs font-bold text-[#6d28d9]">
                            #{company.matchedTag}
                          </span>
                        )}
                      </div>
                      {(company.city || company.state) && (
                        <p className="text-xs text-slate-400 mt-0.5">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                      )}
                      {company.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-5">{company.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <StarRating value={company.average_rating ?? 0} size="sm" />
                        <span className="text-sm font-black text-slate-800">{(company.average_rating ?? 0).toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({company.total_reviews ?? 0} reviews)</span>
                      </div>
                    </div>
                  </Link>
                ))}

                {/* Add company CTA at bottom */}
                <div className="pt-4 text-center">
                  <p className="text-sm text-slate-500">
                    Can&apos;t find what you&apos;re looking for?{' '}
                    <Link href={`/for-businesses/add?q=${encodeURIComponent(q)}`} className="text-[#6d28d9] font-bold hover:underline">
                      Add a company →
                    </Link>
                  </p>
                </div>
              </div>
            )}

            {/* Categories results */}
            {tab === 'categories' && categories.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map(cat => (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    {cat.icon && <span className="text-2xl flex-shrink-0">{cat.icon}</span>}
                    <div className="min-w-0">
                      <p className="font-black text-slate-950">{cat.name}</p>
                      {!cat.parent_id && <span className="text-xs text-slate-400">Parent category</span>}
                      {cat.parent_id && <span className="text-xs text-slate-400">Subcategory</span>}
                      {cat.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description.replace(/[#*_`[\]]/g, '')}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Products results */}
            {tab === 'products' && products.length > 0 && (
              <div className="space-y-3">
                {products.map(product => (
                  <Link
                    key={product.id}
                    href={product.companies ? `/company/${product.companies.slug}` : '#'}
                    prefetch={false}
                    className="flex gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {product.companies?.logo_url
                        ? <img src={product.companies.logo_url} alt={product.companies.name} className="h-12 w-12 object-cover" />
                        : <span className="text-slate-400 text-xl">📦</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-slate-950">{product.name}</p>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          product.type === 'product' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {product.type}
                        </span>
                      </div>
                      {product.companies && (
                        <p className="text-xs text-slate-400 mt-0.5">by {product.companies.name}</p>
                      )}
                      {product.description && (
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-5">{product.description}</p>
                      )}
                      {product.price_range && (
                        <p className="text-xs text-[#6d28d9] font-bold mt-1">{product.price_range}</p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Tags results */}
            {tab === 'tags' && tags.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Link
                      key={tag.id}
                      href={`/tags/${tag.slug}`}
                      className="rounded-full bg-white border border-slate-200 hover:border-[#6d28d9] hover:bg-violet-50 hover:text-[#6d28d9] px-4 py-2 text-sm font-bold text-slate-700 transition-colors shadow-sm"
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-6">
                  Click a tag to see all companies with that tag.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>}
    </div>
  )
}

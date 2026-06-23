import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { ExpandableDescription } from './_components/expandable-description'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ sort?: string; verified?: string; rating?: string; feature?: string; model?: string; state?: string }>
}

type CategoryRow = {
  id: string; name: string; slug: string; description: string | null; icon: string | null
  image_url: string | null; parent_id: string | null
}
type SidebarRow = { id: string; name: string; slug: string; icon: string | null }
type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null; description: string | null
  average_rating: number | null; total_reviews: number | null; city: string | null; state: string | null
  is_verified: boolean; founded_year: number | null
  business_model_id: string | null; business_models: { name: string; slug: string } | null
  products_services: Array<{ name: string; type: string; sort_order: number | null }> | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('categories').select('name, description').eq('slug', slug).maybeSingle()
  const cat = data as unknown as CategoryRow | null
  if (!cat) return {}
  return {
    title: `${cat.name} Companies — Trust Cabbage`,
    description: cat.description ?? `Browse top ${cat.name} companies on Trust Cabbage. Read verified reviews from real businesses.`,
  }
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { sort = 'rating', verified, rating, feature: featureSlug, model: modelSlug, state: stateFilter = '' } = await searchParams
  const minRating = rating ? parseFloat(rating) : 0

  const supabase = await createClient()

  // Step 1: fetch category
  const { data: catData } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon, image_url, parent_id')
    .eq('slug', slug)
    .maybeSingle()

  const category = catData as unknown as CategoryRow | null
  if (!category) notFound()

  // Step 2: fetch sidebar, parent, features, feature filter in parallel
  const [{ data: sidebarData }, { data: parentData }, { data: featuresData }, featureFilter] = await Promise.all([
    category.parent_id
      ? supabase.from('categories').select('id, name, slug, icon').eq('parent_id', category.parent_id).eq('is_active', true).order('sort_order')
      : supabase.from('categories').select('id, name, slug, icon').eq('parent_id', category.id).eq('is_active', true).order('sort_order'),
    category.parent_id
      ? supabase.from('categories').select('id, name, slug, icon').eq('id', category.parent_id).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    category.parent_id
      ? supabase.from('features').select('id, name, slug').eq('subcategory_id', category.id).order('sort_order')
      : Promise.resolve({ data: [], error: null }),
    (async () => {
      if (!featureSlug || !category.parent_id) return { ids: null, empty: false }
      const { data: fRow } = await supabase.from('features').select('id').eq('slug', featureSlug).eq('subcategory_id', category.id).maybeSingle()
      if (!fRow) return { ids: null, empty: false }
      const { data: cfRows } = await supabase.from('company_features').select('company_id').eq('feature_id', (fRow as any).id)
      const ids = ((cfRows ?? []) as any[]).map((r: any) => r.company_id)
      return { ids, empty: ids.length === 0 }
    })(),
  ])

  const sidebar = (sidebarData as unknown as SidebarRow[]) ?? []
  const parent = parentData as unknown as SidebarRow | null
  const pageFeatures = (featuresData as unknown as Array<{ id: string; name: string; slug: string }>) ?? []
  const { ids: featureFilterIds, empty: featureFilterEmpty } = featureFilter

  // Step 3: category ID scope
  const allCategoryIds = !category.parent_id
    ? [category.id, ...sidebar.map(s => s.id)]
    : [category.id]

  // Step 4: company IDs → queries
  let companies: CompanyRow[] = []
  let stateOptions: string[] = []
  const excerptByCompanyId: Record<string, string> = {}

  if (!featureFilterEmpty) {
    const { data: ccRows } = await supabase
      .from('company_categories')
      .select('company_id')
      .in('category_id', allCategoryIds)

    let companyIds = [...new Set(((ccRows ?? []) as any[]).map((r: any) => r.company_id as string))]

    if (featureFilterIds && featureFilterIds.length > 0) {
      const featureSet = new Set(featureFilterIds)
      companyIds = companyIds.filter(id => featureSet.has(id))
    }

    if (companyIds.length > 0) {
      let q = supabase
        .from('companies')
        .select('id, name, slug, logo_url, description, average_rating, total_reviews, city, state, is_verified, founded_year, business_model_id, business_models(name, slug), products_services(name, type, sort_order)')
        .in('id', companyIds)

      if (stateFilter) q = q.eq('state', stateFilter)
      if (modelSlug) q = (q as any).eq('business_models.slug', modelSlug)
      if (verified === '1') q = q.eq('is_verified', true)
      if (minRating > 0) q = q.gte('average_rating', minRating)
      if (sort === 'reviews') q = q.order('total_reviews', { ascending: false })
      else if (sort === 'newest') q = q.order('created_at', { ascending: false })
      else q = q.order('average_rating', { ascending: false })

      // Run company query + state options + review excerpts in parallel
      const [companiesResult, stateResult, excerptResult] = await Promise.all([
        q.limit(40),
        supabase.from('companies').select('state').in('id', companyIds).not('state', 'is', null),
        supabase.from('reviews')
          .select('company_id, what_went_well')
          .in('company_id', companyIds)
          .eq('status', 'published')
          .not('what_went_well', 'is', null)
          .order('created_at', { ascending: false })
          .limit(120),
      ])

      companies = (companiesResult.data as unknown as CompanyRow[]) ?? []

      if (modelSlug) {
        companies = companies.filter(c => c.business_models?.slug === modelSlug)
      }

      stateOptions = [...new Set(
        ((stateResult.data ?? []) as any[]).map((r: any) => r.state).filter(Boolean)
      )].sort() as string[]

      for (const r of (excerptResult.data ?? []) as any[]) {
        if (!excerptByCompanyId[r.company_id] && r.what_went_well) {
          excerptByCompanyId[r.company_id] = r.what_went_well
        }
      }
    }
  }

  const companyCount = companies.length

  const modelSet = new Map<string, string>()
  companies.forEach(c => { if (c.business_models) modelSet.set(c.business_models.slug, c.business_models.name) })
  const availableModels = Array.from(modelSet.entries()).map(([slug, name]) => ({ slug, name }))

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const p: Record<string, string> = {
      sort,
      ...(verified ? { verified } : {}),
      ...(rating ? { rating } : {}),
      ...(featureSlug ? { feature: featureSlug } : {}),
      ...(modelSlug ? { model: modelSlug } : {}),
      ...(stateFilter ? { state: stateFilter } : {}),
    }
    Object.entries(overrides).forEach(([k, v]) => { if (v === undefined) delete p[k]; else p[k] = v })
    const qs = new URLSearchParams(p).toString()
    return `/categories/${slug}${qs ? `?${qs}` : ''}`
  }

  const hasFilters = !!(minRating || verified || featureSlug || modelSlug || stateFilter)

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero banner */}
      <section
        className="relative overflow-hidden"
        style={category.image_url
          ? { backgroundImage: `url(${category.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : {}}
      >
        <div className={`absolute inset-0 ${
          category.image_url
            ? 'bg-gradient-to-r from-slate-950/95 via-slate-950/85 to-slate-950/50'
            : 'bg-gradient-to-br from-violet-50 via-white to-slate-50'
        }`} />
        {!category.image_url && <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />}

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14">
          <nav className="flex items-center gap-1.5 text-xs mb-5">
            <Link href="/categories" className={`transition-colors ${category.image_url ? 'text-slate-400 hover:text-[#6d28d9]' : 'text-slate-500 hover:text-[#6d28d9]'}`}>Categories</Link>
            {parent && (
              <>
                <span className={category.image_url ? 'text-slate-600' : 'text-slate-400'}>/</span>
                <Link href={`/categories/${parent.slug}`} className={`transition-colors ${category.image_url ? 'text-slate-400 hover:text-[#6d28d9]' : 'text-slate-500 hover:text-[#6d28d9]'}`}>{parent.name}</Link>
              </>
            )}
            <span className={category.image_url ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className={category.image_url ? 'text-slate-300' : 'text-slate-700 font-bold'}>{category.name}</span>
          </nav>

          <div className="flex items-center gap-4 mb-4">
            {category.icon && <span className="text-5xl sm:text-6xl drop-shadow-sm">{category.icon}</span>}
            <div>
              <h1 className={`text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight ${category.image_url ? 'text-white' : 'text-slate-950'}`}>
                {category.name}
              </h1>
              <p className={`text-sm mt-1 ${category.image_url ? 'text-slate-400' : 'text-slate-500'}`}>
                {!category.parent_id && sidebar.length > 0 ? `${sidebar.length} subcategories · ` : ''}{companyCount} companies
              </p>
            </div>
          </div>

          {category.description && (
            <ExpandableDescription
              text={category.description}
              className={`text-base sm:text-lg max-w-2xl leading-relaxed ${category.image_url ? 'text-slate-300' : 'text-slate-600'}`}
            />
          )}

          {!category.parent_id && sidebar.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {sidebar.map(sub => (
                <Link
                  key={sub.id}
                  href={`/categories/${sub.slug}`}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                    category.image_url
                      ? 'bg-white/10 hover:bg-[#6d28d9] text-white'
                      : 'bg-white border border-slate-200 hover:border-[#6d28d9] hover:text-[#6d28d9] text-slate-700 shadow-sm'
                  }`}
                >
                  {sub.icon && <span>{sub.icon}</span>}
                  {sub.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-8 items-start">

          {/* Left sidebar */}
          {sidebar.length > 0 && (
            <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-6">
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {category.parent_id ? 'Subcategories' : 'Browse subcategories'}
                  </p>
                </div>
                <div className="py-2">
                  {parent && (
                    <Link href={`/categories/${parent.slug}`} className="flex items-center gap-2 px-4 py-2.5 text-sm font-black text-[#6d28d9] hover:bg-violet-50 transition-colors">
                      ← All {parent.name}
                    </Link>
                  )}
                  {sidebar.map(sub => (
                    <Link
                      key={sub.id}
                      href={`/categories/${sub.slug}`}
                      className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                        sub.slug === slug
                          ? 'bg-violet-50 text-[#6d28d9] font-black border-r-2 border-[#6d28d9]'
                          : 'text-slate-700 hover:bg-slate-50 font-bold'
                      }`}
                    >
                      {sub.icon && <span className="text-base leading-none">{sub.icon}</span>}
                      <span className="truncate">{sub.name}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* State filter in sidebar */}
              {stateOptions.length > 1 && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Filter by state</p>
                  </div>
                  <div className="py-2 max-h-52 overflow-y-auto">
                    <Link
                      href={buildHref({ state: undefined })}
                      className={`block px-4 py-2 text-sm transition-colors ${
                        !stateFilter ? 'font-black text-[#6d28d9] bg-violet-50' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      All states
                    </Link>
                    {stateOptions.map(s => (
                      <Link
                        key={s}
                        href={buildHref({ state: stateFilter === s ? undefined : s })}
                        className={`block px-4 py-2 text-sm transition-colors truncate ${
                          stateFilter === s ? 'font-black text-[#6d28d9] bg-violet-50 border-r-2 border-[#6d28d9]' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 min-w-0">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2 flex-wrap flex-1">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400">Sort</span>
                {[
                  { value: 'rating', label: '⭐ Highest rated' },
                  { value: 'reviews', label: '💬 Most reviewed' },
                  { value: 'newest', label: '🆕 Newest' },
                ].map(opt => (
                  <Link key={opt.value} href={buildHref({ sort: opt.value })}
                    className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                      sort === opt.value ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-800'
                    }`}>
                    {opt.label}
                  </Link>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[{ label: 'Any rating', value: '' }, { label: '4+ stars', value: '4' }, { label: '3+ stars', value: '3' }].map(opt => (
                  <Link key={opt.value} href={buildHref({ rating: opt.value || undefined })}
                    className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                      (rating ?? '') === opt.value ? 'border-violet-400 bg-violet-50 text-violet-900' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50'
                    }`}>
                    {opt.label}
                  </Link>
                ))}
                <Link href={buildHref({ verified: verified ? undefined : '1' })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                    verified ? 'border-green-500 bg-green-50 text-green-800' : 'border-slate-200 bg-white text-slate-600 hover:border-green-300 hover:bg-green-50'
                  }`}>
                  {verified ? '✓ Verified only' : 'Verified only'}
                </Link>
              </div>
            </div>

            {/* Mobile state filter (shown inline when sidebar is hidden) */}
            {stateOptions.length > 1 && (
              <div className="flex lg:hidden flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400 self-center">State</span>
                <Link href={buildHref({ state: undefined })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                    !stateFilter ? 'border-[#6d28d9] bg-[#6d28d9] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'
                  }`}>
                  All
                </Link>
                {stateOptions.map(s => (
                  <Link key={s} href={buildHref({ state: stateFilter === s ? undefined : s })}
                    className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                      stateFilter === s ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200'
                    }`}>
                    {s}
                  </Link>
                ))}
              </div>
            )}

            {/* Feature filter — subcategory pages only */}
            {pageFeatures.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400 self-center">Features</span>
                <Link href={buildHref({ feature: undefined })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                    !featureSlug ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}>All</Link>
                {pageFeatures.map(f => (
                  <Link key={f.id} href={buildHref({ feature: f.slug })}
                    className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                      featureSlug === f.slug ? 'border-violet-500 bg-violet-50 text-violet-800' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50'
                    }`}>
                    {f.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Business model filter */}
            {availableModels.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-slate-200">
                <span className="text-xs font-black uppercase tracking-wide text-slate-400 self-center">Model</span>
                <Link href={buildHref({ model: undefined })}
                  className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                    !modelSlug ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-400'
                  }`}>All</Link>
                {availableModels.map(m => (
                  <Link key={m.slug} href={buildHref({ model: m.slug })}
                    className={`text-xs px-3 py-1.5 rounded-full border font-black transition-colors ${
                      modelSlug === m.slug ? 'border-purple-500 bg-purple-50 text-purple-800' : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300 hover:bg-purple-50'
                    }`}>
                    {m.name}
                  </Link>
                ))}
              </div>
            )}

            <p className="text-xs text-slate-400 mb-4 font-bold">
              {companyCount} {companyCount === 1 ? 'company' : 'companies'}
              {hasFilters ? ' (filtered)' : ''}
            </p>

            {/* Company grid */}
            {companies.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-20 text-center">
                <p className="text-4xl mb-4">🏢</p>
                <p className="text-lg font-black text-slate-950">No companies yet</p>
                <p className="text-sm text-slate-500 mt-2 mb-6">
                  {hasFilters ? 'Try adjusting your filters.' : 'Be the first to add a company in this category.'}
                </p>
                <Link href="/for-businesses/add" className="inline-block rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors">
                  Add a company
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {companies.map(company => {
                  const services = (company.products_services ?? [])
                    .sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999))
                    .slice(0, 2)
                  const excerpt = excerptByCompanyId[company.id]

                  return (
                    <Link key={company.id} href={`/company/${company.slug}`}
                      className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex gap-4 shadow-sm group">
                      <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {company.logo_url
                          ? <img src={company.logo_url} alt={company.name} className="h-12 w-12 object-cover" />
                          : <span className="rounded-lg bg-[#6d28d9] h-8 w-8 flex items-center justify-center text-white font-black text-sm">{company.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-black text-slate-950 group-hover:text-[#6d28d9] transition-colors text-sm truncate">{company.name}</p>
                          {company.is_verified && <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-700 flex-shrink-0">Verified</span>}
                          {company.business_models && <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-black text-purple-700 flex-shrink-0">{company.business_models.name}</span>}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {(company.city || company.state) && (
                            <p className="text-xs text-slate-400">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                          )}
                          {company.founded_year && (
                            <p className="text-xs text-slate-400">· Est. {company.founded_year}</p>
                          )}
                        </div>

                        {services.length > 0 && (
                          <p className="text-xs text-[#6d28d9] font-bold mt-1.5 truncate">
                            {services.map(s => s.name).join(' · ')}
                          </p>
                        )}

                        {company.description && (
                          <p className="text-xs text-slate-500 mt-1 leading-5 line-clamp-2">{company.description}</p>
                        )}

                        {!company.description && excerpt && (
                          <p className="text-xs text-slate-500 mt-1 leading-5 line-clamp-2 italic">&ldquo;{excerpt}&rdquo;</p>
                        )}

                        {company.description && excerpt && (
                          <p className="text-xs text-slate-400 mt-1 leading-5 line-clamp-1 italic">&ldquo;{excerpt}&rdquo;</p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          <StarRating value={company.average_rating ?? 0} size="sm" />
                          <span className="text-sm font-black text-slate-800">{(company.average_rating ?? 0).toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({company.total_reviews ?? 0})</span>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}

            {/* SEO content block */}
            {companies.length > 0 && !hasFilters && (
              <section className="mt-12 pt-8 border-t border-slate-200">
                <h2 className="text-base font-black text-slate-950 mb-2">
                  About {category.name} companies on Trust Cabbage
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed max-w-3xl">
                  Trust Cabbage lists {companyCount} {category.name.toLowerCase()} {companyCount === 1 ? 'company' : 'companies'} with verified reviews from real Indian businesses.
                  Each review covers staff quality, communication, billing transparency, delivery, and after-sales support — giving you a complete picture before you engage a vendor.
                  All reviews are from verified buyers.{' '}
                  <Link href="/write-review" className="text-[#6d28d9] font-bold hover:underline">
                    Write a review →
                  </Link>
                </p>
              </section>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}

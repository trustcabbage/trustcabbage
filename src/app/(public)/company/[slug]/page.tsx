import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Globe, Users, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { CategoryChips } from './_components/category-chip-modal'
import { StarRating } from '@/components/reviews/star-rating'
import { ReviewCard } from './_components/review-card'
import { RatingBreakdown } from './_components/rating-breakdown'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ tag?: string; already_reviewed?: string; own_company?: string }> }

type Company = {
  id: string; name: string; slug: string; description: string | null
  logo_url: string | null; cover_url: string | null; website: string | null
  founded_year: number | null; employee_count: string | null
  city: string | null; state: string | null
  status: 'unclaimed' | 'pending' | 'claimed'
  average_rating: number; total_reviews: number
  is_verified: boolean; is_featured: boolean
  company_categories: Array<{ categories: { id: string; name: string; slug: string; icon: string | null; description: string | null } | null }>
  products_services: Array<{ id: string; name: string; type: string; description: string | null; price_range: string | null; is_active: boolean }>
  business_models: { id: string; name: string; slug: string } | null
}

type CompanyMeta = { name: string; description: string | null; average_rating: number; total_reviews: number }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('companies')
    .select('name, description, average_rating, total_reviews')
    .eq('slug', slug)
    .single()

  const company = data as unknown as CompanyMeta | null
  if (!company) return {}

  const title = `${company.name} Reviews & Ratings`
  const description = company.description
    ? `${company.description.slice(0, 120)}… Rated ${company.average_rating.toFixed(1)}/5 from ${company.total_reviews} reviews on Trust Cabbage.`
    : `Read ${company.total_reviews} verified reviews for ${company.name}. Overall rating: ${company.average_rating.toFixed(1)}/5.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { title, description },
    alternates: { canonical: `/company/${slug}` },
  }
}

export default async function CompanyPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { tag: activeTag = '', already_reviewed, own_company } = await searchParams
  const supabase = await createClient()

  // Determine if viewer is company admin for this page (needed for reply button)
  let viewerCompanyId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: viewerProfile } = await supabase
      .from('users').select('role, company_id').eq('id', user.id).single()
    if (viewerProfile && (viewerProfile as any).role === 'company_admin') {
      viewerCompanyId = (viewerProfile as any).company_id ?? null
    }
  }

  const { data: rawCompany } = await supabase
    .from('companies')
    .select(`
      id, name, slug, description, logo_url, cover_url, website, founded_year,
      employee_count, city, state, status, average_rating, total_reviews,
      is_verified, is_featured,
      company_categories(categories(id, name, slug, icon, description)),
      products_services(id, name, type, description, price_range, is_active),
      business_models(id, name, slug)
    `)
    .eq('slug', slug)
    .single()

  if (!rawCompany) notFound()
  const company = rawCompany as unknown as Company
  const isOwner = viewerCompanyId !== null && viewerCompanyId === company.id

  const reviewSelect = `
    id, rating_overall, rating_staff, rating_quality, rating_communication,
    rating_billing, rating_after_sales, rating_delivery,
    what_went_well, what_to_improve, would_recommend, recommend_reason,
    association_type, reviewer_role, engagement_phase, association_duration,
    is_anonymous, is_verified_buyer, helpful_votes, created_at,
    users(display_name, avatar_url),
    products_services(name),
    review_product_services(products_services(id, name))
  `

  let rawReviews: any[] = []
  if (activeTag) {
    const { data: tagData } = await supabase
      .from('tags').select('id').eq('slug', activeTag).maybeSingle()
    if (tagData) {
      const { data: rtRows } = await supabase
        .from('review_tags').select('review_id').eq('tag_id', (tagData as any).id)
      const reviewIds = ((rtRows ?? []) as any[]).map(r => r.review_id)
      if (reviewIds.length > 0) {
        const { data } = await supabase
          .from('reviews').select(reviewSelect)
          .eq('company_id', company.id).in('id', reviewIds)
          .eq('status', 'published').order('created_at', { ascending: false })
        rawReviews = (data ?? []) as any[]
      }
    }
  } else {
    const { data } = await supabase
      .from('reviews').select(reviewSelect)
      .eq('company_id', company.id).eq('status', 'published')
      .order('created_at', { ascending: false }).limit(10)
    rawReviews = (data ?? []) as any[]
  }

  // Fetch review responses separately (avoids PostgREST embedded join cache issues)
  const fetchedReviewIds = rawReviews.map(r => r.id)
  const { data: rawResponses } = fetchedReviewIds.length > 0
    ? await supabase
        .from('review_responses')
        .select('review_id, content, created_at')
        .in('review_id', fetchedReviewIds)
    : { data: [] }

  const responsesByReviewId = Object.fromEntries(
    ((rawResponses ?? []) as any[]).map(r => [r.review_id, r])
  )

  // Attach responses to reviews
  rawReviews = rawReviews.map(r => ({
    ...r,
    review_responses: responsesByReviewId[r.id] ? [responsesByReviewId[r.id]] : [],
  }))

  // Fetch review tags for all fetched reviews in one query
  const { data: rawReviewTags } = fetchedReviewIds.length > 0
    ? await supabase
        .from('review_tags')
        .select('review_id, tag_context, tags(id, name, slug)')
        .in('review_id', fetchedReviewIds)
    : { data: [] }

  // Separate query so missing table doesn't 404 the page
  const { data: rawCompanyTags } = await supabase
    .from('company_tags')
    .select('tags(id, name, slug)')
    .eq('company_id', company.id)

  // Features: graceful — won't 404 if table missing
  const { data: rawCompanyFeatures } = await supabase
    .from('company_features')
    .select('features(id, name, slug, subcategory_id, categories:subcategory_id(name, slug))')
    .eq('company_id', company.id)

  const reviews = rawReviews
  const categories = company.company_categories.map(cc => cc.categories).filter(Boolean) as Array<{ id: string; name: string; slug: string; icon: string | null; description: string | null }>
  const activeProducts = company.products_services.filter(p => p.is_active)
  const companyTags = ((rawCompanyTags ?? []) as any[]).map((ct: any) => ct.tags).filter(Boolean) as Array<{ id: string; name: string; slug: string }>

  // Group features by subcategory
  type FeatureGroup = { subcategory: { name: string; slug: string }; features: Array<{ id: string; name: string; slug: string }> }
  const featureGroups: FeatureGroup[] = []
  ;((rawCompanyFeatures ?? []) as any[]).forEach((cf: any) => {
    if (!cf.features) return
    const f = cf.features
    const cat = f.categories
    if (!cat) return
    let group = featureGroups.find(g => g.subcategory.slug === cat.slug)
    if (!group) { group = { subcategory: cat, features: [] }; featureGroups.push(group) }
    group.features.push({ id: f.id, name: f.name, slug: f.slug })
  })

  // Group review tags by review_id
  const reviewTagsMap = ((rawReviewTags ?? []) as any[]).reduce((acc: Record<string, any[]>, rt) => {
    if (!acc[rt.review_id]) acc[rt.review_id] = []
    acc[rt.review_id].push(rt)
    return acc
  }, {})

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: company.name,
    url: company.website,
    description: company.description,
    image: company.logo_url,
    address: {
      '@type': 'PostalAddress',
      addressLocality: company.city,
      addressRegion: company.state,
      addressCountry: 'IN',
    },
    ...(company.total_reviews > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: company.average_rating.toFixed(1),
        reviewCount: company.total_reviews,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    review: reviews.slice(0, 10).map((r) => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating_overall, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: r.is_anonymous ? 'Anonymous' : (r.users?.display_name ?? 'Reviewer') },
      datePublished: r.created_at.split('T')[0],
      reviewBody: r.what_went_well,
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      {/* Company hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-violet-50 via-white to-slate-50 border-b border-slate-200 pt-8 pb-10">
        {/* Subtle top accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#6d28d9] via-violet-400 to-violet-300" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {company.status === 'unclaimed' && (
            <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-sm text-amber-800 font-bold">
                Is this your company? Claim your page to manage your profile and respond to reviews.
              </p>
              <Link
                href={`/company/${slug}/claim`}
                className="rounded-full border border-[#6d28d9] text-[#6d28d9] px-4 py-1.5 text-xs font-black hover:bg-[#6d28d9] hover:text-white transition-colors flex-shrink-0"
              >
                Claim this page
              </Link>
            </div>
          )}

          <div className="flex gap-5 items-start">
            <div className="h-20 w-20 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center flex-shrink-0 overflow-hidden">
              {company.logo_url
                ? <img src={company.logo_url} alt={`${company.name} logo`} className="h-20 w-20 object-cover" />
                : <span className="rounded-xl bg-[#6d28d9] h-12 w-12 flex items-center justify-center text-white text-xl font-black">{company.name[0]}</span>}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">{company.name}</h1>
                {company.is_verified && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-0.5 text-xs font-black">
                    <CheckCircle className="h-3 w-3" /> Verified
                  </span>
                )}
                {company.business_models && (
                  <span className="rounded-full bg-purple-100 text-purple-700 border border-purple-200 px-2.5 py-0.5 text-xs font-bold">
                    {company.business_models.name}
                  </span>
                )}
              </div>
              {categories.length > 0 && <CategoryChips categories={categories} />}
              {companyTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {companyTags.map(tag => (
                    <span
                      key={tag.id}
                      className="rounded-full bg-violet-50 border border-violet-200 text-violet-700 px-2.5 py-0.5 text-xs font-bold"
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <StarRating value={company.average_rating} size="lg" />
                <span className="text-xl font-black text-slate-950">{company.average_rating.toFixed(1)}</span>
                <span className="text-sm text-slate-500">({company.total_reviews} review{company.total_reviews !== 1 ? 's' : ''})</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-8">
            {company.description && (
              <p className="text-slate-600 leading-relaxed">{company.description}</p>
            )}

            <RatingBreakdown reviews={reviews} />

            {/* Reviews */}
            <div>
              {own_company && (
                <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">
                  You cannot review your own company.
                </div>
              )}
              {already_reviewed && (
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-bold text-amber-700">
                  You've already submitted a review for this company.
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-black text-slate-950">Reviews</h2>
                <Link
                  href={`/company/${slug}/write-review`}
                  className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors"
                >
                  Write a review
                </Link>
              </div>

              {/* Tag filter bar */}
              {companyTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-5">
                  <Link
                    href={`/company/${slug}`}
                    className={`rounded-full px-3 py-1 text-xs font-black border transition-colors ${
                      !activeTag
                        ? 'bg-[#6d28d9] border-[#6d28d9] text-white'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#6d28d9] hover:text-[#6d28d9]'
                    }`}
                  >
                    All reviews
                  </Link>
                  {companyTags.map(tag => (
                    <Link
                      key={tag.id}
                      href={`/company/${slug}?tag=${tag.slug}`}
                      className={`rounded-full px-3 py-1 text-xs font-black border transition-colors ${
                        activeTag === tag.slug
                          ? 'bg-[#6d28d9] border-[#6d28d9] text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-[#6d28d9] hover:text-[#6d28d9]'
                      }`}
                    >
                      #{tag.name}
                    </Link>
                  ))}
                </div>
              )}

              {reviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
                  <p className="text-2xl mb-3">{activeTag ? '🏷️' : '✍️'}</p>
                  <p className="text-lg font-black text-slate-950">
                    {activeTag ? `No reviews tagged #${activeTag}` : 'No reviews yet'}
                  </p>
                  <p className="text-sm text-slate-500 mt-2">
                    {activeTag
                      ? <Link href={`/company/${slug}`} className="text-[#6d28d9] font-bold">View all reviews</Link>
                      : <>Be the first to review {company.name}</>}
                  </p>
                  {!activeTag && (
                    <Link
                      href={`/company/${slug}/write-review`}
                      className="inline-block mt-5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm transition-colors"
                    >
                      Write a review
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} companySlug={slug} reviewTags={reviewTagsMap[review.id] ?? []} isOwner={isOwner} />
                  ))}
                  {!activeTag && company.total_reviews > 10 && (
                    <div className="text-center pt-2">
                      <Link
                        href={`/company/${slug}/reviews`}
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        View all {company.total_reviews} reviews <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="font-black text-slate-950">Company details</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                {(company.city || company.state) && (
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#6d28d9] flex-shrink-0" />
                    {[company.city, company.state].filter(Boolean).join(', ')}
                  </li>
                )}
                {company.website && (
                  <li className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-[#6d28d9] flex-shrink-0" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-[#6d28d9] hover:text-[#7c3aed] hover:underline truncate font-bold text-sm">
                      {company.website.replace(/^https?:\/\//, '')}
                    </a>
                  </li>
                )}
                {company.employee_count && (
                  <li className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#6d28d9] flex-shrink-0" />
                    {company.employee_count} employees
                  </li>
                )}
                {company.founded_year && (
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#6d28d9] flex-shrink-0" />
                    Founded {company.founded_year}
                  </li>
                )}
              </ul>
            </div>

            {featureGroups.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                <h3 className="font-black text-slate-950">Features & Capabilities</h3>
                {featureGroups.map(group => (
                  <div key={group.subcategory.slug}>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{group.subcategory.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.features.map(f => (
                        <Link
                          key={f.id}
                          href={`/categories/${group.subcategory.slug}?feature=${f.slug}`}
                          className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-bold text-violet-800 hover:bg-violet-100 transition-colors"
                        >
                          {f.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeProducts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
                <h3 className="font-black text-slate-950">Products & Services</h3>
                <ul className="space-y-3">
                  {activeProducts.map((ps) => (
                    <li key={ps.id} className="text-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-slate-800">{ps.name}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600 capitalize">{ps.type}</span>
                      </div>
                      {ps.description && <p className="text-slate-500 mt-0.5 line-clamp-2 leading-5">{ps.description}</p>}
                      {ps.price_range && <p className="text-slate-400 text-xs mt-0.5">{ps.price_range}</p>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Link
              href={`/company/${slug}/write-review`}
              className="block w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-3 text-sm transition-colors text-center"
            >
              Write a review
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

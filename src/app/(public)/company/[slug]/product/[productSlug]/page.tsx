import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Package, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { ReviewCard } from '../../_components/review-card'
import { QaSection } from './_components/qa-section'

type Props = { params: Promise<{ slug: string; productSlug: string }> }

type Company = { id: string; name: string; slug: string; logo_url: string | null; is_verified: boolean }

type Product = {
  id: string; name: string; slug: string | null; description: string | null
  price_range: string | null; type: string; rating_avg: number; review_count: number
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  const { data: co } = await supabase.from('companies').select('id, name').eq('slug', slug).maybeSingle()
  if (!co) return {}
  const { data: prod } = await supabase
    .from('products_services')
    .select('name, rating_avg, review_count')
    .eq('company_id', (co as any).id)
    .eq('slug', productSlug)
    .maybeSingle()
  if (!prod) return {}

  const p = prod as any
  const title = `${p.name} Reviews — ${(co as any).name}`
  const description = p.review_count > 0
    ? `${p.review_count} verified review${p.review_count !== 1 ? 's' : ''} for ${p.name} by ${(co as any).name}. Rated ${p.rating_avg.toFixed(1)}/5 on Trust Cabbage.`
    : `Read and write reviews for ${p.name} by ${(co as any).name} on Trust Cabbage.`

  return {
    title,
    description,
    openGraph: { title, description, type: 'website' },
    twitter: { title, description },
    alternates: { canonical: `/company/${slug}/product/${productSlug}` },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug, productSlug } = await params
  const supabase = await createClient()

  const { data: coData } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, is_verified')
    .eq('slug', slug)
    .maybeSingle()
  if (!coData) notFound()
  const company = coData as unknown as Company

  const { data: prodData } = await supabase
    .from('products_services')
    .select('id, name, slug, description, price_range, type, rating_avg, review_count')
    .eq('company_id', company.id)
    .eq('slug', productSlug)
    .eq('is_active', true)
    .maybeSingle()
  if (!prodData) notFound()
  const product = prodData as unknown as Product

  const reviewSelect = `
    id, rating_overall, association_type, association_duration,
    what_went_well, what_to_improve, would_recommend, recommend_reason,
    is_anonymous, is_verified_buyer, helpful_votes, created_at,
    users(id, display_name)
  `

  const { data: rawReviews } = await supabase
    .from('reviews')
    .select(reviewSelect)
    .eq('product_service_id', product.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(50)

  let reviews = (rawReviews ?? []) as any[]
  const reviewIds = reviews.map(r => r.id)

  const [{ data: rawResponses }, { data: rawReviewTags }] = await Promise.all([
    reviewIds.length > 0
      ? supabase.from('review_responses').select('review_id, content, created_at').in('review_id', reviewIds)
      : Promise.resolve({ data: [] }),
    reviewIds.length > 0
      ? supabase.from('review_tags').select('review_id, tag_context, tags(id, name, slug)').in('review_id', reviewIds)
      : Promise.resolve({ data: [] }),
  ])

  const responsesByReviewId = Object.fromEntries(((rawResponses ?? []) as any[]).map(r => [r.review_id, r]))
  reviews = reviews.map(r => ({ ...r, review_responses: responsesByReviewId[r.id] ? [responsesByReviewId[r.id]] : [] }))

  const reviewTagsMap = ((rawReviewTags ?? []) as any[]).reduce((acc: Record<string, any[]>, rt) => {
    if (!acc[rt.review_id]) acc[rt.review_id] = []
    acc[rt.review_id].push(rt)
    return acc
  }, {})

  // Q&A
  const { data: { user } } = await supabase.auth.getUser()

  const { data: rawQuestions } = await supabase
    .from('product_questions')
    .select('id, body, created_at, users(display_name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const questionRows = (rawQuestions ?? []) as any[]
  const questionIds = questionRows.map(q => q.id)

  const { data: rawAnswers } = questionIds.length > 0
    ? await supabase
        .from('product_answers')
        .select('id, question_id, body, is_company_answer, is_verified_buyer, created_at, users(display_name)')
        .in('question_id', questionIds)
        .order('created_at', { ascending: true })
    : { data: [] }

  const answersByQuestionId: Record<string, any[]> = {}
  for (const a of (rawAnswers ?? []) as any[]) {
    if (!answersByQuestionId[a.question_id]) answersByQuestionId[a.question_id] = []
    answersByQuestionId[a.question_id].push(a)
  }

  const questions = questionRows.map(q => ({
    id: q.id,
    body: q.body,
    created_at: q.created_at,
    asker_name: q.users?.display_name ?? 'A visitor',
    answers: (answersByQuestionId[q.id] ?? [])
      .sort((a, b) => (b.is_company_answer ? 1 : 0) - (a.is_company_answer ? 1 : 0))
      .map(a => ({
        id: a.id,
        body: a.body,
        is_company_answer: a.is_company_answer,
        is_verified_buyer: a.is_verified_buyer,
        created_at: a.created_at,
        answerer_name: a.users?.display_name ?? 'A user',
      })),
  }))

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description ?? undefined,
    brand: { '@type': 'Brand', name: company.name },
    ...(product.review_count > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.rating_avg.toFixed(1),
        reviewCount: product.review_count,
        bestRating: '5',
        worstRating: '1',
      },
    }),
    review: reviews.slice(0, 10).map(r => ({
      '@type': 'Review',
      reviewRating: { '@type': 'Rating', ratingValue: r.rating_overall, bestRating: 5, worstRating: 1 },
      author: { '@type': 'Person', name: r.is_anonymous ? 'Anonymous' : (r.users?.display_name ?? 'Reviewer') },
      datePublished: r.created_at.split('T')[0],
      reviewBody: r.what_went_well,
    })),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />

      <div className="min-h-screen bg-slate-50">
        {/* Hero */}
        <section className="bg-[#1e1b4b] pt-10 pb-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1.5 text-xs mb-4">
              <Link href={`/company/${slug}`} className="text-slate-400 hover:text-[#a78bfa] transition-colors">{company.name}</Link>
              <span className="text-slate-600">/</span>
              <Link href={`/company/${slug}?tab=products`} className="text-slate-400 hover:text-[#a78bfa] transition-colors">Products</Link>
              <span className="text-slate-600">/</span>
              <span className="text-slate-300">{product.name}</span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {company.logo_url
                  ? <img src={company.logo_url} alt={company.name} className="h-14 w-14 object-cover" />
                  : <Package className="h-6 w-6 text-violet-300" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{product.name}</h1>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-black text-violet-200 capitalize flex-shrink-0">{product.type}</span>
                </div>
                <p className="text-sm text-slate-400 mt-1">
                  by{' '}
                  <Link href={`/company/${slug}`} className="text-violet-300 hover:text-violet-200 font-bold transition-colors">
                    {company.name}
                  </Link>
                  {company.is_verified && (
                    <span className="inline-flex items-center gap-1 ml-2 text-violet-300">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <StarRating value={product.rating_avg} size="sm" />
                  <span className="text-sm font-black text-white">{product.rating_avg > 0 ? product.rating_avg.toFixed(1) : '—'}</span>
                  <span className="text-xs text-slate-400">
                    ({product.review_count} review{product.review_count !== 1 ? 's' : ''})
                  </span>
                  {product.price_range && (
                    <>
                      <span className="text-slate-600">·</span>
                      <span className="text-xs font-bold text-violet-200">{product.price_range}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {product.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          )}

          {/* CTA */}
          <div className="rounded-xl border border-violet-200 bg-violet-50 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm text-slate-700 font-bold">Bought or used this? Share your experience.</p>
            <Link
              href={`/company/${slug}/write-review?product=${encodeURIComponent(product.slug ?? '')}`}
              className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors flex-shrink-0"
            >
              Write a review →
            </Link>
          </div>

          {/* Reviews */}
          {reviews.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
              <Package className="h-8 w-8 text-slate-300 mx-auto mb-3" />
              <p className="font-black text-slate-700">No reviews yet</p>
              <p className="text-sm text-slate-400 mt-1">Be the first to review {product.name}.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
              </p>
              {reviews.map(review => (
                <ReviewCard
                  key={review.id}
                  review={review}
                  companySlug={slug}
                  reviewTags={reviewTagsMap[review.id] ?? []}
                />
              ))}
            </div>
          )}

          <div className="pt-2 text-center">
            <Link href={`/company/${slug}?tab=reviews`} className="text-sm text-[#6d28d9] font-bold hover:underline">
              See all reviews for {company.name} →
            </Link>
          </div>

          <QaSection
            productId={product.id}
            companySlug={slug}
            productSlug={productSlug}
            companyName={company.name}
            questions={questions}
            isLoggedIn={!!user}
            currentPath={`/company/${slug}/product/${productSlug}`}
          />
        </div>
      </div>
    </>
  )
}

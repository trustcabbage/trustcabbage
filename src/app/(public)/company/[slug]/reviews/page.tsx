import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { ReviewCard } from '../_components/review-card'

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const PER_PAGE = 20

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('name, total_reviews').eq('slug', slug).single()
  const company = data as unknown as { name: string; total_reviews: number } | null
  if (!company) return {}
  return {
    title: `All reviews for ${company.name} — Trust Cabbage`,
    description: `Read all ${company.total_reviews} verified reviews for ${company.name} on Trust Cabbage.`,
    alternates: { canonical: `/company/${slug}/reviews` },
  }
}

export default async function AllReviewsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const from = (page - 1) * PER_PAGE
  const to = from + PER_PAGE - 1

  const supabase = await createClient()

  // Check if viewer is the company admin (for reply buttons)
  let viewerCompanyId: string | null = null
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: vp } = await supabase.from('users').select('role, company_id').eq('id', user.id).single()
    if (vp && (vp as any).role === 'company_admin') viewerCompanyId = (vp as any).company_id ?? null
  }

  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, slug, average_rating, total_reviews')
    .eq('slug', slug)
    .single()

  const company = companyData as unknown as {
    id: string; name: string; slug: string; average_rating: number; total_reviews: number
  } | null
  if (!company) notFound()
  const isOwner = viewerCompanyId !== null && viewerCompanyId === company.id

  const { data: rawReviews, count } = await supabase
    .from('reviews')
    .select(`
      id, rating_overall, rating_staff, rating_quality, rating_communication,
      rating_billing, rating_after_sales, rating_delivery,
      what_went_well, what_to_improve, would_recommend, recommend_reason,
      association_type, reviewer_role, engagement_phase, association_duration,
      is_anonymous, is_verified_buyer, helpful_votes, created_at,
      users(display_name, avatar_url),
      products_services(name)
    `, { count: 'exact' })
    .eq('company_id', company.id)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .range(from, to)

  const reviewIds = ((rawReviews ?? []) as any[]).map((r: any) => r.id)
  const { data: rawResponses } = reviewIds.length > 0
    ? await supabase.from('review_responses').select('review_id, content, created_at').in('review_id', reviewIds)
    : { data: [] }
  const responsesByReviewId = Object.fromEntries(((rawResponses ?? []) as any[]).map(r => [r.review_id, r]))

  const reviews = ((rawReviews ?? []) as any[]).map(r => ({
    ...r,
    review_responses: responsesByReviewId[r.id] ? [responsesByReviewId[r.id]] : [],
  }))
  const totalPages = Math.ceil((count ?? company.total_reviews) / PER_PAGE)

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-slate-500 mb-3">
            <Link href={`/company/${slug}`} className="hover:text-[#6d28d9] transition-colors">{company.name}</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-300">All reviews</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            All reviews for {company.name}
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <StarRating value={company.average_rating} size="lg" />
            <span className="text-xl font-black text-white">{company.average_rating.toFixed(1)}</span>
            <span className="text-sm text-slate-400">({company.total_reviews} review{company.total_reviews !== 1 ? 's' : ''})</span>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing {from + 1}–{Math.min(to + 1, count ?? company.total_reviews)} of {count ?? company.total_reviews} reviews
          </p>
          <Link
            href={`/company/${slug}/write-review`}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2 text-sm transition-colors"
          >
            Write a review
          </Link>
        </div>

        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <p className="text-lg font-black text-slate-950">No reviews on this page</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} companySlug={slug} isOwner={isOwner} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            {page > 1 ? (
              <Link
                href={`/company/${slug}/reviews?page=${page - 1}`}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-slate-100 px-4 py-2 text-sm font-black text-slate-300 pointer-events-none">
                <ChevronLeft className="h-4 w-4" /> Previous
              </span>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                let pageNum: number
                if (totalPages <= 7) {
                  pageNum = i + 1
                } else if (page <= 4) {
                  pageNum = i + 1
                } else if (page >= totalPages - 3) {
                  pageNum = totalPages - 6 + i
                } else {
                  pageNum = page - 3 + i
                }
                return (
                  <Link
                    key={pageNum}
                    href={`/company/${slug}/reviews?page=${pageNum}`}
                    className={`h-9 w-9 flex items-center justify-center rounded-full text-sm font-black transition-colors ${
                      pageNum === page
                        ? 'bg-[#6d28d9] text-white'
                        : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {pageNum}
                  </Link>
                )
              })}
            </div>

            {page < totalPages ? (
              <Link
                href={`/company/${slug}/reviews?page=${page + 1}`}
                className="flex items-center gap-1 rounded-full border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 rounded-full border border-slate-100 px-4 py-2 text-sm font-black text-slate-300 pointer-events-none">
                Next <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

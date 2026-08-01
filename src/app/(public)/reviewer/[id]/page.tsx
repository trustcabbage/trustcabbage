import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { CheckCircle, PenLine } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

type ReviewerProfile = {
  id: string
  display_name: string | null
  avatar_url: string | null
  total_reviews_written: number | null
  reviewer_credibility_score: number | null
  created_at: string
}

type ReviewRow = {
  id: string
  rating_overall: number | null
  what_went_well: string | null
  what_to_improve: string | null
  would_recommend: string | null
  association_type: string | null
  review_type: string | null
  created_at: string
  companies: { id: string; name: string; slug: string; logo_url: string | null } | null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('users').select('display_name').eq('id', id).maybeSingle()
  const name = (data as any)?.display_name ?? 'Reviewer'
  return {
    title: `${name}, Reviewer on Trust Cabbage`,
    description: `Reviews written by ${name} on Trust Cabbage.`,
  }
}

const ASSOC_LABELS: Record<string, string> = {
  current_client: 'Current client',
  past_client: 'Past client',
  pilot: 'Pilot / Trial',
  partner: 'Partner',
  vendor: 'Vendor',
  evaluator: 'Evaluator',
}

export default async function ReviewerProfilePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: profileRaw }, { data: reviewsRaw }] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, avatar_url, total_reviews_written, reviewer_credibility_score, created_at')
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('reviews')
      .select('id, rating_overall, what_went_well, what_to_improve, would_recommend, association_type, review_type, created_at, companies(id, name, slug, logo_url)')
      .eq('reviewer_id', id)
      .eq('status', 'published')
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (!profileRaw) notFound()

  const profile = profileRaw as unknown as ReviewerProfile
  const reviews = (reviewsRaw ?? []) as unknown as ReviewRow[]

  const name = profile.display_name ?? 'Reviewer'
  const initial = name[0].toUpperCase()
  const joinedDate = new Date(profile.created_at).toLocaleDateString('en-IN', {
    month: 'long', year: 'numeric'
  })

  const b2bCount = reviews.filter(r => r.review_type === 'b2b' || r.review_type === null).length
  const b2cCount = reviews.filter(r => r.review_type === 'b2c').length

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-gradient-to-b from-violet-50 via-white to-slate-50 border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-[#6d28d9] flex items-center justify-center text-white font-black text-2xl flex-shrink-0 overflow-hidden">
              {profile.avatar_url
                ? <img src={profile.avatar_url} alt={name} className="h-16 w-16 object-cover" />
                : initial}
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-950">{name}</h1>
              <p className="text-sm text-slate-400 mt-0.5">Joined {joinedDate}</p>
              {(profile.reviewer_credibility_score ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-[#6d28d9]" />
                  <span className="text-xs font-black text-[#6d28d9]">
                    Credibility score: {profile.reviewer_credibility_score}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap gap-6 mt-8">
            <div>
              <p className="text-2xl font-black text-slate-950">{reviews.length}</p>
              <p className="text-xs text-slate-400 font-bold">Reviews written</p>
            </div>
            {b2bCount > 0 && (
              <div>
                <p className="text-2xl font-black text-slate-950">{b2bCount}</p>
                <p className="text-xs text-slate-400 font-bold">B2B reviews</p>
              </div>
            )}
            {b2cCount > 0 && (
              <div>
                <p className="text-2xl font-black text-slate-950">{b2cCount}</p>
                <p className="text-xs text-slate-400 font-bold">Consumer reviews</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <PenLine className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="font-black text-slate-700">No public reviews yet</p>
            <p className="text-sm text-slate-400 mt-1">This reviewer has no public reviews.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
            {reviews.map(review => {
              const company = review.companies
              const date = new Date(review.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
              })
              return (
                <div key={review.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                  {/* Company header */}
                  {company && (
                    <Link
                      href={`/company/${company.slug}`}
                      className="flex items-center gap-3 mb-4 group"
                      prefetch={false}
                    >
                      <div className="h-9 w-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {company.logo_url
                          ? <img src={company.logo_url} alt={company.name} className="h-9 w-9 object-cover" />
                          : <span className="rounded-md bg-[#6d28d9] h-6 w-6 flex items-center justify-center text-white font-black text-xs">{company.name[0]}</span>}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 group-hover:text-[#6d28d9] transition-colors">{company.name}</p>
                        <p className="text-xs text-slate-400">{date}</p>
                      </div>
                      <div className="ml-auto flex items-center gap-1.5 flex-shrink-0">
                        <StarRating value={review.rating_overall ?? 0} size="sm" />
                        <span className="text-sm font-black text-slate-800">{review.rating_overall}</span>
                      </div>
                    </Link>
                  )}

                  {/* Badges */}
                  {(review.association_type || review.review_type === 'b2c') && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {review.association_type && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                          {ASSOC_LABELS[review.association_type] ?? review.association_type}
                        </span>
                      )}
                      {review.review_type === 'b2c' && (
                        <span className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-bold text-rose-600">
                          Consumer review
                        </span>
                      )}
                    </div>
                  )}

                  {/* Content */}
                  {review.what_went_well && (
                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{review.what_went_well}</p>
                  )}
                  {review.what_to_improve && (
                    <p className="text-sm text-slate-500 mt-2 leading-relaxed line-clamp-2 italic">&ldquo;{review.what_to_improve}&rdquo;</p>
                  )}

                  {review.would_recommend && (
                    <p className="text-xs text-slate-400 mt-3">
                      Would recommend:{' '}
                      <span className={
                        review.would_recommend === 'yes' ? 'text-[#6d28d9] font-black' :
                        review.would_recommend === 'no' ? 'text-red-400 font-black' :
                        'text-amber-600 font-black'
                      }>
                        {review.would_recommend === 'yes' ? 'Yes' : review.would_recommend === 'no' ? 'No' : 'Conditionally'}
                      </span>
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

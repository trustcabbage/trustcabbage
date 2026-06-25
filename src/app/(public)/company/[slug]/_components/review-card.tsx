import { ThumbsUp, CheckCircle, Building2 } from 'lucide-react'
import { StarRating } from '@/components/reviews/star-rating'
import { ReplyForm } from './reply-form'
import { markHelpful } from '../_actions'

const ASSOCIATION_LABELS: Record<string, string> = {
  current_client: 'Current client',
  past_client: 'Past client',
  pilot: 'Pilot / Trial',
  partner: 'Partner',
  vendor: 'Vendor',
  evaluator: 'Evaluator',
}

const DURATION_LABELS: Record<string, string> = {
  lt_3m: '< 3 months',
  '3_12m': '3–12 months',
  '1_3y': '1–3 years',
  '3y_plus': '3+ years',
}

const POSITIVE_SLUGS = new Set([
  'satisfied', 'recommended', 'good-value', 'great-support', 'fast-delivery',
  'professional', 'transparent', 'reliable', 'satisfied-with-product',
])

interface ReviewTag {
  tag_context: string
  tags: { id: string; name: string; slug: string } | null
}

interface ReviewCardProps {
  review: any
  companySlug: string
  reviewTags?: ReviewTag[]
  isOwner?: boolean
  currentUserId?: string | null
}

export function ReviewCard({ review, companySlug, reviewTags = [], isOwner = false }: ReviewCardProps) {
  const author = review.is_anonymous ? 'Anonymous' : (review.users?.display_name ?? 'Reviewer')
  const date = new Date(review.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })

  const serviceTags = reviewTags.filter(rt => rt.tag_context === 'service' && rt.tags)
  const sentimentTags = reviewTags.filter(rt => rt.tag_context === 'sentiment' && rt.tags)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-800 font-black text-xs flex-shrink-0">
            {author[0].toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-slate-950 text-sm">{author}</span>
              {review.is_verified_buyer && (
                <span className="flex items-center gap-0.5 text-xs text-[#6d28d9] font-bold">
                  <CheckCircle className="h-3 w-3" /> Verified buyer
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">{date}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StarRating value={review.rating_overall} size="sm" />
          <span className="font-black text-slate-950 text-sm">{review.rating_overall}</span>
        </div>
      </div>

      {/* Context badges */}
      <div className="flex flex-wrap gap-2">
        {review.association_type && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{ASSOCIATION_LABELS[review.association_type]}</span>
        )}
        {review.association_duration && (
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">{DURATION_LABELS[review.association_duration]}</span>
        )}
        {(() => {
          // Prefer junction table (multi-product); fall back to legacy single FK
          const multiProducts: string[] = review.review_product_services?.length > 0
            ? review.review_product_services.map((rps: any) => rps.products_services?.name).filter(Boolean)
            : review.products_services?.name ? [review.products_services.name] : []
          return multiProducts.map((name: string) => (
            <span key={name} className="rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-[#6d28d9]">Re: {name}</span>
          ))
        })()}
      </div>

      {/* Service tags */}
      {serviceTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {serviceTags.map(rt => (
            <span
              key={rt.tags!.id}
              className="rounded-full bg-violet-50 border border-violet-200 px-2.5 py-0.5 text-xs font-bold text-[#6d28d9]"
            >
              #{rt.tags!.name}
            </span>
          ))}
        </div>
      )}

      {/* Content */}
      {review.what_went_well && (
        <div>
          <p className="text-xs font-black text-[#6d28d9] uppercase tracking-wide mb-1">What went well</p>
          <p className="text-sm text-slate-600 leading-relaxed">{review.what_went_well}</p>
        </div>
      )}
      {review.what_to_improve && (
        <div>
          <p className="text-xs font-black text-amber-700 uppercase tracking-wide mb-1">What to improve</p>
          <p className="text-sm text-slate-600 leading-relaxed">{review.what_to_improve}</p>
        </div>
      )}

      {/* Recommendation */}
      {review.would_recommend && (
        <p className="text-xs text-slate-500">
          Would recommend:{' '}
          <span className={
            review.would_recommend === 'yes' ? 'text-[#6d28d9] font-black' :
            review.would_recommend === 'no' ? 'text-red-400 font-black' :
            'text-amber-600 font-black'
          }>
            {review.would_recommend === 'yes' ? 'Yes' : review.would_recommend === 'no' ? 'No' : 'Conditionally'}
          </span>
          {review.recommend_reason && ` — ${review.recommend_reason}`}
        </p>
      )}

      {/* Sentiment tags */}
      {sentimentTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {sentimentTags.map(rt => {
            const isPositive = POSITIVE_SLUGS.has(rt.tags!.slug)
            return (
              <span
                key={rt.tags!.id}
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold border ${
                  isPositive
                    ? 'bg-green-50 border-green-200 text-green-700'
                    : 'bg-red-50 border-red-200 text-red-700'
                }`}
              >
                #{rt.tags!.name}
              </span>
            )
          })}
        </div>
      )}

      {/* Company response */}
      {review.review_responses?.length > 0 && (
        <div className="bg-violet-50 rounded-xl p-4 border-l-4 border-[#6d28d9]">
          <div className="flex items-center gap-1.5 mb-2">
            <Building2 className="h-3.5 w-3.5 text-[#6d28d9]" />
            <p className="text-xs font-black text-[#6d28d9]">Company response</p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{review.review_responses[0].content}</p>
        </div>
      )}

      {/* Reply form — only for company owner */}
      {isOwner && (
        <ReplyForm
          reviewId={review.id}
          existingReply={review.review_responses?.[0]?.content ?? null}
        />
      )}

      {/* Helpful */}
      <div className="flex items-center gap-3 pt-1 border-t border-slate-100">
        <form action={markHelpful}>
          <input type="hidden" name="review_id" value={review.id} />
          <input type="hidden" name="company_slug" value={companySlug} />
          <button
            type="submit"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#6d28d9] transition-colors"
          >
            <ThumbsUp className="h-3 w-3" />
            Helpful{review.helpful_votes > 0 ? ` (${review.helpful_votes})` : ''}
          </button>
        </form>
      </div>
    </div>
  )
}

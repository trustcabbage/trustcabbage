import { createClient } from '@/lib/supabase/server'
import { approveReview, removeReview } from './_actions'
import Link from 'next/link'
import { StarRating } from '@/components/reviews/star-rating'

type Props = { searchParams: Promise<{ status?: string }> }

const STATUS_CHIPS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
  flagged: 'bg-red-100 text-red-800',
  removed: 'bg-slate-100 text-slate-500',
}

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { status = 'pending' } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('reviews')
    .select(`
      id, rating_overall, what_went_well, what_to_improve, would_recommend,
      is_anonymous, is_verified_buyer, status, created_at,
      companies(name, slug),
      users!reviews_reviewer_id_fkey(display_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  if (status !== 'all') {
    query.eq('status', status)
  }

  const { data: reviews } = await query
  const rows = (reviews ?? []) as any[]

  const FILTER_TABS = [
    { value: 'pending', label: 'Pending' },
    { value: 'published', label: 'Published' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'removed', label: 'Removed' },
    { value: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-slate-950">Review Moderation</h1>
        <div className="flex gap-2 flex-wrap">
          {FILTER_TABS.map(tab => (
            <Link
              key={tab.value}
              href={`/admin/reviews?status=${tab.value}`}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                status === tab.value
                  ? 'bg-[#6d28d9] text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          No reviews with status &quot;{status}&quot;.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((review) => (
            <div key={review.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link href={`/company/${review.companies?.slug}`} className="font-black text-slate-950 hover:text-[#6d28d9]">
                      {review.companies?.name ?? '—'}
                    </Link>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${STATUS_CHIPS[review.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {review.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    by <strong>{review.is_anonymous ? 'Anonymous' : (review.users?.display_name ?? review.users?.email ?? '—')}</strong>
                    {' · '}
                    {new Date(review.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <StarRating value={review.rating_overall} size="sm" />
                  <span className="font-black text-slate-950 text-sm">{review.rating_overall}</span>
                </div>
              </div>

              {review.what_went_well && (
                <p className="text-sm text-slate-600 line-clamp-3">{review.what_went_well}</p>
              )}

              {(review.status === 'pending' || review.status === 'flagged') && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <form action={approveReview.bind(null, review.id)}>
                    <button
                      type="submit"
                      className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2 text-sm transition-colors"
                    >
                      Publish
                    </button>
                  </form>
                  <form action={removeReview.bind(null, review.id)}>
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 text-red-600 font-black px-5 py-2 text-sm hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              )}
              {review.status === 'published' && (
                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <form action={removeReview.bind(null, review.id)}>
                    <button
                      type="submit"
                      className="rounded-xl border border-red-200 text-red-600 font-black px-5 py-2 text-sm hover:bg-red-50 transition-colors"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

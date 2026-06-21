import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'
import { CheckCircle, PenLine, Star } from 'lucide-react'

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ ref?: string; src?: string; embed?: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('companies').select('name').eq('slug', slug).maybeSingle()
  if (!data) return {}
  return {
    title: `Review ${(data as any).name} — Trust Cabbage`,
    description: `Share your experience with ${(data as any).name}. Help other businesses make better decisions.`,
  }
}

export default async function ReviewInvitePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { ref, src, embed } = await searchParams
  const isEmbed = embed === '1'
  const supabase = await createClient()

  const { data: coRaw } = await supabase
    .from('companies')
    .select('id, name, slug, logo_url, description, average_rating, total_reviews, city, state, is_verified')
    .eq('slug', slug)
    .maybeSingle()

  if (!coRaw) notFound()
  const co = coRaw as any

  const { data: reviewsRaw } = await supabase
    .from('reviews')
    .select('id, rating_overall, what_went_well, created_at, is_anonymous, users(display_name)')
    .eq('company_id', co.id)
    .eq('status', 'published')
    .order('helpful_votes', { ascending: false })
    .limit(3)

  const reviews = (reviewsRaw ?? []) as any[]

  return (
    <div className={`min-h-screen bg-gradient-to-b from-violet-50 to-slate-50${isEmbed ? ' [&_nav]:hidden [&_footer]:hidden' : ''}`}>
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-[#6d28d9] via-violet-400 to-violet-300" />

      <div className="max-w-lg mx-auto px-4 py-12 sm:py-16">

        {/* Company card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-16 w-16 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {co.logo_url
                  ? <img src={co.logo_url} alt={co.name} className="h-16 w-16 object-cover" />
                  : <span className="text-2xl font-black text-[#6d28d9]">{co.name[0]}</span>}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-black text-slate-950">{co.name}</h1>
                  {co.is_verified && (
                    <span className="flex items-center gap-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2 py-0.5 text-[10px] font-black">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </span>
                  )}
                </div>
                {(co.city || co.state) && (
                  <p className="text-xs text-slate-500 mt-0.5">{[co.city, co.state].filter(Boolean).join(', ')}</p>
                )}
                {co.total_reviews > 0 && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <StarRating value={co.average_rating} size="sm" />
                    <span className="text-sm font-black text-slate-800">{co.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({co.total_reviews} {co.total_reviews === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
              </div>
            </div>

            {co.description && (
              <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{co.description}</p>
            )}
          </div>

          {/* CTA */}
          <div className="bg-violet-50 border-t border-violet-100 px-6 py-5 text-center">
            <p className="text-sm font-black text-slate-950 mb-1">Share your experience</p>
            <p className="text-xs text-slate-500 mb-4">Your honest feedback helps other businesses make better decisions.</p>
            <Link
              href={`/company/${co.slug}/write-review?${new URLSearchParams({ ...(ref ? { ref } : {}), ...(src ? { src } : {}), ...(isEmbed ? { embed: '1' } : {}) }).toString()}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-3 text-sm transition-colors shadow-sm"
            >
              <PenLine className="h-4 w-4" />
              Write a review
            </Link>
            <p className="text-[10px] text-slate-400 mt-3">Free · Takes about 3 minutes · Anonymous option available</p>
          </div>
        </div>

        {/* Recent reviews as social proof */}
        {reviews.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">What others are saying</p>
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-slate-200 shadow-sm px-5 py-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-700">
                    {r.is_anonymous ? 'Anonymous reviewer' : (r.users?.display_name ?? 'Reviewer')}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <StarRating value={r.rating_overall} size="sm" />
                    <span className="text-xs font-black text-slate-700">{r.rating_overall.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">{r.what_went_well}</p>
              </div>
            ))}

            <div className="text-center pt-2">
              <Link href={`/company/${co.slug}`} className="text-xs text-[#6d28d9] font-black hover:underline">
                See all reviews on Trust Cabbage →
              </Link>
            </div>
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <span className="font-black text-slate-950">Trust</span>
            <span className="font-black text-[#6d28d9]">Cabbage</span>
            <span>· India&apos;s B2B Review Platform</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

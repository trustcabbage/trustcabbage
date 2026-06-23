import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  return { title: `Companies tagged #${slug}` }
}

type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null; description: string | null
  average_rating: number; total_reviews: number; city: string | null; state: string | null; is_verified: boolean
}

export default async function TagPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: tagData } = await supabase
    .from('tags')
    .select('id, name, slug, usage_count, type')
    .eq('slug', slug)
    .maybeSingle()

  if (!tagData) notFound()
  const tag = tagData as any

  const { data: ctRows } = await supabase
    .from('company_tags')
    .select('company_id')
    .eq('tag_id', tag.id)

  const companyIds = ((ctRows ?? []) as any[]).map(ct => ct.company_id)

  let companies: CompanyRow[] = []
  if (companyIds.length > 0) {
    const { data } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url, average_rating, total_reviews, city, state, is_verified, description')
      .in('id', companyIds)
      .order('total_reviews', { ascending: false })
    companies = (data as unknown as CompanyRow[]) ?? []
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Link href="/search" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mb-4">
            <ArrowLeft className="h-3 w-3" /> Back to search
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-black text-white">
              <span className="text-emerald-400">#{tag.name}</span>
            </h1>
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-slate-300 capitalize">{tag.type}</span>
          </div>
          <p className="mt-2 text-slate-400 text-sm">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'} tagged with this service
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {companies.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <p className="text-2xl mb-3">🏷️</p>
            <p className="text-lg font-black text-slate-950">No companies with this tag yet</p>
            <p className="text-sm text-slate-500 mt-2">
              Companies get tagged when reviewers mention services they used.{' '}
              <Link href="/write-review" className="text-[#6d28d9] font-bold">Write a review</Link>
            </p>
          </div>
        ) : (
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
                    : <span className="rounded-lg bg-[#6d28d9] h-9 w-9 flex items-center justify-center text-white font-black">{company.name[0]}</span>}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-slate-950">{company.name}</p>
                    {company.is_verified && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-[#6d28d9]">Verified</span>
                    )}
                  </div>
                  {(company.city || company.state) && (
                    <p className="text-xs text-slate-400 mt-0.5">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                  )}
                  {company.description && (
                    <p className="text-sm text-slate-500 mt-1 line-clamp-1 leading-5">{company.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <StarRating value={company.average_rating} size="sm" />
                    <span className="text-sm font-black text-slate-800">{company.average_rating.toFixed(1)}</span>
                    <span className="text-xs text-slate-400">({company.total_reviews} reviews)</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

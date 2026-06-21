import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanySearch } from './_components/company-search'
import { StarRating } from '@/components/reviews/star-rating'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Write a review',
  description: 'Search for a company and share your experience on Trust Cabbage.',
}

type Props = { searchParams: Promise<{ q?: string }> }

type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null
  average_rating: number; total_reviews: number; city: string | null; state: string | null
}

export default async function WriteReviewPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  const query = q.trim()
  let companies: CompanyRow[] = []

  if (query.length > 1) {
    const { data } = await supabase
      .from('companies')
      .select('id, name, slug, logo_url, average_rating, total_reviews, city, state')
      .ilike('name', `%${query}%`)
      .order('total_reviews', { ascending: false })
      .limit(10)
    companies = (data as unknown as CompanyRow[]) ?? []
  }

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-12 pb-14">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Who are you reviewing?
          </h1>
          <p className="mt-3 text-slate-400 text-sm">
            Search for a company. If it&apos;s not listed yet, you can create its page and write the first review.
          </p>
          <div className="mt-8">
            <CompanySearch initialQuery={query} isLoggedIn={!!user} />
          </div>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        {query.length > 1 && (
          <>
            {companies.length > 0 ? (
              <div className="space-y-3">
                <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-4">
                  {companies.length} result{companies.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
                </p>
                {companies.map(company => (
                  <Link
                    key={company.id}
                    href={user ? `/company/${company.slug}/write-review` : `/login?next=/company/${company.slug}/write-review`}
                    className="flex items-center gap-4 p-5 rounded-xl border border-slate-200 bg-white hover:border-[#6d28d9] hover:shadow-md transition-all shadow-sm group"
                  >
                    <div className="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {company.logo_url
                        ? <img src={company.logo_url} alt={company.name} className="h-12 w-12 object-cover" />
                        : <span className="rounded-lg bg-[#6d28d9] h-8 w-8 flex items-center justify-center text-white font-black text-sm">{company.name[0]}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-950 group-hover:text-[#6d28d9] transition-colors">{company.name}</p>
                      {(company.city || company.state) && (
                        <p className="text-xs text-slate-400 mt-0.5">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                      )}
                      {company.total_reviews > 0 && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <StarRating value={company.average_rating} size="sm" />
                          <span className="text-xs text-slate-500">{company.average_rating.toFixed(1)} ({company.total_reviews} reviews)</span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-black text-[#6d28d9] flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      Write review →
                    </span>
                  </Link>
                ))}

                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
                  <p className="text-sm text-slate-600">
                    Can&apos;t find the right company?
                  </p>
                  <Link
                    href={user ? `/write-review/new?name=${encodeURIComponent(query)}` : `/login?next=/write-review/new?name=${encodeURIComponent(query)}`}
                    className="inline-block mt-3 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 py-2.5 text-sm transition-colors"
                  >
                    Add &ldquo;{query}&rdquo; and write the first review
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
                <p className="text-xl font-black text-slate-950 mb-2">
                  &ldquo;{query}&rdquo; isn&apos;t on Trust Cabbage yet
                </p>
                <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
                  Be the first to review them. We&apos;ll create a public company page that others can also review and the company can claim later.
                </p>
                <Link
                  href={user ? `/write-review/new?name=${encodeURIComponent(query)}` : `/login?next=/write-review/new?name=${encodeURIComponent(query)}`}
                  className="inline-block rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-3 text-sm transition-colors"
                >
                  Add &ldquo;{query}&rdquo; &amp; write the first review
                </Link>
              </div>
            )}
          </>
        )}

        {query.length <= 1 && (
          <div className="text-center text-slate-400 py-8">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-black text-slate-950 text-lg">Start typing a company name above</p>
            <p className="text-sm mt-2">Search for any Indian B2B company — agency, SaaS, logistics, consulting, and more.</p>
          </div>
        )}
      </div>
    </div>
  )
}

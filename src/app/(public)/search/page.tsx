import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { StarRating } from '@/components/reviews/star-rating'

type Props = { searchParams: Promise<{ q?: string }> }

type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null; description: string | null
  average_rating: number; total_reviews: number; city: string | null; state: string | null; is_verified: boolean
  matchedTag?: string
}

export const metadata: Metadata = { title: 'Search companies' }

export default async function SearchPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const supabase = await createClient()

  const companies: CompanyRow[] = []

  if (q.trim().length > 1) {
    const term = q.trim().replace(/^#/, '')
    const cols = 'id, name, slug, logo_url, average_rating, total_reviews, city, state, is_verified, description'

    // Run both lookups in parallel
    const [{ data: byName }, { data: matchedTags }] = await Promise.all([
      supabase
        .from('companies')
        .select(cols)
        .or(`name.ilike.%${term}%,website.ilike.%${term}%`)
        .order('total_reviews', { ascending: false })
        .limit(20),
      supabase
        .from('tags')
        .select('id, name')
        .or(`name.ilike.%${term}%,slug.ilike.%${term}%`)
        .limit(10),
    ])

    const seen = new Set<string>()

    // Direct name/website matches first
    for (const c of (byName as unknown as CompanyRow[]) ?? []) {
      if (!seen.has(c.id)) { seen.add(c.id); companies.push(c) }
    }

    // Tag-matched companies
    if (matchedTags && matchedTags.length > 0) {
      const tagIds = (matchedTags as any[]).map(t => t.id)
      const tagNameById = Object.fromEntries((matchedTags as any[]).map((t: any) => [t.id, t.name]))

      const { data: ctRows } = await supabase
        .from('company_tags')
        .select('company_id, tag_id')
        .in('tag_id', tagIds)
        .limit(30)

      if (ctRows && ctRows.length > 0) {
        const companyIds = [...new Set((ctRows as any[]).map(ct => ct.company_id))]

        const { data: taggedRows } = await supabase
          .from('companies')
          .select(cols)
          .in('id', companyIds)
          .order('total_reviews', { ascending: false })

        for (const c of (taggedRows as unknown as CompanyRow[]) ?? []) {
          if (!seen.has(c.id)) {
            seen.add(c.id)
            const ct = (ctRows as any[]).find(row => row.company_id === c.id)
            companies.push({ ...c, matchedTag: ct ? tagNameById[ct.tag_id] : undefined })
          }
        }
      }
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {q ? <>Results for <span className="text-[#6d28d9]">&ldquo;{q}&rdquo;</span></> : 'Search companies'}
          </h1>
          {q && <p className="mt-2 text-slate-400 text-sm">{companies.length} result{companies.length !== 1 ? 's' : ''} found</p>}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        {q && companies.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-8 py-16 text-center">
            <p className="text-2xl mb-3">🔍</p>
            <p className="text-lg font-black text-slate-950">No companies found</p>
            <p className="text-sm text-slate-500 mt-2">Try a different search term or <Link href="/categories" className="text-[#6d28d9] font-bold">browse categories</Link>.</p>
          </div>
        )}

        <div className="space-y-3">
          {companies.map(company => (
            <Link
              key={company.id}
              href={`/company/${company.slug}`}
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
                  {company.matchedTag && (
                    <span className="rounded-full bg-[#6d28d9]/10 border border-[#6d28d9]/20 px-2 py-0.5 text-xs font-bold text-[#6d28d9]">
                      #{company.matchedTag}
                    </span>
                  )}
                </div>
                {(company.city || company.state) && (
                  <p className="text-xs text-slate-400 mt-0.5">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                )}
                {company.description && (
                  <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-5">{company.description}</p>
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
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AddCompanyForm } from './_components/add-company-form'
import { Search, ArrowRight } from 'lucide-react'

export const metadata: Metadata = {
  title: 'List your company — Trust Cabbage',
  description: 'Search if your company is already listed and claim it, or create a new page in minutes.',
}

type Props = { searchParams: Promise<{ q?: string }> }

type CompanyRow = {
  id: string; name: string; slug: string; logo_url: string | null
  city: string | null; state: string | null
}

type Category = { id: string; name: string; slug: string; icon: string | null; parent_id: string | null; platform_type: 'b2b' | 'b2c' | 'both' }

export default async function AddCompanyPage({ searchParams }: Props) {
  const { q = '' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const next = `/for-businesses/add${q ? `?q=${encodeURIComponent(q)}` : ''}`
    redirect(`/login?next=${encodeURIComponent(next)}`)
  }

  const query = q.trim()

  const [searchResult, categoriesResult] = await Promise.all([
    query.length > 1
      ? supabase
          .from('companies')
          .select('id, name, slug, logo_url, city, state')
          .ilike('name', `%${query}%`)
          .order('total_reviews', { ascending: false })
          .limit(6)
      : Promise.resolve({ data: [] as CompanyRow[] }),
    supabase
      .from('categories')
      .select('id, name, slug, icon, parent_id, platform_type')
      .eq('is_active', true)
      .order('sort_order'),
  ])

  const companies = (searchResult.data ?? []) as CompanyRow[]
  const categories = (categoriesResult.data ?? []) as Category[]

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-violet-300/70 mb-3">
            <Link href="/for-businesses" className="hover:text-violet-200 transition-colors">For Businesses</Link>
            <span className="mx-2">/</span>
            <span className="text-violet-200">List your company</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
            Get your company on Trust Cabbage
          </h1>
          <p className="text-violet-200/70 text-sm max-w-lg">
            Search first — your company may already be listed. If it is, claim it. If not, create a new page below.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-0">

        {/* ── Section 1: Claim ── */}
        <div className="bg-white rounded-t-2xl border border-slate-200 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-violet-500 mb-1">Already listed?</p>
          <h2 className="text-lg font-black text-slate-950 mb-4">Search and claim your page</h2>

          <form method="GET" action="/for-businesses/add" className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                name="q"
                defaultValue={q}
                autoComplete="off"
                placeholder="Search your company name…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-950 placeholder:text-slate-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 text-sm transition-colors flex-shrink-0"
            >
              Search
            </button>
          </form>

          {query.length > 1 && (
            <div className="mt-4 space-y-2">
              {companies.length > 0 ? (
                <>
                  <p className="text-xs text-slate-400 mb-3">{companies.length} result{companies.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;</p>
                  {companies.map(company => (
                    <div key={company.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50">
                      <div className="h-10 w-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {company.logo_url
                          ? <img src={company.logo_url} alt={company.name} className="h-10 w-10 object-cover" />
                          : <span className="text-sm font-black text-[#6d28d9]">{company.name[0]}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-slate-950 text-sm truncate">{company.name}</p>
                        {(company.city || company.state) && (
                          <p className="text-xs text-slate-400">{[company.city, company.state].filter(Boolean).join(', ')}</p>
                        )}
                      </div>
                      <Link
                        href={`/company/${company.slug}/claim`}
                        className="inline-flex items-center gap-1 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-3 py-2 text-xs transition-colors flex-shrink-0"
                      >
                        Claim <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-sm text-slate-500 py-2">&ldquo;{query}&rdquo; is not listed yet — create it below.</p>
              )}
            </div>
          )}
        </div>

        {/* ── OR divider ── */}
        <div className="flex items-center gap-4 px-6 py-4 bg-slate-100 border-x border-slate-200">
          <div className="flex-1 h-px bg-slate-300" />
          <span className="text-sm font-black text-slate-400">OR</span>
          <div className="flex-1 h-px bg-slate-300" />
        </div>

        {/* ── Section 2: Create ── */}
        <div className="bg-white rounded-b-2xl border border-slate-200 p-6 sm:p-8">
          <p className="text-xs font-black uppercase tracking-widest text-sky-500 mb-1">Not listed yet?</p>
          <h2 className="text-lg font-black text-slate-950 mb-1">Create your company page</h2>
          <p className="text-sm text-slate-500 mb-6">
            Fill in a few basic details. Once our team approves your page, you can claim it and start collecting reviews.
          </p>
          <AddCompanyForm initialName={query} categories={categories} />
        </div>

      </div>
    </div>
  )
}

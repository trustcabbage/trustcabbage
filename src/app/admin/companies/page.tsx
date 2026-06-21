import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { StarRating } from '@/components/reviews/star-rating'
import { Plus, Upload, ExternalLink, Pencil } from 'lucide-react'

type Props = { searchParams: Promise<{ q?: string; status?: string }> }

const STATUS_CHIPS: Record<string, string> = {
  unclaimed: 'bg-amber-100 text-amber-800',
  pending: 'bg-blue-100 text-blue-800',
  claimed: 'bg-green-100 text-green-800',
}

export default async function AdminCompaniesPage({ searchParams }: Props) {
  const { q = '', status = '' } = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('companies')
    .select('id, name, slug, city, state, average_rating, total_reviews, status, is_verified, is_featured, created_by_admin, logo_url, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  if (q.trim()) query = query.ilike('name', `%${q.trim()}%`)
  if (status) query = query.eq('status', status)

  const { data } = await query
  const companies = (data ?? []) as any[]

  const STATUS_FILTERS = [
    { value: '', label: 'All' },
    { value: 'unclaimed', label: 'Unclaimed' },
    { value: 'pending', label: 'Pending' },
    { value: 'claimed', label: 'Claimed' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-black text-slate-950">Companies</h1>
        <div className="flex gap-2">
          <Link
            href="/admin/companies/import"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Upload className="h-4 w-4" /> Import CSV
          </Link>
          <Link
            href="/admin/companies/new"
            className="flex items-center gap-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2 text-sm transition-colors"
          >
            <Plus className="h-4 w-4" /> Add company
          </Link>
        </div>
      </div>

      {/* Search + filter */}
      <form method="GET" className="flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name…"
          className="flex-1 min-w-48 rounded-xl border border-slate-200 px-4 py-2 text-sm focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map(f => (
            <Link
              key={f.value}
              href={`/admin/companies?status=${f.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
                status === f.value
                  ? 'bg-[#6d28d9] text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#1e1b4b] text-white font-black px-4 py-2 text-sm hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </form>

      <div className="text-sm text-slate-500">{companies.length} companies</div>

      {companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
          No companies found.
          <div className="mt-4">
            <Link href="/admin/companies/new" className="text-[#6d28d9] font-bold hover:underline">Add the first company →</Link>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wide hidden md:table-cell">Location</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wide hidden sm:table-cell">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-black text-slate-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {c.logo_url
                          ? <img src={c.logo_url} alt={c.name} className="h-8 w-8 object-cover" />
                          : <span className="text-xs font-black text-slate-400">{c.name[0]}</span>}
                      </div>
                      <div>
                        <p className="font-black text-slate-950 text-sm">{c.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{c.slug}</p>
                      </div>
                    </div>
                    {c.created_by_admin && (
                      <span className="ml-11 text-[10px] font-black text-slate-400 uppercase tracking-wide">Admin seeded</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs hidden md:table-cell">
                    {[c.city, c.state].filter(Boolean).join(', ') || '—'}
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    {c.total_reviews > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <StarRating value={c.average_rating} size="sm" />
                        <span className="text-xs font-black text-slate-600">{c.average_rating?.toFixed(1)}</span>
                        <span className="text-xs text-slate-400">({c.total_reviews})</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No reviews</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${STATUS_CHIPS[c.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Link href={`/company/${c.slug}`} target="_blank" className="text-slate-400 hover:text-slate-700 transition-colors">
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link href={`/admin/companies/${c.id}/edit`} className="text-slate-400 hover:text-[#6d28d9] transition-colors">
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

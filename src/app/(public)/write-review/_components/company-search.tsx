'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Suggestion { id: string; name: string; slug: string; city: string | null; state: string | null }

export function CompanySearch({ initialQuery, isLoggedIn }: { initialQuery: string; isLoggedIn: boolean }) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    if (query.trim().length < 2) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const q = query.trim()
      const { data } = await supabase
        .from('companies')
        .select('id, name, slug, city, state')
        .or(`name.ilike.%${q}%,website.ilike.%${q}%`)
        .limit(6)
      setSuggestions((data as unknown as Suggestion[]) ?? [])
      setLoading(false)
    }, 200)
  }, [query])

  function handleSelect(slug: string) {
    setShowDropdown(false)
    const dest = isLoggedIn ? `/company/${slug}/write-review` : `/login?next=/company/${slug}/write-review`
    router.push(dest)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setShowDropdown(false)
    if (query.trim()) router.push(`/write-review?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setShowDropdown(true) }}
            onFocus={() => { if (query.trim().length >= 2) setShowDropdown(true) }}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            placeholder="Search for a company…"
            className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white text-slate-950 placeholder:text-slate-400 border-0 shadow-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6d28d9]"
            autoComplete="off"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 text-sm transition-colors shadow-lg flex-shrink-0"
        >
          Search
        </button>
      </form>

      {showDropdown && query.trim().length >= 2 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150 absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-400">Searching…</div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => handleSelect(s.slug)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-violet-50 transition-colors border-b border-slate-100 last:border-0"
                >
                  <span className="h-7 w-7 rounded-lg bg-[#6d28d9] flex items-center justify-center text-white font-black text-xs flex-shrink-0">
                    {s.name[0]}
                  </span>
                  <div>
                    <p className="text-sm font-black text-slate-950">{s.name}</p>
                    {(s.city || s.state) && (
                      <p className="text-xs text-slate-400">{[s.city, s.state].filter(Boolean).join(', ')}</p>
                    )}
                  </div>
                  <span className="ml-auto text-xs text-[#6d28d9] font-bold flex-shrink-0">Review →</span>
                </button>
              ))}
              <button
                type="button"
                onMouseDown={() => { setShowDropdown(false); router.push(isLoggedIn ? `/write-review/new?name=${encodeURIComponent(query.trim())}` : `/login?next=/write-review/new?name=${encodeURIComponent(query.trim())}`) }}
                className="w-full flex items-center gap-4 px-4 py-4 text-left bg-violet-50 hover:bg-violet-100 transition-colors border-t-2 border-violet-200"
              >
                <span className="h-9 w-9 rounded-xl bg-[#6d28d9] flex items-center justify-center text-white font-black text-base flex-shrink-0">+</span>
                <div>
                  <p className="text-sm font-black text-slate-950">Add &ldquo;{query.trim()}&rdquo; as a new company</p>
                  <p className="text-xs text-slate-500 mt-0.5">Be the first to review them on Trust Cabbage</p>
                </div>
              </button>
            </>
          ) : (
            <button
              type="button"
              onMouseDown={() => { setShowDropdown(false); router.push(isLoggedIn ? `/write-review/new?name=${encodeURIComponent(query.trim())}` : `/login?next=/write-review/new?name=${encodeURIComponent(query.trim())}`) }}
              className="w-full flex items-center gap-4 px-4 py-5 text-left hover:bg-violet-50 transition-colors"
            >
              <span className="h-10 w-10 rounded-xl bg-[#6d28d9] flex items-center justify-center text-white font-black text-lg flex-shrink-0">+</span>
              <div>
                <p className="font-black text-slate-950">&ldquo;{query.trim()}&rdquo; isn&apos;t on Trust Cabbage yet</p>
                <p className="text-sm text-slate-500 mt-0.5">Create this company and write the first review</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

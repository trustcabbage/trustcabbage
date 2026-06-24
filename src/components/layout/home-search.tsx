'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StarRating } from '@/components/reviews/star-rating'

const PLACEHOLDERS = [
  'Search a company…',
  'Search a service…',
  'Search #PaymentGateway…',
  'Search Digital Marketing…',
]

type Co = { id: string; name: string; slug: string; logo_url: string | null; average_rating: number; total_reviews: number }
type Cat = { id: string; name: string; slug: string; icon: string | null }
type Sub = { id: string; name: string; slug: string; parent: { id: string; name: string; slug: string; icon: string | null } | null }
type Prod = { id: string; name: string; type: string; companies: { name: string; slug: string } | null }
type TagR = { id: string; name: string; slug: string; usage_count: number }

interface SectionItem { gidx: number; href: string; data: any }
interface Section { key: string; label: string; items: SectionItem[]; hasMore: boolean; moreHref: string }

export function HomeSearch() {
  const router = useRouter()
  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [query, setQuery] = useState('')
  const [cos, setCos] = useState<Co[]>([])
  const [cats, setCats] = useState<Cat[]>([])
  const [subs, setSubs] = useState<Sub[]>([])
  const [prods, setProds] = useState<Prod[]>([])
  const [tags, setTags] = useState<TagR[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focusedIdx, setFocusedIdx] = useState(-1)
  const [phIdx, setPhIdx] = useState(0)
  const [phVisible, setPhVisible] = useState(true)

  // Rotating placeholder
  useEffect(() => {
    const t = setInterval(() => {
      setPhVisible(false)
      setTimeout(() => { setPhIdx(i => (i + 1) % PLACEHOLDERS.length); setPhVisible(true) }, 260)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  // Multi-section search
  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setCos([]); setCats([]); setSubs([]); setProds([]); setTags([])
      setOpen(false); setFocusedIdx(-1); return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const term = q.replace(/^#/, '')
      const [
        { data: coData }, { data: catData }, { data: subData }, { data: prodData }, { data: tagData },
      ] = await Promise.all([
        supabase.from('companies').select('id, name, slug, logo_url, average_rating, total_reviews').ilike('name', `%${term}%`).limit(4),
        supabase.from('categories').select('id, name, slug, icon').is('parent_id', null).or(`name.ilike.%${term}%,search_tags.ilike.%${term}%`).eq('is_active', true).limit(4),
        supabase.from('categories').select('id, name, slug, parent:parent_id(id, name, slug, icon)').not('parent_id', 'is', null).or(`name.ilike.%${term}%,search_tags.ilike.%${term}%`).limit(4),
        supabase.from('products_services').select('id, name, type, companies(name, slug)').ilike('name', `%${term}%`).eq('is_active', true).limit(4),
        supabase.from('tags').select('id, name, slug, usage_count').or(`name.ilike.%${term}%,slug.ilike.%${term}%`).neq('type', 'sentiment').order('usage_count', { ascending: false }).limit(4),
      ])
      // Also show parent categories of matched subcategories (e.g. search "skincare" → show "Beauty & Personal Care")
      const parentIdsInCats = new Set((catData ?? []).map((c: any) => c.id))
      const seenParentIds = new Set<string>()
      const extraParents: Cat[] = []
      for (const s of (subData ?? []) as any[]) {
        if (s.parent?.id && !parentIdsInCats.has(s.parent.id) && !seenParentIds.has(s.parent.id)) {
          seenParentIds.add(s.parent.id)
          extraParents.push({ id: s.parent.id, name: s.parent.name, slug: s.parent.slug, icon: s.parent.icon ?? null })
        }
      }
      setCos((coData ?? []) as Co[])
      setCats([...(catData ?? []) as Cat[], ...extraParents])
      setSubs((subData ?? []) as any)
      setProds((prodData ?? []) as any)
      setTags((tagData ?? []) as TagR[])
      setLoading(false)
      setOpen(true)
      setFocusedIdx(-1)
    }, 200)
  }, [query])

  const sectionCount = [cos, cats, subs, prods, tags].filter(s => s.length > 0).length
  const limit = sectionCount === 1 ? 6 : 3

  const sections = useMemo<Section[]>(() => {
    let gidx = 0
    const enc = encodeURIComponent(query.trim())
    const build: Section[] = []
    if (cos.length > 0) build.push({
      key: 'co', label: '🏢 Companies',
      items: cos.slice(0, limit).map(c => ({ gidx: gidx++, href: `/company/${c.slug}`, data: c })),
      hasMore: cos.length > limit, moreHref: `/search?q=${enc}`,
    })
    if (cats.length > 0) build.push({
      key: 'cat', label: '🗂 Categories',
      items: cats.slice(0, limit).map(c => ({ gidx: gidx++, href: `/categories/${c.slug}`, data: c })),
      hasMore: cats.length > limit, moreHref: `/categories`,
    })
    if (subs.length > 0) build.push({
      key: 'sub', label: '📁 Subcategories',
      items: subs.slice(0, limit).map((s: any) => ({
        gidx: gidx++,
        href: `/categories/${s.slug}`,
        data: s,
      })),
      hasMore: subs.length > limit, moreHref: `/categories`,
    })
    if (prods.length > 0) build.push({
      key: 'prod', label: '📦 Products & Services',
      items: prods.slice(0, limit).map((p: any) => ({
        gidx: gidx++,
        href: p.companies?.slug ? `/company/${p.companies.slug}` : `/search?q=${enc}`,
        data: p,
      })),
      hasMore: prods.length > limit, moreHref: `/search?q=${enc}`,
    })
    if (tags.length > 0) build.push({
      key: 'tag', label: '#️⃣ Hashtags',
      items: tags.slice(0, limit).map(t => ({ gidx: gidx++, href: `/tags/${t.slug}`, data: t })),
      hasMore: tags.length > limit, moreHref: `/search?q=${encodeURIComponent('#' + query.trim().replace(/^#/, ''))}`,
    })
    return build
  }, [cos, cats, subs, prods, tags, limit, query])

  const flatHrefs = useMemo(() => sections.flatMap(s => s.items.map(i => i.href)), [sections])

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') { setOpen(false); setFocusedIdx(-1); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, flatHrefs.length - 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, -1)); return }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIdx >= 0 && flatHrefs[focusedIdx]) { router.push(flatHrefs[focusedIdx]); setOpen(false) }
      else if (query.trim()) { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setOpen(false) }
    }
  }

  function go(href: string) { setOpen(false); router.push(href) }

  return (
    <div className="relative max-w-2xl mx-auto">
      <form onSubmit={e => { e.preventDefault(); setOpen(false); if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`) }}>
        <div className="relative flex items-center">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none z-10" />
          {!query && (
            <span className={`absolute left-12 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-base transition-opacity duration-300 select-none ${phVisible ? 'opacity-100' : 'opacity-0'}`}>
              {PLACEHOLDERS[phIdx]}
            </span>
          )}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => { if (query.trim().length >= 2) setOpen(true) }}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={handleKeyDown}
            placeholder=""
            className="w-full pl-12 pr-32 h-14 rounded-2xl bg-white text-slate-950 border-2 border-slate-200 shadow-lg text-base focus:outline-none focus:border-[#6d28d9] focus:ring-0"
            autoComplete="off"
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-5 text-sm transition-colors">
            Search
          </button>
        </div>
      </form>

      {open && query.trim().length >= 2 && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-150 absolute top-full left-0 right-0 mt-2 z-50 bg-white rounded-2xl border border-slate-100 shadow-2xl overflow-hidden">
          {loading ? (
            <div className="px-5 py-5 text-sm text-slate-400 text-center">Searching…</div>
          ) : sections.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <p className="text-sm text-slate-500 mb-2">No results for &ldquo;{query.trim()}&rdquo;</p>
              <button onMouseDown={() => go(`/search?q=${encodeURIComponent(query.trim())}`)} className="text-sm font-bold text-[#6d28d9] hover:underline">
                Full search →
              </button>
            </div>
          ) : (
            <div className="max-h-[72vh] overflow-y-auto divide-y divide-slate-100">
              {sections.map(section => (
                <div key={section.key}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">{section.label}</p>
                  {section.items.map(item => (
                    <button
                      key={item.data.id}
                      type="button"
                      onMouseDown={() => go(item.href)}
                      className={`w-full px-4 py-2.5 text-left transition-colors ${focusedIdx === item.gidx ? 'bg-violet-50' : 'hover:bg-slate-50'}`}
                    >
                      {section.key === 'co' && (
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {item.data.logo_url
                              ? <img src={item.data.logo_url} className="h-8 w-8 object-cover" alt="" />
                              : <span className="text-xs font-black text-[#6d28d9]">{item.data.name[0]}</span>}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-950 truncate">{item.data.name}</p>
                            {item.data.average_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <StarRating value={item.data.average_rating} size="sm" />
                                <span className="text-xs text-slate-400">{item.data.average_rating.toFixed(1)} ({item.data.total_reviews})</span>
                              </div>
                            )}
                          </div>
                          <span className="ml-auto text-xs text-slate-300 flex-shrink-0">→</span>
                        </div>
                      )}
                      {section.key === 'cat' && (
                        <div className="flex items-center gap-3">
                          <span className="text-lg leading-none w-6 text-center">{item.data.icon ?? '🏢'}</span>
                          <span className="text-sm font-black text-slate-950">{item.data.name}</span>
                          <span className="ml-auto text-xs text-slate-300 flex-shrink-0">→</span>
                        </div>
                      )}
                      {section.key === 'sub' && (
                        <div className="flex items-start gap-2 pl-2">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-950">{item.data.name}</p>
                            {item.data.parent?.name && <p className="text-xs text-slate-400">↳ {item.data.parent.name}</p>}
                          </div>
                          <span className="ml-auto text-xs text-slate-300 mt-0.5 flex-shrink-0">→</span>
                        </div>
                      )}
                      {section.key === 'prod' && (
                        <div className="flex items-center gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-black text-slate-950">{item.data.name}</p>
                            {item.data.companies?.name && <p className="text-xs text-slate-400">by {item.data.companies.name}</p>}
                          </div>
                          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 capitalize flex-shrink-0">{item.data.type}</span>
                        </div>
                      )}
                      {section.key === 'tag' && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-emerald-600">#{item.data.name}</span>
                          {item.data.usage_count > 0 && <span className="text-xs text-slate-400">{item.data.usage_count} co.</span>}
                          <span className="ml-auto text-xs text-slate-300 flex-shrink-0">→</span>
                        </div>
                      )}
                    </button>
                  ))}
                  {section.hasMore && (
                    <button type="button" onMouseDown={() => go(section.moreHref)} className="w-full px-4 py-1.5 text-xs text-[#6d28d9] font-bold hover:bg-violet-50 transition-colors text-left">
                      See more {section.label.split(' ').slice(1).join(' ').toLowerCase()} →
                    </button>
                  )}
                </div>
              ))}
              <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100">
                <button type="button" onMouseDown={() => go(`/search?q=${encodeURIComponent(query.trim())}`)} className="w-full text-left text-sm font-bold text-[#6d28d9] hover:underline">
                  See all results for &ldquo;{query.trim()}&rdquo; →
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

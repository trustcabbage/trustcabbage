'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'
import { X, Hash } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toTagSlug, type TagChip } from '@/lib/tags'

const POSITIVE_CHIPS: TagChip[] = [
  { slug: 'satisfied',     name: 'Satisfied' },
  { slug: 'recommended',   name: 'Recommended' },
  { slug: 'good-value',    name: 'Good Value' },
  { slug: 'great-support', name: 'Great Support' },
  { slug: 'fast-delivery', name: 'Fast Delivery' },
  { slug: 'professional',  name: 'Professional' },
  { slug: 'transparent',   name: 'Transparent' },
  { slug: 'reliable',      name: 'Reliable' },
]
const NEGATIVE_CHIPS: TagChip[] = [
  { slug: 'disappointed',     name: 'Disappointed' },
  { slug: 'poor-support',     name: 'Poor Support' },
  { slug: 'overpriced',       name: 'Overpriced' },
  { slug: 'slow-delivery',    name: 'Slow Delivery' },
  { slug: 'unprofessional',   name: 'Unprofessional' },
  { slug: 'misleading',       name: 'Misleading' },
  { slug: 'not-recommended',  name: 'Not Recommended' },
  { slug: 'average-experience', name: 'Average Experience' },
]

interface TagInputProps {
  value: TagChip[]
  onChange: (tags: TagChip[]) => void
  placeholder?: string
  required?: boolean
  showSentimentChips?: boolean
  label?: string
  hint?: string
}

export function TagInput({
  value,
  onChange,
  placeholder = 'e.g. #PaymentGateway #UPI',
  required = false,
  showSentimentChips = false,
  label,
  hint,
}: TagInputProps) {
  const supabase = createClient()
  const [inputVal, setInputVal] = useState('')
  const [suggestions, setSuggestions] = useState<TagChip[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = inputVal.replace(/^#/, '').trim()
    if (q.length < 1) { setSuggestions([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const { data } = await supabase
        .from('tags')
        .select('id, name, slug')
        .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
        .eq('is_admin_verified', true)
        .order('usage_count', { ascending: false })
        .limit(8)
      setSuggestions((data as unknown as TagChip[]) ?? [])
    }, 180)
  }, [inputVal])

  function isAdded(slug: string) {
    return value.some(t => t.slug === slug)
  }

  function addTag(chip: TagChip) {
    const slug = chip.id ? chip.slug : toTagSlug(chip.name)
    if (!slug || slug.length < 2) return
    if (isAdded(slug)) return
    onChange([...value, { ...chip, slug }])
  }

  function removeTag(slug: string) {
    onChange(value.filter(t => t.slug !== slug))
  }

  function togglePreset(chip: TagChip) {
    if (isAdded(chip.slug)) removeTag(chip.slug)
    else addTag(chip)
  }

  function commitInput() {
    const raw = inputVal.trim()
    if (!raw) return
    // Support space-separated or comma-separated multi-tag entry
    const parts = raw.split(/[\s,]+/).filter(Boolean)
    for (const part of parts) {
      const slug = toTagSlug(part)
      if (slug.length >= 2 && !isAdded(slug)) {
        addTag({ name: part.replace(/^#/, ''), slug })
      }
    }
    setInputVal('')
    setSuggestions([])
    setShowDropdown(false)
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitInput()
    }
    if (e.key === 'Backspace' && !inputVal && value.length > 0) {
      removeTag(value[value.length - 1].slug)
    }
  }

  function selectSuggestion(chip: TagChip) {
    addTag(chip)
    setInputVal('')
    setSuggestions([])
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
          {label}{required && <span className="text-red-400 ml-1">*</span>}
        </p>
      )}

      {/* Input + chips container */}
      <div
        className="relative min-h-[44px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 flex flex-wrap gap-1.5 cursor-text focus-within:border-[#6d28d9] focus-within:ring-1 focus-within:ring-[#6d28d9] transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {value.map(tag => (
          <span
            key={tag.slug}
            className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 text-[#6d28d9] text-xs font-black px-2 py-1"
          >
            <Hash className="h-2.5 w-2.5" />
            {tag.name}
            <button
              type="button"
              onClick={e => { e.stopPropagation(); removeTag(tag.slug) }}
              className="ml-0.5 text-violet-400 hover:text-red-500 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={e => { setInputVal(e.target.value); setShowDropdown(true) }}
          onKeyDown={onKeyDown}
          onBlur={() => setTimeout(() => { commitInput(); setShowDropdown(false) }, 150)}
          onFocus={() => { if (inputVal.length >= 1) setShowDropdown(true) }}
          placeholder={value.length === 0 ? placeholder : '+ add tag'}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-950 placeholder:text-slate-400 outline-none border-0 py-0.5"
          autoComplete="off"
        />

        {/* Autocomplete dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-1 duration-150 absolute top-full left-0 right-0 mt-1.5 z-50 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
            {suggestions
              .filter(s => !isAdded(s.slug))
              .map(s => (
                <button
                  key={s.id}
                  type="button"
                  onMouseDown={() => selectSuggestion(s)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-violet-50 transition-colors"
                >
                  <span className="text-slate-400 font-black text-xs">#</span>
                  <span className="font-bold text-slate-950">{s.name}</span>
                  <span className="ml-auto text-[10px] text-slate-400 capitalize">{(s as any).type}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      {hint && <p className="text-xs text-slate-400">{hint}</p>}

      {/* Sentiment preset chips */}
      {showSentimentChips && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">Quick pick:</p>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {POSITIVE_CHIPS.map(chip => (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() => togglePreset(chip)}
                  className={`rounded-full px-2.5 py-1 text-xs font-black border transition-all ${
                    isAdded(chip.slug)
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {isAdded(chip.slug) ? '✓ ' : '+ '}#{chip.name}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {NEGATIVE_CHIPS.map(chip => (
                <button
                  key={chip.slug}
                  type="button"
                  onClick={() => togglePreset(chip)}
                  className={`rounded-full px-2.5 py-1 text-xs font-black border transition-all ${
                    isAdded(chip.slug)
                      ? 'bg-red-100 border-red-400 text-red-800'
                      : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                  }`}
                >
                  {isAdded(chip.slug) ? '✓ ' : '+ '}#{chip.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createFeature, deleteFeature } from '../_actions'

type Feature = { id: string; name: string; slug: string }

export function FeatureManager({ subcategoryId, subcategoryName }: { subcategoryId: string; subcategoryName: string }) {
  const supabase = createClient()
  const [features, setFeatures] = useState<Feature[]>([])
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('features')
      .select('id, name, slug')
      .eq('subcategory_id', subcategoryId)
      .order('sort_order')
    setFeatures((data ?? []) as Feature[])
  }, [subcategoryId])

  useEffect(() => { load() }, [load])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    await createFeature(subcategoryId, name.trim())
    setName('')
    await load()
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await deleteFeature(id)
    await load()
  }

  return (
    <div className="mt-4 pt-4 border-t border-violet-100">
      <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">
        Features <span className="normal-case font-normal text-slate-400">— predefined capabilities buyers can filter by</span>
      </p>

      <div className="flex flex-wrap gap-2 mb-3 min-h-[28px]">
        {features.length === 0 && (
          <p className="text-xs text-slate-400 italic">No features yet for {subcategoryName}.</p>
        )}
        {features.map(f => (
          <span
            key={f.id}
            className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-800"
          >
            {f.name}
            <button
              type="button"
              onClick={() => handleDelete(f.id)}
              className="text-violet-300 hover:text-red-500 transition-colors leading-none text-base"
              title={`Delete "${f.name}"`}
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Recurring Billing, QR Code, International Payments…"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-950 placeholder:text-slate-400 focus:border-[#6d28d9] focus:outline-none focus:ring-1 focus:ring-[#6d28d9]"
        />
        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2 text-sm disabled:opacity-40 transition-colors flex-shrink-0"
        >
          {loading ? '…' : '+ Add'}
        </button>
      </form>
    </div>
  )
}

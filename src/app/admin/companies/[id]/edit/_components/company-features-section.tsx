'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toggleCompanyFeature } from '../../../../categories/_actions'

type Feature = { id: string; name: string; slug: string; subcategory_id: string }
type Subcategory = { id: string; name: string; icon: string | null }

export function CompanyFeaturesSection({ companyId, subcategoryIds }: { companyId: string; subcategoryIds: string[] }) {
  const supabase = createClient()
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [features, setFeatures] = useState<Feature[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (subcategoryIds.length === 0) return
    const [{ data: subs }, { data: feats }, { data: cf }] = await Promise.all([
      supabase.from('categories').select('id, name, icon').in('id', subcategoryIds),
      supabase.from('features').select('id, name, slug, subcategory_id').in('subcategory_id', subcategoryIds).order('sort_order'),
      supabase.from('company_features').select('feature_id').eq('company_id', companyId),
    ])
    setSubcategories((subs ?? []) as Subcategory[])
    setFeatures((feats ?? []) as Feature[])
    setSelected(new Set(((cf ?? []) as any[]).map((r: any) => r.feature_id)))
  }, [companyId, subcategoryIds.join(',')])

  useEffect(() => { load() }, [load])

  async function toggle(featureId: string) {
    const isAdding = !selected.has(featureId)
    setSaving(featureId)
    // Optimistic update
    setSelected(prev => {
      const next = new Set(prev)
      isAdding ? next.add(featureId) : next.delete(featureId)
      return next
    })
    await toggleCompanyFeature(companyId, featureId, isAdding)
    setSaving(null)
  }

  if (subcategoryIds.length === 0) return null

  const totalFeatures = features.length
  if (totalFeatures === 0) return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-black text-slate-950 mb-2">Features</h2>
      <p className="text-sm text-slate-400">No features defined yet for this company's subcategories. Add features in <a href="/admin/categories" className="text-[#6d28d9] underline">Admin → Categories</a> → subcategory edit.</p>
    </div>
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
      <div>
        <h2 className="text-base font-black text-slate-950">Features</h2>
        <p className="text-xs text-slate-400 mt-0.5">Select all features this company offers. Buyers can filter by these on the category page.</p>
      </div>

      {subcategories.map(sub => {
        const subFeatures = features.filter(f => f.subcategory_id === sub.id)
        if (subFeatures.length === 0) return null
        return (
          <div key={sub.id}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
              {sub.icon && <span className="mr-1">{sub.icon}</span>}{sub.name}
            </p>
            <div className="flex flex-wrap gap-2">
              {subFeatures.map(f => {
                const isOn = selected.has(f.id)
                const isSaving = saving === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggle(f.id)}
                    disabled={isSaving}
                    className={`rounded-full px-3 py-1.5 text-xs font-black border transition-all disabled:opacity-60 ${
                      isOn
                        ? 'bg-[#6d28d9] border-[#6d28d9] text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-[#6d28d9] hover:text-[#6d28d9]'
                    }`}
                  >
                    {isSaving ? '…' : isOn ? `✓ ${f.name}` : f.name}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

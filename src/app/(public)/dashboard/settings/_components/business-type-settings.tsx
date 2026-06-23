'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { BusinessTypeSelector, type BusinessType } from '@/components/business-type-selector'

interface Props {
  companyId: string
  companyName: string
  currentBusinessType: string
  userId: string
}

export function BusinessTypeSettings({ companyId, companyName, currentBusinessType, userId }: Props) {
  const supabase = createClient()
  const [businessType, setBusinessType] = useState<BusinessType | ''>(
    (currentBusinessType as BusinessType) ?? ''
  )
  const [saving, setSaving] = useState(false)
  const hasChanged = businessType !== currentBusinessType

  async function save() {
    if (!businessType || !hasChanged) return
    setSaving(true)

    const { error } = await supabase
      .from('companies')
      .update({ business_type: businessType })
      .eq('id', companyId)

    if (error) {
      toast.error('Failed to save. Please try again.')
      setSaving(false)
      return
    }

    await supabase.from('audit_log').insert({
      entity_type: 'company',
      entity_id: companyId,
      action: 'update_business_type',
      old_value: { business_type: currentBusinessType },
      new_value: { business_type: businessType },
      changed_by: userId,
      changed_by_role: 'company_admin',
    })

    setSaving(false)
    toast.success('Company type updated.')
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-black text-slate-950 text-sm">Company type</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Changing this affects which review questions your customers see and where {companyName} appears in directory listings.
        </p>
      </div>
      <div className="px-5 py-5 space-y-5">
        <BusinessTypeSelector
          value={businessType}
          onChange={(v) => setBusinessType(v)}
        />
        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            onClick={save}
            disabled={saving || !hasChanged || !businessType}
            className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-6 py-2.5 text-sm disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {!hasChanged && businessType && (
            <span className="text-xs text-slate-400">No changes</span>
          )}
        </div>
      </div>
    </div>
  )
}

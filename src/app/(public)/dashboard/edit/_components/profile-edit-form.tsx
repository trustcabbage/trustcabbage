'use client'

import { useActionState, useRef, useState } from 'react'
import { updateProfile } from '../_actions'
import { CheckCircle, AlertCircle, Upload, Loader2, ChevronDown, X, Search } from 'lucide-react'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'Jammu & Kashmir',
]

const EMPLOYEE_RANGES = ['1–10', '11–50', '51–200', '201–500', '500+']

interface Props {
  company: {
    name: string
    description: string | null
    website: string | null
    city: string | null
    state: string | null
    founded_year: number | null
    employee_count: string | null
    gst_number: string | null
    cin_number: string | null
    logo_url: string | null
  }
  allCategories: { id: string; name: string; slug: string; parent_id: string | null }[]
  currentCategoryIds: string[]
}

export function ProfileEditForm({ company, allCategories, currentCategoryIds }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)
  const [logoPreview, setLogoPreview] = useState<string>(company.logo_url ?? '')
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(currentCategoryIds)
  const [catDropdownOpen, setCatDropdownOpen] = useState(false)
  const [catSearch, setCatSearch] = useState('')

  function toggleCategory(id: string) {
    setSelectedCategoryIds(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const filteredCategories = allCategories.filter(c =>
    c.name.toLowerCase().includes(catSearch.toLowerCase())
  )
  const fileRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setLogoPreview(URL.createObjectURL(f))
  }

  const input = 'w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors'
  const label = 'block text-xs font-black text-slate-600 mb-1.5'

  return (
    <form action={action}>
      {state?.error && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          <CheckCircle className="h-4 w-4 flex-shrink-0" /> {state.success}
        </div>
      )}

      {/* Logo */}
      <div className="mb-6">
        <p className={label}>Company logo</p>
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoPreview
              ? <img src={logoPreview} alt="Logo preview" className="h-16 w-16 object-cover" />
              : <Upload className="h-6 w-6 text-slate-300" />}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-black text-xs px-4 py-2 transition-colors"
            >
              {logoPreview ? 'Change logo' : 'Upload logo'}
            </button>
            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, WebP · max 5 MB</p>
            <input ref={fileRef} name="logo" type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div className="sm:col-span-2">
          <label className={label}>Company name *</label>
          <input name="name" type="text" required defaultValue={company.name} className={input} placeholder="Acme Solutions Pvt Ltd" />
        </div>

        <div className="sm:col-span-2">
          <label className={label}>Short description</label>
          <textarea name="description" rows={3} defaultValue={company.description ?? ''} className={input} placeholder="What does your company do? (shown on your profile)" />
        </div>

        <div>
          <label className={label}>Website</label>
          <input name="website" type="url" defaultValue={company.website ?? ''} className={input} placeholder="https://yourcompany.in" />
        </div>

        <div>
          <label className={label}>Founded year</label>
          <input name="founded_year" type="number" min="1900" max={new Date().getFullYear()} defaultValue={company.founded_year ?? ''} className={input} placeholder="2018" />
        </div>

        <div>
          <label className={label}>City</label>
          <input name="city" type="text" defaultValue={company.city ?? ''} className={input} placeholder="Bengaluru" />
        </div>

        <div>
          <label className={label}>State</label>
          <select name="state" defaultValue={company.state ?? ''} className={input}>
            <option value="">Select state</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>Team size</label>
          <select name="employee_count" defaultValue={company.employee_count ?? ''} className={input}>
            <option value="">Select range</option>
            {EMPLOYEE_RANGES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div>
          <label className={label}>GST number</label>
          <input name="gst_number" type="text" defaultValue={company.gst_number ?? ''} className={input} placeholder="22AAAAA0000A1Z5" />
        </div>

        <div>
          <label className={label}>CIN number</label>
          <input name="cin_number" type="text" defaultValue={company.cin_number ?? ''} className={input} placeholder="U72900MH2018PTC123456" />
        </div>
      </div>

      {/* Categories */}
      {allCategories.length > 0 && (
        <div className="mb-4">
          <p className={label}>Categories <span className="text-slate-400 font-normal">(select all that apply)</span></p>
          <input type="hidden" name="categories_updated" value="1" />
          {selectedCategoryIds.map(id => (
            <input key={id} type="hidden" name="category_ids" value={id} />
          ))}

          {/* Dropdown trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setCatDropdownOpen(o => !o)}
              className="w-full flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors"
            >
              <span className={selectedCategoryIds.length === 0 ? 'text-slate-400' : 'text-slate-900 font-bold'}>
                {selectedCategoryIds.length === 0
                  ? 'Select categories…'
                  : `${selectedCategoryIds.length} categor${selectedCategoryIds.length === 1 ? 'y' : 'ies'} selected`}
              </span>
              <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${catDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {catDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setCatDropdownOpen(false)} />
                <div className="absolute top-full left-0 right-0 mt-1.5 z-20 bg-white rounded-xl border border-slate-200 shadow-lg overflow-hidden">
                  {/* Search */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
                    <Search className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                    <input
                      type="text"
                      autoFocus
                      placeholder="Search categories…"
                      value={catSearch}
                      onChange={e => setCatSearch(e.target.value)}
                      className="flex-1 text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                    />
                    {catSearch && (
                      <button type="button" onClick={() => setCatSearch('')}>
                        <X className="h-3.5 w-3.5 text-slate-400 hover:text-slate-600" />
                      </button>
                    )}
                  </div>
                  {/* Options list */}
                  <div className="max-h-56 overflow-y-auto">
                    {filteredCategories.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-slate-400">No categories match</p>
                    ) : filteredCategories.map(cat => {
                      const selected = selectedCategoryIds.includes(cat.id)
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-left transition-colors ${
                            selected ? 'bg-violet-50 text-[#6d28d9] font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className={`h-4 w-4 flex-shrink-0 rounded border flex items-center justify-center transition-colors ${selected ? 'bg-[#6d28d9] border-[#6d28d9]' : 'border-slate-300'}`}>
                            {selected && <span className="text-white text-[10px] font-black">✓</span>}
                          </span>
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                  {selectedCategoryIds.length > 0 && (
                    <div className="border-t border-slate-100 px-4 py-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{selectedCategoryIds.length} selected</span>
                      <button type="button" onClick={() => setSelectedCategoryIds([])} className="text-xs font-black text-red-500 hover:text-red-700 transition-colors">Clear all</button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Selected pills preview */}
          {selectedCategoryIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedCategoryIds.map(id => {
                const cat = allCategories.find(c => c.id === id)
                if (!cat) return null
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-violet-100 border border-violet-200 text-[#6d28d9] text-xs font-bold px-2.5 py-1">
                    {cat.name}
                    <button type="button" onClick={() => toggleCategory(id)} className="hover:text-red-500 transition-colors ml-0.5">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-6 py-3 text-sm transition-colors"
      >
        {pending ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : 'Save profile'}
      </button>
    </form>
  )
}

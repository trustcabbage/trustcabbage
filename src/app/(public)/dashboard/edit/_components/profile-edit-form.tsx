'use client'

import { useActionState, useRef, useState } from 'react'
import { updateProfile } from '../_actions'
import { CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react'

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
}

export function ProfileEditForm({ company }: Props) {
  const [state, action, pending] = useActionState(updateProfile, undefined)
  const [logoPreview, setLogoPreview] = useState<string>(company.logo_url ?? '')
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

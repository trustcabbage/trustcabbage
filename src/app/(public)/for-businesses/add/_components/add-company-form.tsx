'use client'

import { useActionState } from 'react'
import { addCompany } from '../_actions'

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
  'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry', 'Ladakh', 'Jammu & Kashmir',
]

interface Category { id: string; name: string; slug: string; icon: string | null }

export function AddCompanyForm({ initialName, categories }: { initialName: string; categories: Category[] }) {
  const [state, action, pending] = useActionState(addCompany, undefined)

  return (
    <form action={action} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-bold text-red-700">
          {state.error}
        </div>
      )}

      {/* Company name */}
      <div>
        <label htmlFor="name" className="block text-sm font-black text-slate-950 mb-1.5">
          Company name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={initialName}
          placeholder="e.g. Razorpay, Zoho, Delhivery"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30"
        />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category_id" className="block text-sm font-black text-slate-950 mb-1.5">
          Primary category
        </label>
        <select
          id="category_id"
          name="category_id"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30 bg-white"
        >
          <option value="">Select a category…</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.icon ? `${cat.icon} ` : ''}{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Website */}
      <div>
        <label htmlFor="website" className="block text-sm font-black text-slate-950 mb-1.5">
          Website URL
        </label>
        <input
          id="website"
          name="website"
          type="url"
          placeholder="https://yourcompany.com"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30"
        />
      </div>

      {/* City + State */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="city" className="block text-sm font-black text-slate-950 mb-1.5">City</label>
          <input
            id="city"
            name="city"
            placeholder="Mumbai"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-black text-slate-950 mb-1.5">State</label>
          <select
            id="state"
            name="state"
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30 bg-white"
          >
            <option value="">Select…</option>
            {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-black text-slate-950 mb-1.5">
          What does your company do? <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Brief description of your products or services…"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-950 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]/30 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        {pending ? 'Creating your page…' : 'Create my company page →'}
      </button>
    </form>
  )
}

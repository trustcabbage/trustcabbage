'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronDown, Check, Building2 } from 'lucide-react'
import { switchActiveCompany } from '../_actions'

export interface SwitcherCompany { id: string; name: string; slug: string; logo_url: string | null }

// Only rendered when the user belongs to more than one company (dashboard
// page decides that). Switching never costs them membership in the company
// they're leaving, it's purely which dashboard is currently active.
export function CompanySwitcher({ current, companies }: { current: string; companies: SwitcherCompany[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  async function switchTo(companyId: string) {
    if (companyId === current) { setOpen(false); return }
    setBusy(true)
    const res = await switchActiveCompany(companyId)
    setBusy(false)
    setOpen(false)
    if (!res.ok) { toast.error(res.error); return }
    router.refresh()
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors"
      >
        <Building2 className="h-3.5 w-3.5" /> Switch company <ChevronDown className="h-3.5 w-3.5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-lg z-50 py-1.5 overflow-hidden">
            {companies.map(co => (
              <button
                key={co.id}
                type="button"
                onClick={() => switchTo(co.id)}
                disabled={busy}
                className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-left hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <div className="h-7 w-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {co.logo_url
                    ? <img src={co.logo_url} alt={co.name} className="h-7 w-7 object-cover" />
                    : <span className="text-[11px] font-black text-[#6d28d9]">{co.name[0]}</span>}
                </div>
                <span className="text-xs font-bold text-slate-700 truncate flex-1">{co.name}</span>
                {co.id === current && <Check className="h-3.5 w-3.5 text-[#6d28d9] flex-shrink-0" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

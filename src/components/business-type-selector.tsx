'use client'

export type BusinessType = 'business_services' | 'online_b2c' | 'retail_chain' | 'both'

interface Props {
  value: BusinessType | ''
  onChange: (value: BusinessType) => void
  error?: string
}

const OPTIONS = [
  {
    value: 'business_services' as BusinessType,
    label: 'Business Services Company',
    description: 'I provide services or solutions to other businesses.',
    examples: 'Web agency, CA firm, logistics, SaaS, HR software, IT company',
    icon: '🏢',
  },
  {
    value: 'online_b2c' as BusinessType,
    label: 'Online B2C Company',
    description: 'I sell products directly to consumers online.',
    examples: 'Skincare brand, fashion store, D2C food brand, electronics store',
    icon: '🛒',
  },
  {
    value: 'retail_chain' as BusinessType,
    label: 'Retail Chain / Retail Store',
    description: 'I have physical stores selling to consumers.',
    examples: 'Pharmacy chain, supermarket, multi-city fashion store',
    icon: '🏪',
  },
] as const

export function BusinessTypeSelector({ value, onChange, error }: Props) {
  return (
    <div>
      <div className="space-y-3">
        {OPTIONS.map(opt => {
          const selected = value === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
                selected
                  ? 'border-[#6d28d9] bg-violet-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50/40'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Radio indicator */}
                <div className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected ? 'border-[#6d28d9] bg-[#6d28d9]' : 'border-slate-300'
                }`}>
                  {selected && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg leading-none">{opt.icon}</span>
                    <p className={`font-black text-sm ${selected ? 'text-[#6d28d9]' : 'text-slate-950'}`}>
                      {opt.label}
                    </p>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">{opt.description}</p>
                  <p className="text-xs text-slate-400 mt-1">e.g. {opt.examples}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600 font-bold">{error}</p>
      )}

      <p className="mt-3 text-xs text-slate-400">
        Not sure? Think about who their customers are — other businesses (first option) or regular people buying for themselves (second or third option).
      </p>
    </div>
  )
}

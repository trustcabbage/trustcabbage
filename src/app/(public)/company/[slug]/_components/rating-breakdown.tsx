const B2B_FACTORS = [
  { key: 'rating_staff',        label: 'Staff behaviour' },
  { key: 'rating_quality',      label: 'Product / service quality' },
  { key: 'rating_communication',label: 'Communication & support' },
  { key: 'rating_billing',      label: 'Monetary & billing' },
  { key: 'rating_after_sales',  label: 'After-sales support' },
  { key: 'rating_delivery',     label: 'Delivery & timelines' },
] as const

const B2C_FACTORS = [
  { key: 'rating_product_accuracy', label: 'Product accuracy' },
  { key: 'rating_packaging',        label: 'Packaging' },
  { key: 'rating_delivery_speed',   label: 'Delivery speed' },
  { key: 'rating_return_refund',    label: 'Returns & refunds' },
  { key: 'rating_value_for_money',  label: 'Value for money' },
  { key: 'rating_customer_support', label: 'Customer support' },
] as const

const RETAIL_FACTORS = [
  { key: 'rating_store_experience', label: 'In-store experience' },
  { key: 'rating_staff_in_store',   label: 'Staff in store' },
] as const

function avg(reviews: any[], key: string): number {
  const valid = reviews.filter(r => r[key] != null)
  if (!valid.length) return 0
  return valid.reduce((s: number, r: any) => s + r[key], 0) / valid.length
}

function FactorBar({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-48 text-slate-600 flex-shrink-0 text-sm">{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2">
        <div className="bg-[#6d28d9] h-2 rounded-full transition-all" style={{ width: `${(score / 5) * 100}%` }} />
      </div>
      <span className="w-8 text-right font-black text-slate-800 text-sm">
        {score > 0 ? score.toFixed(1) : '—'}
      </span>
    </div>
  )
}

interface Props {
  reviews: any[]
  businessType: string
}

export function RatingBreakdown({ reviews, businessType }: Props) {
  if (reviews.length === 0) return null

  const showB2b = businessType === 'business_services' || businessType === 'both'
  const showB2c = businessType === 'online_b2c' || businessType === 'retail_chain' || businessType === 'both'
  const isRetail = businessType === 'retail_chain'

  const hasB2bData = showB2b && B2B_FACTORS.some(f => reviews.some(r => r[f.key] != null))
  const hasB2cData = showB2c && B2C_FACTORS.some(f => reviews.some(r => r[f.key] != null))

  if (!hasB2bData && !hasB2cData) return null

  const isBoth = hasB2bData && hasB2cData

  return (
    <div>
      <h2 className="text-xl font-black text-slate-950 mb-4">Rating breakdown</h2>

      {hasB2bData && (
        <div className={isBoth ? 'mb-6' : ''}>
          {isBoth && (
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">B2B reviews</p>
          )}
          <div className="space-y-3">
            {B2B_FACTORS.map(({ key, label }) => (
              <FactorBar key={key} label={label} score={avg(reviews, key)} />
            ))}
          </div>
        </div>
      )}

      {hasB2cData && (
        <div>
          {isBoth && (
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Consumer reviews</p>
          )}
          <div className="space-y-3">
            {B2C_FACTORS.map(({ key, label }) => (
              <FactorBar key={key} label={label} score={avg(reviews, key)} />
            ))}
            {isRetail && RETAIL_FACTORS.map(({ key, label }) => {
              const score = avg(reviews, key)
              return score > 0 ? <FactorBar key={key} label={label} score={score} /> : null
            })}
          </div>
        </div>
      )}
    </div>
  )
}

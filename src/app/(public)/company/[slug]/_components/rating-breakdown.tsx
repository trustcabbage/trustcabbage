interface Review {
  rating_staff: number
  rating_quality: number
  rating_communication: number
  rating_billing: number
  rating_after_sales: number
  rating_delivery: number
}

interface RatingBreakdownProps {
  reviews: Review[]
}

const FACTORS = [
  { key: 'rating_staff', label: 'Staff behaviour' },
  { key: 'rating_quality', label: 'Product / service quality' },
  { key: 'rating_communication', label: 'Communication & support' },
  { key: 'rating_billing', label: 'Monetary & billing' },
  { key: 'rating_after_sales', label: 'After-sales support' },
  { key: 'rating_delivery', label: 'Delivery & timelines' },
] as const

function avg(reviews: Review[], key: keyof Review) {
  if (reviews.length === 0) return 0
  return reviews.reduce((sum, r) => sum + (r[key] as number), 0) / reviews.length
}

export function RatingBreakdown({ reviews }: RatingBreakdownProps) {
  if (reviews.length === 0) return null

  return (
    <div>
      <h2 className="text-xl font-black text-slate-950 mb-4">Rating breakdown</h2>
      <div className="space-y-3">
        {FACTORS.map(({ key, label }) => {
          const score = avg(reviews, key)
          const pct = (score / 5) * 100
          return (
            <div key={key} className="flex items-center gap-3 text-sm">
              <span className="w-44 text-slate-600 flex-shrink-0">{label}</span>
              <div className="flex-1 bg-slate-100 rounded-full h-2">
                <div
                  className="bg-[#6d28d9] h-2 rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 text-right font-black text-slate-800">{score.toFixed(1)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

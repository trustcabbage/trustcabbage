import { Check } from 'lucide-react'

// Twitter/X-style verified badge: a solid blue circle with a white
// checkmark, no text label needed, the icon itself is the meaning.
// Blue is deliberate here rather than the brand violet, "blue check" is
// a near-universal trust signal that reads faster than any brand color.
const SIZES = {
  sm: { badge: 'h-3.5 w-3.5', check: 'h-2 w-2' },
  md: { badge: 'h-4 w-4', check: 'h-2.5 w-2.5' },
  lg: { badge: 'h-5 w-5', check: 'h-3 w-3' },
} as const

export function VerifiedBadge({ size = 'sm', className = '' }: { size?: keyof typeof SIZES; className?: string }) {
  const { badge, check } = SIZES[size]
  return (
    <span
      title="Verified company"
      className={`inline-flex items-center justify-center flex-shrink-0 rounded-full bg-blue-500 ${badge} ${className}`}
    >
      <Check className={check} color="white" strokeWidth={3.5} />
    </span>
  )
}

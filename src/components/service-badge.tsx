import { Zap } from 'lucide-react'

// Earned, never bought: >= 10 published complaints, >= 80% resolved, and
// average resolution under 72 hours. Computed from published cases only.
export function qualifiesForServiceBadge(stats: {
  complaints: number
  resolved: number
  avgResolutionHours: number | null
}): boolean {
  return (
    stats.complaints >= 10 &&
    stats.resolved / stats.complaints >= 0.8 &&
    stats.avgResolutionHours !== null &&
    stats.avgResolutionHours < 72
  )
}

export function ServiceBadge({ className = '' }: { className?: string }) {
  return (
    <span
      title="Resolves issues fast: at least 80% of public complaints resolved, typically within 72 hours"
      className={`inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 border border-green-200 px-2.5 py-0.5 text-xs font-black ${className}`}
    >
      <Zap className="h-3 w-3" /> Resolves issues fast
    </span>
  )
}

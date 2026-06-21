// Plan-based feature limits.
// During early access all limits are unenforced (EARLY_ACCESS = true).
// Flip EARLY_ACCESS to false and set enforce flags to activate gating.

export const EARLY_ACCESS = true

export type Plan = 'free' | 'starter' | 'growth'

export const PLAN_LIMITS = {
  free: {
    emailInvitesPerMonth: 100,
    bulkCsvInvite: false,
    widgetWatermark: true,
    qrCodeDownload: false,
  },
  starter: {
    emailInvitesPerMonth: 100,
    bulkCsvInvite: false,
    widgetWatermark: false,
    qrCodeDownload: false,
  },
  growth: {
    emailInvitesPerMonth: Infinity,
    bulkCsvInvite: true,
    widgetWatermark: false,
    qrCodeDownload: true,
  },
} as const

// Returns true if the feature is allowed, respecting EARLY_ACCESS.
export function canUseFeature(
  plan: Plan,
  feature: keyof typeof PLAN_LIMITS['free']
): boolean {
  if (EARLY_ACCESS) return true
  const limit = PLAN_LIMITS[plan][feature]
  return limit !== false && limit !== 0
}

// Returns the email invite limit for a plan (Infinity = unlimited).
// During EARLY_ACCESS always returns Infinity.
export function emailInviteLimit(plan: Plan): number {
  if (EARLY_ACCESS) return Infinity
  return PLAN_LIMITS[plan].emailInvitesPerMonth
}

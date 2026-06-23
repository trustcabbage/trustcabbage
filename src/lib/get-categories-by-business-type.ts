import type { BusinessType } from '@/components/business-type-selector'

export interface CategoryOption {
  id: string
  name: string
  slug: string
  icon: string | null
  parent_id: string | null
  platform_type: 'b2b' | 'b2c' | 'both'
}

export function getCategoriesByBusinessType(
  businessType: BusinessType,
  allCategories: CategoryOption[]
): CategoryOption[] {
  if (businessType === 'both') return allCategories

  const platformType = businessType === 'business_services' ? 'b2b' : 'b2c'

  return allCategories.filter(
    cat => cat.platform_type === platformType || cat.platform_type === 'both'
  )
}

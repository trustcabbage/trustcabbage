'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  onChange?: (value: number) => void
  className?: string
}

const sizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-6 w-6' }

export function StarRating({ value, max = 5, size = 'md', interactive = false, onChange, className }: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            sizeMap[size],
            'transition-colors',
            i < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-gray-100 text-gray-300',
            interactive && 'cursor-pointer hover:fill-amber-300 hover:text-amber-400'
          )}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  )
}

'use client'

import { TitleCard } from './TitleCard'
import { Film } from 'lucide-react'
import type { AvailabilityCard } from '@/types'

interface TitleGridProps {
  cards: AvailabilityCard[]
  loading?: boolean
  skeletonCount?: number
  onCardSelect?: (card: AvailabilityCard) => void
  emptyMessage?: string
}

/**
 * Skeleton card for loading state
 */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg overflow-hidden bg-[#242424]">
      {/* Poster skeleton */}
      <div className="aspect-[2/3] w-full bg-[#333333]" />

      {/* Info skeleton */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <div className="h-4 bg-[#333333] rounded w-3/4" />
        {/* Year/runtime */}
        <div className="h-3 bg-[#333333] rounded w-1/2" />
      </div>
    </div>
  )
}

/**
 * Empty state component
 */
function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
        <Film className="w-10 h-10 text-gray-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-400 mb-2">{message}</h3>
      <p className="text-sm text-gray-600 max-w-md">
        Try adjusting your filters or search terms to find more titles.
      </p>
    </div>
  )
}

/**
 * Responsive grid component for displaying title cards
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TitleGrid cards={movies} onCardSelect={handleSelect} />
 *
 * // Loading state
 * <TitleGrid cards={[]} loading={true} skeletonCount={12} />
 *
 * // Custom empty message
 * <TitleGrid cards={[]} emptyMessage="No horror movies found" />
 * ```
 */
export function TitleGrid({
  cards,
  loading = false,
  skeletonCount = 12,
  onCardSelect,
  emptyMessage = 'No titles found',
}: TitleGridProps) {
  // Show loading skeletons
  if (loading) {
    return (
      <div
        className="
          grid gap-4
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          xl:grid-cols-6
        "
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={`skeleton-${index}`} />
        ))}
      </div>
    )
  }

  // Show empty state
  if (!cards || cards.length === 0) {
    return (
      <div
        className="
          grid gap-4
          grid-cols-2
          sm:grid-cols-3
          md:grid-cols-4
          lg:grid-cols-5
          xl:grid-cols-6
        "
      >
        <EmptyState message={emptyMessage} />
      </div>
    )
  }

  // Show cards
  return (
    <div
      className="
        grid gap-4
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        lg:grid-cols-5
        xl:grid-cols-6
      "
    >
      {cards.map((card) => (
        <TitleCard key={card.id} card={card} onSelect={onCardSelect} />
      ))}
    </div>
  )
}

export default TitleGrid

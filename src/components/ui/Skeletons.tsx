'use client'

import { cn } from '@/lib/utils'

/**
 * Base skeleton component with pulse animation
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-[#333333]', className)}
      {...props}
    />
  )
}

/**
 * Title card skeleton - matches TitleCard dimensions
 */
export function TitleCardSkeleton() {
  return (
    <div className="rounded-lg overflow-hidden bg-[#242424]">
      {/* Poster skeleton */}
      <Skeleton className="aspect-[2/3] w-full" />

      {/* Info skeleton */}
      <div className="p-3 space-y-2">
        {/* Title */}
        <Skeleton className="h-4 w-3/4" />
        {/* Year/runtime */}
        <Skeleton className="h-3 w-1/2" />
        {/* Rating */}
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  )
}

/**
 * Grid of title card skeletons
 */
export function TitleGridSkeleton({ count = 12 }: { count?: number }) {
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
      {Array.from({ length: count }).map((_, index) => (
        <TitleCardSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  )
}

/**
 * EPG Grid skeleton - matches EPGGrid layout
 */
export function EPGGridSkeleton({ channelCount = 6, hoursToShow = 4 }: { channelCount?: number; hoursToShow?: number }) {
  const timeSlots = hoursToShow * 2 // 30-minute slots

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#141414] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-20 h-10 rounded-lg" />
          <Skeleton className="w-10 h-10 rounded-lg" />
        </div>
        <Skeleton className="w-48 h-5" />
      </div>

      {/* Grid */}
      <div className="flex">
        {/* Channel column */}
        <div className="w-[150px] border-r border-gray-800 flex-shrink-0">
          <div className="h-10 bg-[#141414] border-b border-gray-800" />
          {Array.from({ length: channelCount }).map((_, i) => (
            <div key={i} className="h-16 border-b border-gray-800 p-3 flex items-center">
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="flex-1 overflow-hidden">
          {/* Time header */}
          <div className="h-10 bg-[#141414] border-b border-gray-800 flex">
            {Array.from({ length: timeSlots }).map((_, i) => (
              <div key={i} className="w-[90px] flex-shrink-0 border-l border-gray-800 px-2 flex items-center">
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Channel rows */}
          {Array.from({ length: channelCount }).map((_, rowIndex) => (
            <div key={rowIndex} className="h-16 border-b border-gray-800 p-2 flex gap-2">
              <Skeleton className="h-12 flex-1 max-w-[200px] rounded" />
              <Skeleton className="h-12 w-32 rounded" />
              <Skeleton className="h-12 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Filter bar skeleton
 */
export function FilterBarSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <Skeleton className="h-11 flex-1 rounded-lg" />

      {/* Filter buttons */}
      <div className="flex gap-2">
        <Skeleton className="h-11 w-28 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
        <Skeleton className="h-11 w-28 rounded-lg" />
      </div>
    </div>
  )
}

/**
 * Carousel skeleton
 */
export function CarouselSkeleton({ itemCount = 6 }: { itemCount?: number }) {
  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Skeleton className="w-6 h-6 rounded" />
        <div className="space-y-1">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
      </div>

      {/* Carousel items */}
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[280px]">
            <Skeleton className="aspect-video w-full rounded-lg mb-3" />
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Detail modal skeleton
 */
export function DetailModalSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with poster */}
      <div className="flex gap-6">
        <Skeleton className="w-32 h-48 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* Synopsis */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Streaming services */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

/**
 * Page loading skeleton with header
 */
export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header skeleton */}
      <div className="h-16 bg-[#141414] border-b border-gray-800 flex items-center px-4">
        <Skeleton className="h-8 w-48" />
        <div className="ml-auto flex gap-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>

      {/* Content area */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <FilterBarSkeleton />
        <TitleGridSkeleton count={18} />
      </div>
    </div>
  )
}

export { Skeleton }

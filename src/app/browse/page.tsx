'use client'

import { useEffect, useRef, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Ghost, Film, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { FilterBar, type FilterState } from '@/components/FilterBar'
import { TitleGrid } from '@/components/TitleGrid'
import { fetchBrowseCards } from '@/lib/browse-data'
import type { AvailabilityCard } from '@/types'

/**
 * Hook to read filters from URL search params
 */
function useFilters(): FilterState {
  const searchParams = useSearchParams()

  return {
    q: searchParams.get('q') || undefined,
    genre: searchParams.get('genre') || undefined,
    decade: searchParams.get('decade') || undefined,
    service: searchParams.get('service') || undefined,
    runtime: searchParams.get('runtime') || undefined,
    sort: searchParams.get('sort') || undefined,
  }
}

/**
 * Intersection observer hook for infinite scroll
 */
function useIntersectionObserver(
  callback: () => void,
  enabled: boolean
): React.RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback()
        }
      },
      { rootMargin: '200px' } // Trigger 200px before element is visible
    )

    const current = ref.current
    if (current) {
      observer.observe(current)
    }

    return () => {
      if (current) {
        observer.unobserve(current)
      }
    }
  }, [callback, enabled])

  return ref as React.RefObject<HTMLDivElement>
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <Film className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        No titles match your filters
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        Try adjusting your filter criteria or clearing some filters to see more results.
      </p>
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Clear all filters
      </Link>
    </div>
  )
}

/**
 * Loading more indicator
 */
function LoadingMore() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
      <span className="ml-2 text-gray-400">Loading more titles...</span>
    </div>
  )
}

/**
 * Browse page content component
 */
function BrowseContent() {
  const filters = useFilters()

  // Fetch cards with infinite scroll
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['browse-cards', filters],
    queryFn: ({ pageParam }) => fetchBrowseCards(filters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000,
  })

  // Flatten all pages into single array
  const allCards = data?.pages.flatMap((page) => page.cards) || []
  const totalCount = data?.pages[0]?.totalCount || 0

  // Load more when scroll trigger is visible
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const loadMoreRef = useIntersectionObserver(loadMore, hasNextPage || false)

  // Card selection handler
  const handleCardSelect = (card: AvailabilityCard) => {
    console.log('Selected:', card.title)
    // TODO: Open detail modal or navigate
  }

  return (
    <>
      {/* Filter Bar */}
      <FilterBar loading={isLoading} resultCount={isLoading ? undefined : totalCount} />

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-center mb-8">
            <p className="text-red-400">Failed to load titles</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <TitleGrid cards={[]} loading={true} skeletonCount={12} />
        )}

        {/* Results */}
        {!isLoading && !error && (
          <>
            {allCards.length === 0 ? (
              <EmptyState />
            ) : (
              <>
                <TitleGrid cards={allCards} onCardSelect={handleCardSelect} />

                {/* Load more trigger */}
                <div ref={loadMoreRef} className="h-1" />

                {/* Loading more indicator */}
                {isFetchingNextPage && <LoadingMore />}

                {/* End of results */}
                {!hasNextPage && allCards.length > 0 && (
                  <div className="text-center py-8 text-gray-600 text-sm">
                    You've reached the end &middot; {totalCount} titles total
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}

/**
 * Browse Page
 *
 * URL-driven filtering with infinite scroll.
 * Example: /browse?genre=horror&decade=1980s&sort=rating
 */
export default function BrowsePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Ghost className="w-8 h-8 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <div>
                <h1 className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                  Browse
                </h1>
                <p className="text-xs text-gray-500">Find your next horror fix</p>
              </div>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                TV Guide
              </Link>
              <Link
                href="/browse"
                className="text-sm text-purple-400 font-medium"
              >
                Browse
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Content with Suspense for useSearchParams */}
      <Suspense
        fallback={
          <div className="max-w-[1600px] mx-auto px-4 py-8">
            <TitleGrid cards={[]} loading={true} skeletonCount={12} />
          </div>
        }
      >
        <BrowseContent />
      </Suspense>
    </main>
  )
}

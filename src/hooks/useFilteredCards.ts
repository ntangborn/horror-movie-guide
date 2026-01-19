'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import {
  DECADE_OPTIONS,
  RUNTIME_OPTIONS,
  type FilterState,
} from '@/components/FilterBar'
import type { AvailabilityCard } from '@/types'

const PAGE_SIZE = 24

interface FetchCardsParams {
  filters: FilterState
  pageParam?: number
}

interface FetchCardsResult {
  cards: AvailabilityCard[]
  nextPage: number | null
  totalCount: number
}

/**
 * Fetch cards from Supabase with filters applied
 */
async function fetchFilteredCards({
  filters,
  pageParam = 0,
}: FetchCardsParams): Promise<FetchCardsResult> {
  let query = supabase
    .from('availability_cards')
    .select('*', { count: 'exact' })

  // Genre filter - check if genres array contains value
  if (filters.genre) {
    // Case-insensitive genre matching
    query = query.contains('genres', [filters.genre])
  }

  // Decade filter - filter by year range
  if (filters.decade) {
    const decade = DECADE_OPTIONS.find((d) => d.value === filters.decade)
    if (decade) {
      query = query.gte('year', decade.min).lte('year', decade.max)
    }
  }

  // Service filter - check if any source matches service
  if (filters.service) {
    // Use contains on JSONB sources array
    // This checks if any source object has matching service name
    query = query.filter(
      'sources',
      'cs',
      `[{"service":"${filters.service}"}]`
    )
  }

  // Runtime filter
  if (filters.runtime) {
    const runtime = RUNTIME_OPTIONS.find((r) => r.value === filters.runtime)
    if (runtime) {
      if ('min' in runtime && runtime.min !== undefined) {
        query = query.gte('runtime_minutes', runtime.min)
      }
      if ('max' in runtime && runtime.max !== undefined) {
        query = query.lte('runtime_minutes', runtime.max)
      }
    }
  }

  // Sorting
  switch (filters.sort) {
    case 'rating':
      query = query.order('imdb_rating', { ascending: false, nullsFirst: false })
      break
    case 'year_desc':
      query = query.order('year', { ascending: false })
      break
    case 'year_asc':
      query = query.order('year', { ascending: true })
      break
    case 'title':
      query = query.order('title', { ascending: true })
      break
    case 'recently_added':
      query = query.order('created_at', { ascending: false })
      break
    default:
      // Default: genre highlights first, then by rating
      query = query
        .order('is_genre_highlight', { ascending: false })
        .order('imdb_rating', { ascending: false, nullsFirst: false })
  }

  // Pagination
  const from = pageParam * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching cards:', error)
    throw new Error(error.message)
  }

  const totalCount = count || 0
  const hasMore = from + PAGE_SIZE < totalCount

  return {
    cards: (data || []) as AvailabilityCard[],
    nextPage: hasMore ? pageParam + 1 : null,
    totalCount,
  }
}

/**
 * Hook for fetching filtered availability cards with infinite scroll
 */
export function useFilteredCards(filters: FilterState) {
  return useInfiniteQuery({
    queryKey: ['filtered-cards', filters],
    queryFn: ({ pageParam }) => fetchFilteredCards({ filters, pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Get all cards from paginated results
 */
export function flattenPaginatedCards(
  pages: FetchCardsResult[] | undefined
): AvailabilityCard[] {
  if (!pages) return []
  return pages.flatMap((page) => page.cards)
}

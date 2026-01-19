/**
 * Browse Data - Supabase Fetcher
 *
 * Fetches AvailabilityCards from Supabase with filtering,
 * sorting, and pagination support for the browse page.
 */

import { supabase } from './supabase'
import type { AvailabilityCard } from '@/types'
import {
  DECADE_OPTIONS,
  RUNTIME_OPTIONS,
  type FilterState,
} from '@/components/FilterBar'

const PAGE_SIZE = 24

/**
 * Fetch browse cards from Supabase with filters and pagination
 */
// Columns needed for browse grid display (minimal set for performance)
const BROWSE_COLUMNS = `
  id,
  title,
  year,
  poster_url,
  imdb_rating,
  runtime_minutes,
  sources,
  genres,
  featured,
  mpaa_rating,
  is_genre_highlight
`.replace(/\s+/g, '')

export async function fetchBrowseCards(
  filters: FilterState,
  page: number = 0
): Promise<{
  cards: AvailabilityCard[]
  nextPage: number | null
  totalCount: number
}> {
  // Start building the query - only select needed columns
  let query = supabase
    .from('availability_cards')
    .select(BROWSE_COLUMNS, { count: 'exact' })

  // Genre filter - check if genre is in the genres array (case-insensitive)
  if (filters.genre) {
    // Use ilike with array contains for case-insensitive search
    query = query.or(`genres.cs.{${filters.genre}},genres.cs.{${capitalize(filters.genre)}}`)
  }

  // Decade filter - filter by year range
  if (filters.decade) {
    const decade = DECADE_OPTIONS.find((d) => d.value === filters.decade)
    if (decade) {
      query = query.gte('year', decade.min).lte('year', decade.max)
    }
  }

  // Service filter - filter by streaming service in sources array
  // Note: This is tricky with JSONB arrays, we'll handle it client-side for now
  // unless we add a dedicated column or use a more complex query

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
      // Default: featured first, then by rating
      query = query
        .order('featured', { ascending: false })
        .order('imdb_rating', { ascending: false, nullsFirst: false })
  }

  // Pagination
  const from = page * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  query = query.range(from, to)

  // Execute query
  const { data, error, count } = await query

  if (error) {
    console.error('Error fetching browse cards:', error)
    throw new Error('Failed to fetch browse cards')
  }

  let cards = (data || []) as unknown as AvailabilityCard[]

  // Client-side service filter (for JSONB array of sources)
  if (filters.service) {
    const serviceSearch = filters.service.toLowerCase()
    cards = cards.filter((card) =>
      card.sources?.some((s) =>
        s.service?.toLowerCase().includes(serviceSearch)
      )
    )
  }

  const totalCount = count || 0
  const hasMore = from + cards.length < totalCount

  return {
    cards,
    totalCount,
    nextPage: hasMore ? page + 1 : null,
  }
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Get a single card by ID
 */
export async function getCardById(id: string): Promise<AvailabilityCard | null> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching card:', error)
    return null
  }

  return data as AvailabilityCard
}

/**
 * Get a single card by IMDB ID
 */
export async function getCardByImdbId(imdbId: string): Promise<AvailabilityCard | null> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .eq('imdb_id', imdbId)
    .single()

  if (error) {
    console.error('Error fetching card by IMDB ID:', error)
    return null
  }

  return data as AvailabilityCard
}

/**
 * Search cards by title
 */
export async function searchCards(
  searchTerm: string,
  limit: number = 10
): Promise<AvailabilityCard[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select(BROWSE_COLUMNS)
    .ilike('title', `%${searchTerm}%`)
    .order('imdb_rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error searching cards:', error)
    return []
  }

  return (data || []) as unknown as AvailabilityCard[]
}

/**
 * Get featured cards
 */
export async function getFeaturedCards(limit: number = 10): Promise<AvailabilityCard[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select(BROWSE_COLUMNS)
    .eq('featured', true)
    .order('imdb_rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured cards:', error)
    return []
  }

  return (data || []) as unknown as AvailabilityCard[]
}

/**
 * Get cards by genre
 */
export async function getCardsByGenre(
  genre: string,
  limit: number = 20
): Promise<AvailabilityCard[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select(BROWSE_COLUMNS)
    .or(`genres.cs.{${genre}},genres.cs.{${capitalize(genre)}}`)
    .order('imdb_rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching cards by genre:', error)
    return []
  }

  return (data || []) as unknown as AvailabilityCard[]
}

/**
 * Get recently added cards
 */
export async function getRecentlyAddedCards(limit: number = 20): Promise<AvailabilityCard[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select(BROWSE_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recently added cards:', error)
    return []
  }

  return (data || []) as unknown as AvailabilityCard[]
}

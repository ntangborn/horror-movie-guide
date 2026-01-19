import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { DECADE_OPTIONS, RUNTIME_OPTIONS } from '@/components/FilterBar'
import type { AvailabilityCard } from '@/types'

const PAGE_SIZE = 24

// Cache configuration
const CACHE_MAX_AGE = 60 // 1 minute
const STALE_WHILE_REVALIDATE = 300 // 5 minutes

/**
 * GET /api/browse
 * Cached API endpoint for browse page data
 *
 * Query params:
 * - genre: filter by genre
 * - decade: filter by decade
 * - service: filter by streaming service
 * - runtime: filter by runtime
 * - sort: sort order
 * - page: page number (0-indexed)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const genre = searchParams.get('genre')
    const decade = searchParams.get('decade')
    const service = searchParams.get('service')
    const runtime = searchParams.get('runtime')
    const sort = searchParams.get('sort')
    const page = parseInt(searchParams.get('page') || '0', 10)

    // Build query - only select needed columns for performance
    let query = supabase
      .from('availability_cards')
      .select(
        'id, title, year, poster_url, imdb_rating, runtime_minutes, sources, genres, featured, mpaa_rating',
        { count: 'exact' }
      )

    // Genre filter
    if (genre) {
      const genreCapitalized = genre.charAt(0).toUpperCase() + genre.slice(1).toLowerCase()
      query = query.or(`genres.cs.{${genre}},genres.cs.{${genreCapitalized}}`)
    }

    // Decade filter
    if (decade) {
      const decadeOption = DECADE_OPTIONS.find((d) => d.value === decade)
      if (decadeOption) {
        query = query.gte('year', decadeOption.min).lte('year', decadeOption.max)
      }
    }

    // Runtime filter
    if (runtime) {
      const runtimeOption = RUNTIME_OPTIONS.find((r) => r.value === runtime)
      if (runtimeOption) {
        if (runtimeOption.min !== undefined) {
          query = query.gte('runtime_minutes', runtimeOption.min)
        }
        if (runtimeOption.max !== undefined) {
          query = query.lte('runtime_minutes', runtimeOption.max)
        }
      }
    }

    // Sorting
    switch (sort) {
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
        query = query
          .order('featured', { ascending: false })
          .order('imdb_rating', { ascending: false, nullsFirst: false })
    }

    // Pagination
    const from = page * PAGE_SIZE
    const to = from + PAGE_SIZE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Browse API error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      )
    }

    let cards = (data || []) as Partial<AvailabilityCard>[]

    // Client-side service filter (for JSONB array)
    if (service) {
      const serviceSearch = service.toLowerCase()
      cards = cards.filter((card) =>
        card.sources?.some((s) =>
          s.service?.toLowerCase().includes(serviceSearch)
        )
      )
    }

    const totalCount = count || 0
    const hasMore = from + cards.length < totalCount

    const response = NextResponse.json({
      cards,
      totalCount,
      nextPage: hasMore ? page + 1 : null,
      page,
    })

    // Add cache headers
    response.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_MAX_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
    )

    return response
  } catch (error) {
    console.error('Browse API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

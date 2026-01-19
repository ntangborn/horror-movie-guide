/**
 * Watchmode API Client
 *
 * ⚠️  IMPORTANT: We have a LIMITED budget of 1000 API credits!
 *
 * Credit costs per endpoint:
 * - /list-titles/: 1 credit per call
 * - /title/{id}/details/: 1 credit per call
 * - /title/{id}/sources/: 1 credit per call
 * - /search/: 1 credit per call
 *
 * CACHING STRATEGY:
 * - Cache all responses in Supabase for at least 24 hours
 * - Use stale-while-revalidate pattern
 * - Batch requests where possible
 * - Check database before making API calls
 * - Consider caching in Redis/Vercel KV for hot paths
 */

import type { StreamingSource, AvailabilityCard } from '@/types'

const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY
const WATCHMODE_BASE_URL = 'https://api.watchmode.com/v1'

// ============================================
// GENRE ID CONSTANTS
// ============================================

/**
 * Watchmode genre IDs for horror-adjacent content
 * Full list: https://api.watchmode.com/v1/genres/
 */
export const GENRE_IDS = {
  HORROR: 13,
  SCIENCE_FICTION: 18,
  THRILLER: 21,
  FANTASY: 14,
  MYSTERY: 16,
  ACTION: 1,
  DRAMA: 8,
  COMEDY: 4,
} as const

/**
 * Our primary genres of interest
 */
export const PRIMARY_GENRES = [
  GENRE_IDS.HORROR,
  GENRE_IDS.THRILLER,
  GENRE_IDS.SCIENCE_FICTION,
] as const

// ============================================
// WATCHMODE API TYPES
// ============================================

/**
 * Raw source object from Watchmode API
 */
export interface WatchmodeSource {
  source_id: number
  name: string
  type: 'sub' | 'free' | 'rent' | 'buy' | 'addon'
  region: string
  ios_url?: string
  android_url?: string
  web_url?: string
  format: string
  price?: number
  seasons?: number
  episodes?: number
}

/**
 * Raw title object from Watchmode list-titles endpoint
 */
export interface WatchmodeListTitle {
  id: number
  title: string
  year: number
  imdb_id: string
  tmdb_id: number
  tmdb_type: 'movie' | 'tv'
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'short_film'
}

/**
 * Raw title details from Watchmode details endpoint
 */
export interface WatchmodeTitleDetails {
  id: number
  title: string
  original_title?: string
  plot_overview?: string
  type: 'movie' | 'tv_series' | 'tv_miniseries' | 'short_film'
  runtime_minutes?: number
  year: number
  end_year?: number
  release_date?: string
  imdb_id?: string
  tmdb_id?: number
  tmdb_type?: 'movie' | 'tv'
  genres?: number[]
  genre_names?: string[]
  user_rating?: number
  critic_score?: number
  us_rating?: string
  poster?: string
  backdrop?: string
  original_language?: string
  similar_titles?: number[]
  networks?: Array<{ id: number; name: string; origin_country: string }>
  network_names?: string[]
  trailer?: string
  trailer_thumbnail?: string
  relevance_percentile?: number
  sources?: WatchmodeSource[]
}

/**
 * Search options for list-titles endpoint
 */
export interface SearchOptions {
  /** Genre IDs to filter by (comma-separated) */
  genres?: number[]
  /** Content types: movie, tv_series, tv_miniseries, short_film */
  types?: ('movie' | 'tv_series' | 'tv_miniseries' | 'short_film')[]
  /** Source types: sub, free, rent, buy, addon */
  sourceTypes?: ('sub' | 'free' | 'rent' | 'buy' | 'addon')[]
  /** Specific source IDs (e.g., Netflix = 203, Shudder = 251) */
  sourceIds?: number[]
  /** Region code (default: US) */
  region?: string
  /** Page number (default: 1) */
  page?: number
  /** Results per page (max: 250) */
  limit?: number
  /** Sort by: relevance_desc, popularity_desc, release_date_desc, etc. */
  sortBy?: string
}

/**
 * Paginated search results
 */
export interface SearchResults {
  titles: Partial<AvailabilityCard>[]
  page: number
  totalResults: number
  totalPages: number
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Maps Watchmode source type to our StreamingSource type
 */
function mapSourceType(type: string): 'subscription' | 'free' | 'rent' | 'buy' {
  switch (type) {
    case 'sub':
    case 'addon':
      return 'subscription'
    case 'free':
      return 'free'
    case 'rent':
      return 'rent'
    case 'buy':
      return 'buy'
    default:
      return 'subscription'
  }
}

/**
 * Maps Watchmode title type to our type
 */
function mapTitleType(type: string): 'movie' | 'series' {
  return type === 'movie' || type === 'short_film' ? 'movie' : 'series'
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Get streaming sources for a title by Watchmode ID
 *
 * ⚠️  COSTS 1 CREDIT - Cache aggressively!
 *
 * @param watchmodeId - The Watchmode title ID
 * @returns Array of streaming sources mapped to our StreamingSource type
 *
 * @example
 * ```ts
 * // Check cache first!
 * const cached = await getCachedSources(watchmodeId)
 * if (cached && !isStale(cached)) return cached
 *
 * const sources = await getStreamingSources(1234567)
 * await cacheSources(watchmodeId, sources)
 * ```
 */
export async function getStreamingSources(watchmodeId: number): Promise<StreamingSource[]> {
  if (!WATCHMODE_API_KEY) {
    console.error('WATCHMODE_API_KEY is not configured')
    return []
  }

  try {
    const url = `${WATCHMODE_BASE_URL}/title/${watchmodeId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=US`
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Watchmode API error: ${response.status} ${response.statusText}`)
      return []
    }

    const sources: WatchmodeSource[] = await response.json()
    const now = new Date().toISOString()

    return sources.map((source) => ({
      service: source.name,
      service_id: source.source_id.toString(),
      type: mapSourceType(source.type),
      deep_link: source.web_url || source.ios_url || source.android_url || '',
      price: source.price,
      quality: source.format,
      region: source.region,
      last_verified: now,
    }))
  } catch (error) {
    console.error('Failed to fetch streaming sources:', error)
    return []
  }
}

/**
 * Search for titles with filtering options
 *
 * ⚠️  COSTS 1 CREDIT - Cache aggressively!
 *
 * @param options - Search and filter options
 * @returns Paginated results with partial AvailabilityCard data
 *
 * @example
 * ```ts
 * // Get horror movies on subscription services
 * const results = await searchTitles({
 *   genres: [GENRE_IDS.HORROR],
 *   types: ['movie'],
 *   sourceTypes: ['sub', 'free'],
 *   limit: 50,
 * })
 * ```
 */
export async function searchTitles(options: SearchOptions = {}): Promise<SearchResults> {
  const emptyResults: SearchResults = {
    titles: [],
    page: options.page || 1,
    totalResults: 0,
    totalPages: 0,
  }

  if (!WATCHMODE_API_KEY) {
    console.error('WATCHMODE_API_KEY is not configured')
    return emptyResults
  }

  try {
    const params = new URLSearchParams({
      apiKey: WATCHMODE_API_KEY,
      regions: options.region || 'US',
    })

    if (options.genres?.length) {
      params.set('genres', options.genres.join(','))
    }
    if (options.types?.length) {
      params.set('types', options.types.join(','))
    }
    if (options.sourceTypes?.length) {
      params.set('source_types', options.sourceTypes.join(','))
    }
    if (options.sourceIds?.length) {
      params.set('source_ids', options.sourceIds.join(','))
    }
    if (options.page) {
      params.set('page', options.page.toString())
    }
    if (options.limit) {
      params.set('limit', Math.min(options.limit, 250).toString())
    }
    if (options.sortBy) {
      params.set('sort_by', options.sortBy)
    }

    const url = `${WATCHMODE_BASE_URL}/list-titles/?${params.toString()}`
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Watchmode API error: ${response.status} ${response.statusText}`)
      return emptyResults
    }

    const data = await response.json()

    // list-titles returns { titles: [...], page, total_results, total_pages }
    const titles: WatchmodeListTitle[] = data.titles || []
    const limit = options.limit || 250

    return {
      titles: titles.map((title) => ({
        watchmode_id: title.id.toString(),
        imdb_id: title.imdb_id,
        tmdb_id: title.tmdb_id?.toString() || '',
        title: title.title,
        year: title.year,
        type: mapTitleType(title.type),
      })),
      page: data.page || 1,
      totalResults: data.total_results || 0,
      totalPages: Math.ceil((data.total_results || 0) / limit),
    }
  } catch (error) {
    console.error('Failed to search titles:', error)
    return emptyResults
  }
}

/**
 * Get full title details by Watchmode ID
 *
 * ⚠️  COSTS 1 CREDIT - Cache aggressively!
 *
 * @param watchmodeId - The Watchmode title ID
 * @param appendSources - Also fetch sources in same request (saves 1 credit vs separate call)
 * @returns Full title details or null on error
 *
 * @example
 * ```ts
 * // Always check cache first!
 * const cached = await getCachedTitle(watchmodeId)
 * if (cached && !isStale(cached)) return cached
 *
 * // append_to_response=sources gets sources in same API call (saves credits!)
 * const details = await getTitleDetails(1234567, true)
 * await cacheTitle(details)
 * ```
 */
export async function getTitleDetails(
  watchmodeId: number,
  appendSources: boolean = false
): Promise<Partial<AvailabilityCard> | null> {
  if (!WATCHMODE_API_KEY) {
    console.error('WATCHMODE_API_KEY is not configured')
    return null
  }

  try {
    let url = `${WATCHMODE_BASE_URL}/title/${watchmodeId}/details/?apiKey=${WATCHMODE_API_KEY}`

    if (appendSources) {
      url += '&append_to_response=sources'
    }

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`Watchmode API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: WatchmodeTitleDetails = await response.json()
    const now = new Date().toISOString()

    // Map sources if included
    let sources: StreamingSource[] = []
    if (data.sources) {
      sources = data.sources.map((source) => ({
        service: source.name,
        service_id: source.source_id.toString(),
        type: mapSourceType(source.type),
        deep_link: source.web_url || source.ios_url || source.android_url || '',
        price: source.price,
        quality: source.format,
        region: source.region,
        last_verified: now,
      }))
    }

    return {
      watchmode_id: data.id.toString(),
      imdb_id: data.imdb_id || '',
      tmdb_id: data.tmdb_id?.toString() || '',
      title: data.title,
      year: data.year,
      type: mapTitleType(data.type),
      genres: data.genre_names || [],
      synopsis: data.plot_overview || '',
      runtime_minutes: data.runtime_minutes || 0,
      mpaa_rating: data.us_rating || '',
      poster_url: data.poster || '',
      backdrop_url: data.backdrop || '',
      imdb_rating: data.user_rating || 0,
      rt_score: data.critic_score || 0,
      sources,
      availability_checked_at: now,
    }
  } catch (error) {
    console.error('Failed to fetch title details:', error)
    return null
  }
}

/**
 * Popular streaming service IDs for reference
 * Use with sourceIds option in searchTitles
 */
export const STREAMING_SERVICE_IDS = {
  NETFLIX: 203,
  AMAZON_PRIME: 26,
  HULU: 157,
  DISNEY_PLUS: 372,
  HBO_MAX: 387,
  PEACOCK: 389,
  PARAMOUNT_PLUS: 444,
  APPLE_TV_PLUS: 371,
  SHUDDER: 251,
  TUBI: 73,
  PLUTO_TV: 300,
  AMC_PLUS: 474,
  CRACKLE: 67,
  FREEVEE: 613,
} as const

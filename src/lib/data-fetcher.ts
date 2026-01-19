/**
 * Data Orchestration Module
 *
 * Coordinates data fetching between OMDB, Watchmode, and Supabase.
 * Implements caching, rate limiting, and credit tracking.
 *
 * ⚠️  API CREDIT BUDGET:
 * - OMDB: 1000 requests/day (free tier)
 * - Watchmode: 1000 credits total (!!)
 *
 * Always check Supabase cache before making external API calls!
 */

import { supabase } from './supabase'
import { getMovieByImdbId } from './omdb'
import { getTitleDetails, getStreamingSources, GENRE_IDS } from './watchmode'
import type { AvailabilityCard, StreamingSource } from '@/types'

// ============================================
// CREDIT TRACKING
// ============================================

interface CreditUsage {
  omdb: number
  watchmode: number
  session_start: string
}

const creditUsage: CreditUsage = {
  omdb: 0,
  watchmode: 0,
  session_start: new Date().toISOString(),
}

/**
 * Log and track API credit usage
 */
function trackCredit(api: 'omdb' | 'watchmode', operation: string): void {
  creditUsage[api]++
  console.log(
    `[CREDIT] ${api.toUpperCase()} +1 (${operation}) | ` +
      `Session total: OMDB=${creditUsage.omdb}, Watchmode=${creditUsage.watchmode}`
  )
}

/**
 * Get current credit usage stats
 */
export function getCreditUsage(): CreditUsage {
  return { ...creditUsage }
}

/**
 * Reset credit tracking (call at start of new session/day)
 */
export function resetCreditTracking(): void {
  creditUsage.omdb = 0
  creditUsage.watchmode = 0
  creditUsage.session_start = new Date().toISOString()
  console.log('[CREDIT] Credit tracking reset')
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Check if availability data is stale (older than specified hours)
 */
function isStale(checkedAt: string | null, hours: number = 24): boolean {
  if (!checkedAt) return true
  const checkedDate = new Date(checkedAt)
  const staleThreshold = new Date(Date.now() - hours * 60 * 60 * 1000)
  return checkedDate < staleThreshold
}

/**
 * Map OMDB genres to our genre detection
 */
function detectGenreHighlight(genres: string[]): boolean {
  const horrorKeywords = ['horror', 'thriller', 'sci-fi', 'science fiction']
  return genres.some((g) =>
    horrorKeywords.some((keyword) => g.toLowerCase().includes(keyword))
  )
}

/**
 * Parse genre string from OMDB into array
 */
function parseGenres(genreString: string): string[] {
  return genreString
    .split(',')
    .map((g) => g.trim())
    .filter(Boolean)
}

// ============================================
// SUPABASE CACHE FUNCTIONS
// ============================================

/**
 * Get card from Supabase by IMDB ID
 */
async function getCachedCard(imdbId: string): Promise<AvailabilityCard | null> {
  console.log(`[CACHE] Checking Supabase for imdb_id: ${imdbId}`)

  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .eq('imdb_id', imdbId)
    .single()

  if (error) {
    if (error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[CACHE] Supabase query error:', error.message)
    }
    return null
  }

  console.log(`[CACHE] Found cached card: "${data.title}" (${data.year})`)
  return data as AvailabilityCard
}

/**
 * Get card from Supabase by card ID
 */
async function getCardById(cardId: string): Promise<AvailabilityCard | null> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .eq('id', cardId)
    .single()

  if (error) {
    console.error('[CACHE] Failed to fetch card by ID:', error.message)
    return null
  }

  return data as AvailabilityCard
}

/**
 * Save card to Supabase
 */
async function saveCard(
  card: Omit<AvailabilityCard, 'id' | 'created_at' | 'updated_at'>
): Promise<AvailabilityCard | null> {
  console.log(`[CACHE] Saving card to Supabase: "${card.title}" (${card.year})`)

  const { data, error } = await supabase
    .from('availability_cards')
    .insert(card)
    .select()
    .single()

  if (error) {
    console.error('[CACHE] Failed to save card:', error.message)
    return null
  }

  console.log(`[CACHE] Card saved with ID: ${data.id}`)
  return data as AvailabilityCard
}

/**
 * Update card in Supabase
 */
async function updateCard(
  cardId: string,
  updates: Partial<AvailabilityCard>
): Promise<AvailabilityCard | null> {
  console.log(`[CACHE] Updating card: ${cardId}`)

  const { data, error } = await supabase
    .from('availability_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single()

  if (error) {
    console.error('[CACHE] Failed to update card:', error.message)
    return null
  }

  console.log(`[CACHE] Card updated: "${data.title}"`)
  return data as AvailabilityCard
}

// ============================================
// WATCHMODE SEARCH BY IMDB
// ============================================

/**
 * Search Watchmode for a title by IMDB ID
 * Uses the search endpoint to find the Watchmode ID
 *
 * ⚠️  COSTS 1 WATCHMODE CREDIT
 */
async function findWatchmodeId(imdbId: string): Promise<number | null> {
  const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY

  if (!WATCHMODE_API_KEY) {
    console.error('[WATCHMODE] API key not configured')
    return null
  }

  try {
    // Watchmode has a direct IMDB lookup endpoint
    const url = `https://api.watchmode.com/v1/search/?apiKey=${WATCHMODE_API_KEY}&search_field=imdb_id&search_value=${imdbId}`

    trackCredit('watchmode', `search by IMDB: ${imdbId}`)

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`[WATCHMODE] Search error: ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.title_results && data.title_results.length > 0) {
      const watchmodeId = data.title_results[0].id
      console.log(`[WATCHMODE] Found Watchmode ID: ${watchmodeId} for IMDB: ${imdbId}`)
      return watchmodeId
    }

    console.log(`[WATCHMODE] No results for IMDB: ${imdbId}`)
    return null
  } catch (error) {
    console.error('[WATCHMODE] Search failed:', error)
    return null
  }
}

// ============================================
// MAIN ORCHESTRATION FUNCTIONS
// ============================================

export interface EnrichResult {
  success: boolean
  card: AvailabilityCard | null
  imdbId: string
  source: 'cache' | 'api'
  error?: string
}

/**
 * Enrich a card from external APIs by IMDB ID
 *
 * Flow:
 * 1. Check Supabase cache
 * 2. If not cached, fetch from OMDB
 * 3. Find Watchmode ID
 * 4. Fetch streaming sources
 * 5. Combine and save to Supabase
 *
 * @param imdbId - IMDB ID (e.g., "tt0087800")
 * @returns EnrichResult with card data or error
 *
 * @example
 * ```ts
 * const result = await enrichCardFromAPIs('tt0087800')
 * if (result.success) {
 *   console.log(result.card.title) // "A Nightmare on Elm Street"
 *   console.log(result.source) // "api" or "cache"
 * }
 * ```
 */
export async function enrichCardFromAPIs(imdbId: string): Promise<EnrichResult> {
  console.log(`\n[ENRICH] Starting enrichment for IMDB: ${imdbId}`)
  console.log('─'.repeat(50))

  // Step 1: Check cache
  const cached = await getCachedCard(imdbId)
  if (cached) {
    console.log(`[ENRICH] ✓ Returning cached card (saved API credits!)`)
    return {
      success: true,
      card: cached,
      imdbId,
      source: 'cache',
    }
  }

  console.log(`[ENRICH] Cache miss - fetching from APIs...`)

  // Step 2: Fetch from OMDB
  console.log(`[ENRICH] Fetching metadata from OMDB...`)
  trackCredit('omdb', `getMovieByImdbId: ${imdbId}`)

  const omdbData = await getMovieByImdbId(imdbId)
  if (!omdbData) {
    console.error(`[ENRICH] ✗ OMDB returned no data for ${imdbId}`)
    return {
      success: false,
      card: null,
      imdbId,
      source: 'api',
      error: 'OMDB returned no data',
    }
  }

  console.log(`[ENRICH] ✓ OMDB: "${omdbData.title}" (${omdbData.year})`)

  // Step 3: Find Watchmode ID
  console.log(`[ENRICH] Searching Watchmode for title...`)
  await delay(500) // Rate limiting

  const watchmodeId = await findWatchmodeId(imdbId)
  let sources: StreamingSource[] = []
  let watchmodeData: Partial<AvailabilityCard> | null = null

  // Step 4: Fetch streaming sources if Watchmode ID found
  if (watchmodeId) {
    console.log(`[ENRICH] Fetching details and sources from Watchmode...`)
    await delay(500) // Rate limiting

    trackCredit('watchmode', `getTitleDetails: ${watchmodeId}`)
    watchmodeData = await getTitleDetails(watchmodeId, true) // append sources

    if (watchmodeData?.sources) {
      sources = watchmodeData.sources
      console.log(`[ENRICH] ✓ Found ${sources.length} streaming sources`)
    }
  } else {
    console.log(`[ENRICH] ⚠ No Watchmode ID found - streaming data unavailable`)
  }

  // Step 5: Combine data into AvailabilityCard
  const genres = parseGenres(omdbData.genre)

  const cardData: Omit<AvailabilityCard, 'id' | 'created_at' | 'updated_at'> = {
    imdb_id: imdbId,
    tmdb_id: watchmodeData?.tmdb_id || '',
    watchmode_id: watchmodeId?.toString() || '',
    title: omdbData.title,
    year: omdbData.year,
    type: omdbData.type === 'series' ? 'series' : 'movie',
    genres,
    subgenres: [],
    is_genre_highlight: detectGenreHighlight(genres),
    sources,
    poster_url: omdbData.poster || watchmodeData?.poster_url || '',
    backdrop_url: watchmodeData?.backdrop_url || '',
    synopsis: omdbData.plot || watchmodeData?.synopsis || '',
    runtime_minutes: omdbData.runtime || watchmodeData?.runtime_minutes || 0,
    mpaa_rating: omdbData.rated || watchmodeData?.mpaa_rating || '',
    director: omdbData.director || '',
    country: omdbData.country || '',
    imdb_rating: omdbData.imdbRating || 0,
    rt_score: watchmodeData?.rt_score || 0,
    letterboxd_rating: 0,
    editorial_tags: [],
    featured: false,
    availability_checked_at: new Date().toISOString(),
  }

  // Step 6: Save to Supabase
  const savedCard = await saveCard(cardData)

  if (!savedCard) {
    console.error(`[ENRICH] ✗ Failed to save card to Supabase`)
    return {
      success: false,
      card: null,
      imdbId,
      source: 'api',
      error: 'Failed to save to database',
    }
  }

  console.log(`[ENRICH] ✓ Complete! Card saved with ID: ${savedCard.id}`)
  console.log('─'.repeat(50))

  return {
    success: true,
    card: savedCard,
    imdbId,
    source: 'api',
  }
}

export interface BatchResult {
  total: number
  successful: number
  failed: number
  cached: number
  results: EnrichResult[]
  creditUsage: CreditUsage
}

/**
 * Batch enrich multiple cards with rate limiting
 *
 * ⚠️  Use sparingly! Each non-cached card costs:
 * - 1 OMDB credit
 * - 1-2 Watchmode credits (search + details)
 *
 * @param imdbIds - Array of IMDB IDs to process
 * @param delayMs - Delay between API calls (default: 500ms)
 * @returns BatchResult with success/failure stats
 *
 * @example
 * ```ts
 * const result = await batchEnrichCards([
 *   'tt0087800', // Nightmare on Elm Street
 *   'tt0077651', // Halloween
 *   'tt0081505', // The Shining
 * ])
 * console.log(`Processed: ${result.successful}/${result.total}`)
 * console.log(`Credits used: Watchmode=${result.creditUsage.watchmode}`)
 * ```
 */
export async function batchEnrichCards(
  imdbIds: string[],
  delayMs: number = 500
): Promise<BatchResult> {
  console.log(`\n${'═'.repeat(60)}`)
  console.log(`[BATCH] Starting batch enrichment for ${imdbIds.length} titles`)
  console.log(`${'═'.repeat(60)}\n`)

  const startCredits = { ...creditUsage }
  const results: EnrichResult[] = []
  let cached = 0
  let successful = 0
  let failed = 0

  for (let i = 0; i < imdbIds.length; i++) {
    const imdbId = imdbIds[i]
    console.log(`[BATCH] Processing ${i + 1}/${imdbIds.length}: ${imdbId}`)

    try {
      const result = await enrichCardFromAPIs(imdbId)
      results.push(result)

      if (result.success) {
        successful++
        if (result.source === 'cache') {
          cached++
        }
      } else {
        failed++
      }

      // Rate limiting between API calls (skip for cached items)
      if (result.source === 'api' && i < imdbIds.length - 1) {
        console.log(`[BATCH] Waiting ${delayMs}ms before next request...`)
        await delay(delayMs)
      }
    } catch (error) {
      console.error(`[BATCH] Error processing ${imdbId}:`, error)
      failed++
      results.push({
        success: false,
        card: null,
        imdbId,
        source: 'api',
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  const endCredits = { ...creditUsage }
  const sessionCredits: CreditUsage = {
    omdb: endCredits.omdb - startCredits.omdb,
    watchmode: endCredits.watchmode - startCredits.watchmode,
    session_start: startCredits.session_start,
  }

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`[BATCH] Complete!`)
  console.log(`  Total: ${imdbIds.length}`)
  console.log(`  Successful: ${successful} (${cached} from cache)`)
  console.log(`  Failed: ${failed}`)
  console.log(`  Credits used: OMDB=${sessionCredits.omdb}, Watchmode=${sessionCredits.watchmode}`)
  console.log(`${'═'.repeat(60)}\n`)

  return {
    total: imdbIds.length,
    successful,
    failed,
    cached,
    results,
    creditUsage: sessionCredits,
  }
}

/**
 * Check and update streaming availability for a card
 *
 * Only call this when availability is stale (>24 hours old).
 * Consider batching updates during off-peak times.
 *
 * ⚠️  COSTS 1 WATCHMODE CREDIT per call
 *
 * @param cardId - The Supabase card ID
 * @param forceUpdate - Update even if not stale (default: false)
 * @returns Updated card or null on error
 *
 * @example
 * ```ts
 * const card = await getCardById(cardId)
 * if (isStale(card.availability_checked_at, 24)) {
 *   const updated = await checkAndUpdateAvailability(cardId)
 * }
 * ```
 */
export async function checkAndUpdateAvailability(
  cardId: string,
  forceUpdate: boolean = false
): Promise<AvailabilityCard | null> {
  console.log(`\n[AVAILABILITY] Checking availability for card: ${cardId}`)

  // Get current card
  const card = await getCardById(cardId)
  if (!card) {
    console.error(`[AVAILABILITY] ✗ Card not found: ${cardId}`)
    return null
  }

  console.log(`[AVAILABILITY] Card: "${card.title}" (${card.year})`)

  // Check if update is needed
  if (!forceUpdate && !isStale(card.availability_checked_at, 24)) {
    console.log(`[AVAILABILITY] ✓ Availability is fresh (checked < 24h ago)`)
    return card
  }

  // Need Watchmode ID to fetch sources
  if (!card.watchmode_id) {
    console.log(`[AVAILABILITY] ⚠ No Watchmode ID - attempting to find...`)

    const watchmodeId = await findWatchmodeId(card.imdb_id)
    if (!watchmodeId) {
      console.error(`[AVAILABILITY] ✗ Could not find Watchmode ID`)
      return card
    }

    // Update card with Watchmode ID
    card.watchmode_id = watchmodeId.toString()
    await delay(500)
  }

  // Fetch fresh sources
  console.log(`[AVAILABILITY] Fetching fresh sources from Watchmode...`)
  trackCredit('watchmode', `getStreamingSources: ${card.watchmode_id}`)

  const sources = await getStreamingSources(parseInt(card.watchmode_id, 10))

  console.log(`[AVAILABILITY] ✓ Found ${sources.length} sources`)

  // Update card in Supabase
  const updated = await updateCard(cardId, {
    watchmode_id: card.watchmode_id,
    sources,
    availability_checked_at: new Date().toISOString(),
  })

  if (updated) {
    console.log(`[AVAILABILITY] ✓ Card updated successfully`)
  }

  return updated
}

/**
 * Check if a card's availability data is stale
 * Exported for use in components/routes
 */
export { isStale }

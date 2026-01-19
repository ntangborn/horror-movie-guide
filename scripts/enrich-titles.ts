/**
 * Enrichment Script: Fetch metadata and streaming sources for titles
 *
 * This script enriches titles in the database with:
 * - Poster images and metadata from OMDB (free, 1000 calls/day)
 * - Streaming sources from Watchmode (limited credits!)
 *
 * Usage:
 *   npm run enrich                    # Enrich up to 100 titles
 *   npm run enrich -- --limit 50      # Enrich up to 50 titles
 *   npm run enrich -- --dry-run       # Preview what would be enriched
 *   npm run enrich -- --omdb-only     # Only fetch OMDB data (no Watchmode credits)
 *   npm run enrich -- --in-lists      # Only enrich titles in published curated lists
 *
 * Examples:
 *   npm run enrich -- --in-lists --limit 200   # Enrich all titles in lists (up to 200)
 *   npm run enrich -- --in-lists --omdb-only   # Get posters for list titles only
 *   npm run enrich -- --in-lists --dry-run     # Preview what list titles need enrichment
 *
 * Credit Budget (1000 Watchmode credits):
 * - Each search by IMDB ID: 1 credit
 * - Each source fetch: 1 credit (but we use append_to_response to combine)
 * - Recommended: Enrich 400 titles = ~400-800 credits
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const DEFAULT_LIMIT = 100
const WATCHMODE_DELAY_MS = 500 // Rate limit: 500ms between calls
const OMDB_DELAY_MS = 100 // Small delay for OMDB

// API Keys
const OMDB_API_KEY = process.env.OMDB_API_KEY
const WATCHMODE_API_KEY = process.env.WATCHMODE_API_KEY

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse command line arguments
interface Args {
  limit: number
  dryRun: boolean
  omdbOnly: boolean
  inLists: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    limit: DEFAULT_LIMIT,
    dryRun: false,
    omdbOnly: false,
    inLists: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    } else if (args[i] === '--omdb-only') {
      result.omdbOnly = true
    } else if (args[i] === '--in-lists') {
      result.inLists = true
    }
  }

  return result
}

// Types
interface TitleToEnrich {
  id: string
  imdb_id: string
  title: string
  year: number
  featured: boolean
  poster_url: string | null
  sources: object[] | null
  watchmode_id: string | null
}

interface EnrichmentStats {
  totalProcessed: number
  omdbSuccess: number
  omdbFailed: number
  watchmodeSearches: number
  watchmodeFound: number
  watchmodeNotFound: number
  watchmodeErrors: number
  databaseUpdates: number
  databaseErrors: number
  creditsUsed: number
}

interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Runtime: string
  Genre: string
  Director: string
  Plot: string
  Poster: string
  imdbRating: string
  imdbID: string
  Type: string
  Response: string
  Error?: string
  Country?: string
}

interface WatchmodeSearchResult {
  id: number
  name: string
  type: string
  year: number
  imdb_id: string
  tmdb_id: number
}

interface WatchmodeSource {
  source_id: number
  name: string
  type: 'sub' | 'free' | 'rent' | 'buy' | 'addon'
  region: string
  web_url?: string
  ios_url?: string
  android_url?: string
  format?: string
  price?: number
}

// Utility functions
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

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
 * Fetch title metadata from OMDB by IMDB ID
 */
async function fetchFromOMDB(imdbId: string): Promise<OMDBResponse | null> {
  if (!OMDB_API_KEY) {
    return null
  }

  try {
    const url = `http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}&plot=full`
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data: OMDBResponse = await response.json()

    if (data.Response !== 'True') {
      return null
    }

    return data
  } catch (error) {
    return null
  }
}

/**
 * Search Watchmode for a title by IMDB ID
 * Returns the Watchmode ID if found
 */
async function searchWatchmodeByImdb(imdbId: string): Promise<WatchmodeSearchResult | null> {
  if (!WATCHMODE_API_KEY) {
    return null
  }

  try {
    const url = `https://api.watchmode.com/v1/search/?apiKey=${WATCHMODE_API_KEY}&search_field=imdb_id&search_value=${encodeURIComponent(imdbId)}`
    const response = await fetch(url)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    // Search returns { title_results: [...] }
    if (data.title_results && data.title_results.length > 0) {
      return data.title_results[0]
    }

    return null
  } catch (error) {
    return null
  }
}

/**
 * Get streaming sources from Watchmode by Watchmode ID
 * Uses append_to_response=sources to save credits
 */
async function getWatchmodeSources(watchmodeId: number): Promise<WatchmodeSource[]> {
  if (!WATCHMODE_API_KEY) {
    return []
  }

  try {
    const url = `https://api.watchmode.com/v1/title/${watchmodeId}/sources/?apiKey=${WATCHMODE_API_KEY}&regions=US`
    const response = await fetch(url)

    if (!response.ok) {
      return []
    }

    const sources: WatchmodeSource[] = await response.json()
    return sources
  } catch (error) {
    return []
  }
}

/**
 * Check if a title needs enrichment (missing poster OR missing/empty sources)
 */
function needsEnrichment(title: TitleToEnrich): boolean {
  const needsPoster = !title.poster_url || title.poster_url === ''
  const needsSources = !title.sources || !Array.isArray(title.sources) || title.sources.length === 0
  return needsPoster || needsSources
}

/**
 * Get all card IDs that appear in published curated lists
 */
async function getCardIdsInLists(): Promise<Set<string>> {
  const { data: lists, error } = await supabase
    .from('curated_lists')
    .select('cards')
    .eq('published', true)

  if (error) {
    console.error('Error fetching curated lists:', error.message)
    return new Set()
  }

  const cardIds = new Set<string>()
  for (const list of (lists || [])) {
    const cards = list.cards as string[] | null
    if (cards && Array.isArray(cards)) {
      cards.forEach(id => cardIds.add(id))
    }
  }

  return cardIds
}

/**
 * Query database for titles that need enrichment
 * Prioritizes: Featured > Recent (2020-2026) > Classics
 * Only returns titles that actually need enrichment (missing poster or sources)
 */
async function getTitlesToEnrich(limit: number, inListsOnly: boolean = false): Promise<TitleToEnrich[]> {
  // If --in-lists flag, only get titles that appear in curated lists
  let listCardIds: Set<string> | null = null
  if (inListsOnly) {
    listCardIds = await getCardIdsInLists()
    console.log(`   Found ${listCardIds.size} unique titles in published lists`)

    if (listCardIds.size === 0) {
      return []
    }
  }

  // Helper to check if title should be included
  const shouldInclude = (title: TitleToEnrich): boolean => {
    if (!needsEnrichment(title)) return false
    if (listCardIds && !listCardIds.has(title.id)) return false
    return true
  }

  // Fetch more titles than needed since we'll filter in memory
  const fetchLimit = inListsOnly ? 1000 : limit * 3

  // First, get featured titles
  const { data: featured, error: featuredError } = await supabase
    .from('availability_cards')
    .select('id, imdb_id, title, year, featured, poster_url, sources, watchmode_id')
    .eq('featured', true)
    .limit(fetchLimit)

  if (featuredError) {
    console.error('Error fetching featured titles:', featuredError.message)
  }

  // Filter to only those needing enrichment (and in lists if flag set)
  const featuredNeedingEnrichment = (featured || []).filter(shouldInclude)
  const featuredIds = new Set(featuredNeedingEnrichment.map((t) => t.id))
  const remaining = limit - featuredNeedingEnrichment.length

  if (remaining <= 0) {
    return featuredNeedingEnrichment.slice(0, limit)
  }

  // Next, get recent releases (2020-2026)
  const { data: recent, error: recentError } = await supabase
    .from('availability_cards')
    .select('id, imdb_id, title, year, featured, poster_url, sources, watchmode_id')
    .gte('year', 2020)
    .lte('year', 2026)
    .order('year', { ascending: false })
    .limit(fetchLimit)

  if (recentError) {
    console.error('Error fetching recent titles:', recentError.message)
  }

  const recentFiltered = (recent || [])
    .filter((t) => !featuredIds.has(t.id) && shouldInclude(t))
    .slice(0, remaining)
  const recentIds = new Set(recentFiltered.map((t) => t.id))
  const stillRemaining = remaining - recentFiltered.length

  if (stillRemaining <= 0) {
    return [...featuredNeedingEnrichment.slice(0, limit - recentFiltered.length), ...recentFiltered]
  }

  // Finally, get classics (older titles)
  const { data: classics, error: classicsError } = await supabase
    .from('availability_cards')
    .select('id, imdb_id, title, year, featured, poster_url, sources, watchmode_id')
    .lt('year', 2020)
    .order('year', { ascending: false })
    .limit(fetchLimit)

  if (classicsError) {
    console.error('Error fetching classic titles:', classicsError.message)
  }

  const classicsFiltered = (classics || [])
    .filter((t) => !featuredIds.has(t.id) && !recentIds.has(t.id) && shouldInclude(t))
    .slice(0, stillRemaining)

  return [...featuredNeedingEnrichment, ...recentFiltered, ...classicsFiltered].slice(0, limit)
}

/**
 * Update a title in the database with enriched data
 */
async function updateTitle(
  id: string,
  updates: Record<string, unknown>
): Promise<boolean> {
  const { error } = await supabase
    .from('availability_cards')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    console.error(`Failed to update ${id}:`, error.message)
    return false
  }

  return true
}

/**
 * Main enrichment function
 */
async function enrich(args: Args) {
  console.log('🎬 Horror Movie Guide - Title Enrichment Script')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No API calls or database updates will be made\n')
  }

  if (args.omdbOnly) {
    console.log('\n📽️  OMDB ONLY MODE - Skipping Watchmode API calls\n')
  }

  if (args.inLists) {
    console.log('\n📋 IN-LISTS MODE - Only enriching titles that appear in published curated lists\n')
  }

  // Check API keys
  if (!OMDB_API_KEY) {
    console.error('\n❌ OMDB_API_KEY is not configured')
    process.exit(1)
  }

  if (!args.omdbOnly && !WATCHMODE_API_KEY) {
    console.error('\n❌ WATCHMODE_API_KEY is not configured')
    console.error('Use --omdb-only to skip Watchmode enrichment')
    process.exit(1)
  }

  // Initialize stats
  const stats: EnrichmentStats = {
    totalProcessed: 0,
    omdbSuccess: 0,
    omdbFailed: 0,
    watchmodeSearches: 0,
    watchmodeFound: 0,
    watchmodeNotFound: 0,
    watchmodeErrors: 0,
    databaseUpdates: 0,
    databaseErrors: 0,
    creditsUsed: 0,
  }

  const startTime = Date.now()

  // Get titles to enrich
  console.log(`\n📊 Fetching titles to enrich (limit: ${args.limit})...`)
  const titles = await getTitlesToEnrich(args.limit, args.inLists)

  if (titles.length === 0) {
    console.log('\n✨ No titles need enrichment!')
    return
  }

  console.log(`\n📝 Found ${titles.length} titles to enrich`)
  console.log(`   Featured: ${titles.filter((t) => t.featured).length}`)
  console.log(`   Recent (2020-2026): ${titles.filter((t) => t.year >= 2020).length}`)
  console.log(`   Classics (<2020): ${titles.filter((t) => t.year < 2020).length}`)

  if (args.dryRun) {
    console.log('\n📋 Titles that would be enriched:')
    console.log('-'.repeat(55))
    titles.slice(0, 20).forEach((t, i) => {
      const status = []
      if (!t.poster_url) status.push('no poster')
      if (!t.sources || (Array.isArray(t.sources) && t.sources.length === 0)) status.push('no sources')
      console.log(`${i + 1}. ${t.title} (${t.year}) [${t.imdb_id}] - ${status.join(', ')}`)
    })
    if (titles.length > 20) {
      console.log(`   ... and ${titles.length - 20} more`)
    }

    // Estimate credits
    const needsWatchmode = titles.filter(
      (t) => !t.sources || (Array.isArray(t.sources) && t.sources.length === 0)
    ).length
    console.log(`\n💰 Estimated Watchmode credits: ${needsWatchmode * 2} (${needsWatchmode} searches + ${needsWatchmode} source fetches)`)
    return
  }

  // Process titles
  console.log('\n🚀 Starting enrichment...\n')

  for (let i = 0; i < titles.length; i++) {
    const title = titles[i]
    stats.totalProcessed++

    const updates: Record<string, unknown> = {}
    let enrichedSomething = false

    // Progress indicator
    process.stdout.write(
      `\r  [${i + 1}/${titles.length}] ${title.title.substring(0, 30).padEnd(30)} `
    )

    // Fetch from OMDB if missing poster
    if (!title.poster_url) {
      const omdbData = await fetchFromOMDB(title.imdb_id)
      await sleep(OMDB_DELAY_MS)

      if (omdbData) {
        stats.omdbSuccess++
        enrichedSomething = true

        if (omdbData.Poster && omdbData.Poster !== 'N/A') {
          updates.poster_url = omdbData.Poster
        }
        if (omdbData.Plot && omdbData.Plot !== 'N/A') {
          updates.synopsis = omdbData.Plot
        }
        if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
          updates.imdb_rating = parseFloat(omdbData.imdbRating)
        }
        if (omdbData.Rated && omdbData.Rated !== 'N/A') {
          updates.mpaa_rating = omdbData.Rated
        }
        if (omdbData.Runtime && omdbData.Runtime !== 'N/A') {
          const runtimeMatch = omdbData.Runtime.match(/(\d+)/)
          if (runtimeMatch) {
            updates.runtime_minutes = parseInt(runtimeMatch[1], 10)
          }
        }
        if (omdbData.Director && omdbData.Director !== 'N/A') {
          updates.director = omdbData.Director
        }
        if (omdbData.Country && omdbData.Country !== 'N/A') {
          updates.country = omdbData.Country
        }
        if (omdbData.Genre && omdbData.Genre !== 'N/A') {
          const genres = omdbData.Genre.split(',').map((g) => g.trim().toLowerCase())
          updates.genres = genres
        }
      } else {
        stats.omdbFailed++
      }
    }

    // Fetch from Watchmode if missing sources and not omdb-only mode
    const needsSources = !title.sources || (Array.isArray(title.sources) && title.sources.length === 0)

    if (!args.omdbOnly && needsSources) {
      // Search by IMDB ID
      stats.watchmodeSearches++
      stats.creditsUsed++

      const searchResult = await searchWatchmodeByImdb(title.imdb_id)
      await sleep(WATCHMODE_DELAY_MS)

      if (searchResult) {
        stats.watchmodeFound++
        updates.watchmode_id = searchResult.id.toString()
        if (searchResult.tmdb_id) {
          updates.tmdb_id = searchResult.tmdb_id.toString()
        }

        // Fetch sources
        stats.creditsUsed++
        const sources = await getWatchmodeSources(searchResult.id)
        await sleep(WATCHMODE_DELAY_MS)

        if (sources.length > 0) {
          const now = new Date().toISOString()
          updates.sources = sources.map((s) => ({
            service: s.name,
            service_id: s.source_id.toString(),
            type: mapSourceType(s.type),
            deep_link: s.web_url || s.ios_url || s.android_url || '',
            price: s.price,
            quality: s.format,
            region: s.region,
            last_verified: now,
          }))
          updates.availability_checked_at = now
          enrichedSomething = true
        }
      } else {
        stats.watchmodeNotFound++
      }
    }

    // Update database if we enriched something
    if (enrichedSomething && Object.keys(updates).length > 0) {
      const success = await updateTitle(title.id, updates)
      if (success) {
        stats.databaseUpdates++
      } else {
        stats.databaseErrors++
      }
    }

    // Log every 10 titles
    if ((i + 1) % 10 === 0) {
      console.log(`  ✓ Processed ${i + 1}/${titles.length}, Credits used: ${stats.creditsUsed}`)
    }
  }

  // Final summary
  const elapsed = Date.now() - startTime
  const minutes = Math.floor(elapsed / 60000)
  const seconds = Math.floor((elapsed % 60000) / 1000)

  console.log('\n')
  console.log('='.repeat(55))
  console.log('📊 ENRICHMENT COMPLETE')
  console.log('='.repeat(55))
  console.log(`
  Total processed:       ${stats.totalProcessed}

  OMDB Results:
    ✅ Success:           ${stats.omdbSuccess}
    ❌ Failed/Not found:  ${stats.omdbFailed}

  Watchmode Results:
    🔍 Searches:          ${stats.watchmodeSearches}
    ✅ Found:             ${stats.watchmodeFound}
    ⚠️  Not found:         ${stats.watchmodeNotFound}

  Database:
    ✅ Updated:           ${stats.databaseUpdates}
    ❌ Errors:            ${stats.databaseErrors}

  💰 Watchmode Credits Used: ${stats.creditsUsed}
  💵 Estimated Remaining:    ${1000 - stats.creditsUsed} (assuming 1000 total)

  ⏱️  Time elapsed: ${minutes}m ${seconds}s
`)

  // Save credit usage log
  const logPath = path.resolve(__dirname, '../enrichment-log.json')
  const logEntry = {
    timestamp: new Date().toISOString(),
    stats,
    elapsed,
    args,
  }

  let log: object[] = []
  if (fs.existsSync(logPath)) {
    try {
      log = JSON.parse(fs.readFileSync(logPath, 'utf-8'))
    } catch {
      log = []
    }
  }
  log.push(logEntry)
  fs.writeFileSync(logPath, JSON.stringify(log, null, 2))
  console.log(`📝 Log saved to enrichment-log.json`)
}

// Run
const args = parseArgs()
enrich(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

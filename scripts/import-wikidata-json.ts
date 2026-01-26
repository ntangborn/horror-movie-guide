/**
 * Import Script: Add/Update Horror Films from Wikidata JSON
 *
 * This script reads a JSON file containing horror films from Wikidata
 * and imports new titles or updates existing ones in Supabase.
 *
 * Usage:
 *   npm run import-wikidata                     # Import all new titles
 *   npm run import-wikidata -- --dry-run        # Preview without importing
 *   npm run import-wikidata -- --limit 100      # Import up to 100 titles
 *   npm run import-wikidata -- --update         # Also update existing titles
 *   npm run import-wikidata -- --file path.json # Use custom JSON file
 *
 * Expected JSON format (from Wikidata SPARQL query):
 *   [{ film, filmLabel, imdb, releaseDate, modified }, ...]
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const DEFAULT_JSON_PATH = path.resolve(__dirname, '../uploads/query.json')
const BATCH_SIZE = 100
const LOG_INTERVAL = 100

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse arguments
interface Args {
  dryRun: boolean
  limit: number
  update: boolean
  filePath: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    dryRun: false,
    limit: Infinity,
    update: false,
    filePath: DEFAULT_JSON_PATH,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      result.dryRun = true
    } else if (args[i] === '--update') {
      result.update = true
    } else if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--file' && args[i + 1]) {
      result.filePath = path.resolve(args[i + 1])
      i++
    }
  }

  return result
}

// Types
interface WikidataEntry {
  film: string
  filmLabel: string
  imdb: string
  releaseDate: string
  modified: string
}

interface ProcessedMovie {
  imdb_id: string
  title: string
  year: number
  wikidata_id: string
  wikidata_modified: string
}

interface AvailabilityCard {
  imdb_id: string
  title: string
  year: number
  type: 'movie' | 'series'
  genres: string[]
  subgenres: string[]
  is_genre_highlight: boolean
  sources: object[]
  director: string
  country: string
  runtime_minutes: number | null
  editorial_tags: string[]
  featured: boolean
  poster_url: string
  backdrop_url: string
  synopsis: string
  mpaa_rating: string
  imdb_rating: number | null
  rt_score: number | null
  letterboxd_rating: number | null
  tmdb_id: string
  watchmode_id: string
  wikidata_id?: string
  wikidata_modified?: string
  created_at: string
  updated_at: string
  availability_checked_at: string | null
}

/**
 * Extract Wikidata Q-ID from URL
 */
function extractWikidataId(url: string): string {
  const match = url.match(/Q\d+$/)
  return match ? match[0] : ''
}

/**
 * Normalize IMDB ID format
 */
function normalizeImdbId(imdbId: string): string | null {
  if (!imdbId) return null

  let cleaned = imdbId.trim()

  // Handle full IMDB URLs
  if (cleaned.includes('imdb.com')) {
    const match = cleaned.match(/tt\d+/)
    if (match) {
      cleaned = match[0]
    } else {
      return null
    }
  }

  // Ensure it starts with tt
  if (!cleaned.startsWith('tt')) {
    if (/^\d+$/.test(cleaned)) {
      cleaned = `tt${cleaned.padStart(7, '0')}`
    } else {
      return null
    }
  }

  // Validate format
  if (!/^tt\d{7,}$/.test(cleaned)) {
    return null
  }

  return cleaned
}

/**
 * Extract year from ISO date string
 */
function extractYear(dateStr: string): number | null {
  if (!dateStr) return null

  const match = dateStr.match(/^(\d{4})/)
  if (match) {
    const year = parseInt(match[1], 10)
    if (year >= 1880 && year <= new Date().getFullYear() + 5) {
      return year
    }
  }

  return null
}

/**
 * Process and deduplicate Wikidata entries
 * Takes earliest release year for each IMDB ID
 */
function processEntries(entries: WikidataEntry[]): ProcessedMovie[] {
  const movieMap = new Map<string, ProcessedMovie>()

  for (const entry of entries) {
    const imdbId = normalizeImdbId(entry.imdb)
    if (!imdbId) continue

    const title = entry.filmLabel?.trim()
    if (!title || title.startsWith('Q') || title.includes('wikidata.org')) continue

    const year = extractYear(entry.releaseDate)
    if (!year) continue

    const wikidataId = extractWikidataId(entry.film)
    const modified = entry.modified

    const existing = movieMap.get(imdbId)

    if (!existing) {
      movieMap.set(imdbId, {
        imdb_id: imdbId,
        title,
        year,
        wikidata_id: wikidataId,
        wikidata_modified: modified,
      })
    } else {
      // Keep the earliest year
      if (year < existing.year) {
        existing.year = year
      }
      // Keep the latest modified date
      if (modified > existing.wikidata_modified) {
        existing.wikidata_modified = modified
      }
    }
  }

  return Array.from(movieMap.values())
}

/**
 * Create availability card from processed movie
 * Note: wikidata_id and wikidata_modified are omitted if schema doesn't support them
 */
function createCard(movie: ProcessedMovie, includeWikidataFields: boolean): AvailabilityCard {
  const now = new Date().toISOString()

  const card: AvailabilityCard = {
    imdb_id: movie.imdb_id,
    title: movie.title,
    year: movie.year,
    type: 'movie',
    genres: ['horror'],
    subgenres: [],
    is_genre_highlight: true,
    sources: [],
    director: '',
    country: '',
    runtime_minutes: null,
    editorial_tags: [],
    featured: false,
    poster_url: '',
    backdrop_url: '',
    synopsis: '',
    mpaa_rating: '',
    imdb_rating: null,
    rt_score: null,
    letterboxd_rating: null,
    tmdb_id: '',
    watchmode_id: '',
    created_at: now,
    updated_at: now,
    availability_checked_at: null,
  }

  if (includeWikidataFields) {
    card.wikidata_id = movie.wikidata_id
    card.wikidata_modified = movie.wikidata_modified
  }

  return card
}

/**
 * Check if wikidata columns exist in the schema
 */
async function checkWikidataColumnsExist(): Promise<boolean> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('wikidata_id')
    .limit(1)

  // If no error, columns exist
  return !error
}

/**
 * Get existing IMDB IDs and their wikidata_modified dates
 */
async function getExistingMovies(
  imdbIds: string[],
  includeWikidataFields: boolean
): Promise<Map<string, { wikidata_modified: string | null }>> {
  const existing = new Map<string, { wikidata_modified: string | null }>()
  const chunkSize = 500

  const selectFields = includeWikidataFields ? 'imdb_id, wikidata_modified' : 'imdb_id'

  for (let i = 0; i < imdbIds.length; i += chunkSize) {
    const chunk = imdbIds.slice(i, i + chunkSize)

    const { data, error } = await supabase
      .from('availability_cards')
      .select(selectFields)
      .in('imdb_id', chunk)

    if (error) {
      console.error('Error checking existing IDs:', error.message)
      continue
    }

    if (data) {
      data.forEach((row: any) =>
        existing.set(row.imdb_id, {
          wikidata_modified: includeWikidataFields ? row.wikidata_modified : null,
        })
      )
    }

    process.stdout.write(
      `\r   Checked ${Math.min(i + chunkSize, imdbIds.length)}/${imdbIds.length} IDs...`
    )
  }
  console.log('')

  return existing
}

/**
 * Insert batch of new cards
 */
async function insertBatch(
  cards: AvailabilityCard[]
): Promise<{ inserted: number; errors: number }> {
  if (cards.length === 0) return { inserted: 0, errors: 0 }

  const { data, error } = await supabase
    .from('availability_cards')
    .insert(cards)
    .select('id')

  if (error) {
    if (error.code === '23505') {
      // Duplicate - try individual inserts
      let inserted = 0
      let errors = 0

      for (const card of cards) {
        const { error: singleError } = await supabase
          .from('availability_cards')
          .insert(card)

        if (singleError) {
          errors++
        } else {
          inserted++
        }
      }

      return { inserted, errors }
    }

    console.error('Batch insert error:', error.message)
    return { inserted: 0, errors: cards.length }
  }

  return { inserted: data?.length || 0, errors: 0 }
}

/**
 * Update existing cards with new Wikidata info
 */
async function updateExisting(
  movies: ProcessedMovie[]
): Promise<{ updated: number; errors: number }> {
  let updated = 0
  let errors = 0

  for (const movie of movies) {
    const { error } = await supabase
      .from('availability_cards')
      .update({
        wikidata_id: movie.wikidata_id,
        wikidata_modified: movie.wikidata_modified,
        updated_at: new Date().toISOString(),
      })
      .eq('imdb_id', movie.imdb_id)

    if (error) {
      errors++
    } else {
      updated++
    }

    if ((updated + errors) % 100 === 0) {
      process.stdout.write(`\r   Updated ${updated + errors}/${movies.length}...`)
    }
  }
  console.log('')

  return { updated, errors }
}

/**
 * Format duration for logging
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Main import function
 */
async function importWikidata() {
  const args = parseArgs()

  console.log('🎬 Wikidata Horror Films Import')
  console.log('='.repeat(50))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No database changes will be made\n')
  }

  if (args.update) {
    console.log('📝 UPDATE MODE - Will update existing entries with new Wikidata info\n')
  }

  if (args.limit !== Infinity) {
    console.log(`📊 Limit: ${args.limit} titles\n`)
  }

  // Check JSON exists
  if (!fs.existsSync(args.filePath)) {
    console.error(`\n❌ JSON file not found: ${args.filePath}`)
    process.exit(1)
  }

  // Read and parse JSON
  console.log(`📁 Reading: ${args.filePath}`)
  const jsonContent = fs.readFileSync(args.filePath, 'utf-8')
  const entries: WikidataEntry[] = JSON.parse(jsonContent)
  console.log(`   Parsed ${entries.length.toLocaleString()} raw entries`)

  // Process and deduplicate
  console.log('\n🔄 Processing and deduplicating...')
  const movies = processEntries(entries)
  console.log(`   Unique movies: ${movies.length.toLocaleString()}`)

  // Check if wikidata columns exist
  const wikidataColumnsExist = await checkWikidataColumnsExist()
  if (!wikidataColumnsExist) {
    console.log('\n⚠️  Wikidata columns not found in schema - importing without tracking')
    console.log('   Run migration 010_add_wikidata_columns.sql to enable update tracking')
  }

  // Check for existing
  console.log('\n🔍 Checking for existing titles in database...')
  const imdbIds = movies.map((m) => m.imdb_id)
  const existingMovies = await getExistingMovies(imdbIds, wikidataColumnsExist)
  console.log(`   Found ${existingMovies.size.toLocaleString()} already in database`)

  // Categorize movies
  const newMovies: ProcessedMovie[] = []
  const moviesToUpdate: ProcessedMovie[] = []

  for (const movie of movies) {
    const existing = existingMovies.get(movie.imdb_id)

    if (!existing) {
      newMovies.push(movie)
    } else if (args.update && wikidataColumnsExist) {
      // Check if Wikidata info is newer
      if (
        !existing.wikidata_modified ||
        movie.wikidata_modified > existing.wikidata_modified
      ) {
        moviesToUpdate.push(movie)
      }
    }
  }

  // Warn if --update was requested but wikidata columns don't exist
  if (args.update && !wikidataColumnsExist) {
    console.log('\n⚠️  --update flag ignored: wikidata columns not in schema')
  }

  console.log(`\n📊 Summary:`)
  console.log(`   New titles to import: ${newMovies.length.toLocaleString()}`)
  if (args.update) {
    console.log(`   Existing to update: ${moviesToUpdate.length.toLocaleString()}`)
  }
  console.log(
    `   Skipped (already exist): ${(movies.length - newMovies.length - moviesToUpdate.length).toLocaleString()}`
  )

  // Apply limit to new movies
  const moviesToInsert = newMovies.slice(0, args.limit)
  if (args.limit !== Infinity && newMovies.length > args.limit) {
    console.log(`   Limited inserts to: ${moviesToInsert.length.toLocaleString()}`)
  }

  // Show sample
  if (moviesToInsert.length > 0) {
    console.log('\n📋 Sample of new titles:')
    moviesToInsert.slice(0, 10).forEach((movie, i) => {
      console.log(`   ${i + 1}. ${movie.title} (${movie.year}) [${movie.imdb_id}]`)
    })
    if (moviesToInsert.length > 10) {
      console.log(`   ... and ${moviesToInsert.length - 10} more`)
    }
  }

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN - No changes made')
    console.log(`   Would import: ${moviesToInsert.length.toLocaleString()} titles`)
    if (args.update) {
      console.log(`   Would update: ${moviesToUpdate.length.toLocaleString()} titles`)
    }
    return
  }

  const startTime = Date.now()
  let totalInserted = 0
  let totalInsertErrors = 0
  let totalUpdated = 0
  let totalUpdateErrors = 0

  // Insert new movies
  if (moviesToInsert.length > 0) {
    console.log(`\n🚀 Importing ${moviesToInsert.length.toLocaleString()} new titles...`)

    const cards = moviesToInsert.map((m) => createCard(m, wikidataColumnsExist))

    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE)
      const result = await insertBatch(batch)

      totalInserted += result.inserted
      totalInsertErrors += result.errors

      const processed = i + batch.length
      if (processed % LOG_INTERVAL === 0 || processed === cards.length) {
        const elapsed = Date.now() - startTime
        const rate = Math.round(totalInserted / (elapsed / 1000))
        const progress = ((processed / cards.length) * 100).toFixed(1)

        console.log(
          `   Progress: ${processed.toLocaleString()}/${cards.length.toLocaleString()} ` +
            `(${progress}%) | Inserted: ${totalInserted.toLocaleString()} | ` +
            `Rate: ${rate}/sec`
        )
      }
    }
  }

  // Update existing movies
  if (args.update && wikidataColumnsExist && moviesToUpdate.length > 0) {
    console.log(`\n📝 Updating ${moviesToUpdate.length.toLocaleString()} existing titles...`)
    const updateResult = await updateExisting(moviesToUpdate)
    totalUpdated = updateResult.updated
    totalUpdateErrors = updateResult.errors
  }

  // Summary
  const totalTime = Date.now() - startTime
  console.log('\n' + '='.repeat(50))
  console.log('✅ IMPORT COMPLETE')
  console.log('='.repeat(50))
  console.log(`
  Raw entries in JSON:     ${entries.length.toLocaleString()}
  Unique movies:           ${movies.length.toLocaleString()}
  Successfully imported:   ${totalInserted.toLocaleString()}
  Import errors:           ${totalInsertErrors.toLocaleString()}`)

  if (args.update) {
    console.log(`  Successfully updated:    ${totalUpdated.toLocaleString()}
  Update errors:           ${totalUpdateErrors.toLocaleString()}`)
  }

  console.log(`
  Time: ${formatDuration(totalTime)}
`)

  if (totalInserted > 0) {
    console.log('💡 Next step: Run enrichment to get posters and streaming sources')
    console.log('   npm run enrich -- --limit 1000')
  }
}

// Run
importWikidata()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

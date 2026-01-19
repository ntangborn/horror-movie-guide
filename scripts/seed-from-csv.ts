/**
 * Seed Script: Import Horror Films from Wikidata CSV
 *
 * This script reads a CSV file containing ~14,932 horror films from Wikidata
 * and seeds them into the Supabase database as minimal AvailabilityCards.
 *
 * Usage:
 *   npx ts-node scripts/seed-from-csv.ts
 *
 * Or with environment variables:
 *   SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx npx ts-node scripts/seed-from-csv.ts
 *
 * Expected CSV format (query.csv from Wikidata):
 *   imdb_id,title,year,director,country,runtime,rt_id
 *
 * The script will:
 * - Skip rows without IMDB IDs (required for API enrichment)
 * - Check for existing entries to avoid duplicates
 * - Create minimal AvailabilityCard entries
 * - Log progress every 100 titles
 * - Batch insert for performance
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import Papa from 'papaparse'
import * as dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, '../query.csv')
const BATCH_SIZE = 100 // Insert in batches for performance
const LOG_INTERVAL = 100 // Log progress every N titles

// Supabase client (using service key for admin access)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY in .env.local')
  console.error('Or pass them as environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Types
interface WikidataRow {
  // Standard column names
  imdb_id?: string
  title?: string
  year?: string
  director?: string
  country?: string
  runtime?: string
  rt_id?: string
  // Wikidata export column names (after lowercase transform)
  imdbid?: string // Wikidata uses imdbId
  film?: string
  filmlabel?: string // Wikidata label format
  publication_date?: string
  directorlabel?: string
  countrylabel?: string
  durationminutes?: string // Wikidata uses durationMinutes
  rottentomatoesid?: string
}

interface MinimalAvailabilityCard {
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
  created_at: string
  updated_at: string
  availability_checked_at: string | null
}

// Stats tracking
interface SeedStats {
  totalRows: number
  skippedNoImdb: number
  skippedDuplicate: number
  inserted: number
  errors: number
  startTime: number
}

/**
 * Normalize IMDB ID format (ensure tt prefix and padding)
 */
function normalizeImdbId(imdbId: string): string | null {
  if (!imdbId) return null

  // Clean up the ID
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
    // If it's just numbers, add tt prefix
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
 * Extract year from various date formats
 */
function extractYear(yearValue: string | undefined): number | null {
  if (!yearValue) return null

  const cleaned = yearValue.trim()

  // Handle just a year
  if (/^\d{4}$/.test(cleaned)) {
    return parseInt(cleaned, 10)
  }

  // Handle full date (YYYY-MM-DD)
  const yearMatch = cleaned.match(/^(\d{4})/)
  if (yearMatch) {
    return parseInt(yearMatch[1], 10)
  }

  return null
}

/**
 * Extract runtime in minutes
 */
function extractRuntime(runtime: string | undefined): number | null {
  if (!runtime) return null

  const cleaned = runtime.trim()

  // Handle just minutes
  if (/^\d+$/.test(cleaned)) {
    return parseInt(cleaned, 10)
  }

  // Handle "120 min" or "120 minutes"
  const minMatch = cleaned.match(/^(\d+)\s*min/)
  if (minMatch) {
    return parseInt(minMatch[1], 10)
  }

  // Handle "2h 30m" format
  const hhmm = cleaned.match(/(\d+)h\s*(\d+)?m?/)
  if (hhmm) {
    const hours = parseInt(hhmm[1], 10)
    const mins = hhmm[2] ? parseInt(hhmm[2], 10) : 0
    return hours * 60 + mins
  }

  return null
}

/**
 * Check if a string is a Wikidata Q-ID (not a real title)
 */
function isWikidataQId(str: string): boolean {
  return /^Q\d+$/.test(str.trim())
}

/**
 * Create a minimal AvailabilityCard from CSV row
 */
function createMinimalCard(row: WikidataRow): MinimalAvailabilityCard | null {
  // Get IMDB ID (required) - try multiple column name formats
  const imdbId = normalizeImdbId(row.imdb_id || row.imdbid || '')
  if (!imdbId) return null

  // Get title (try multiple column names)
  // Note: In Wikidata exports, 'filmlabel' has the title, 'film' has the URL
  const title = (row.title || row.filmlabel || '').trim()
  if (!title) return null

  // Skip if title is just a Wikidata Q-ID (not a real title)
  if (isWikidataQId(title)) return null

  // Skip if title is a Wikidata URL
  if (title.includes('wikidata.org')) return null

  // Get year
  const year = extractYear(row.year || row.publication_date)
  if (!year || year < 1880 || year > new Date().getFullYear() + 2) {
    return null // Invalid year
  }

  // Get optional fields - try multiple column name formats
  const director = (row.director || row.directorlabel || '').trim()
  const country = (row.country || row.countrylabel || '').trim()
  const runtime = extractRuntime(row.runtime || row.durationminutes)

  const now = new Date().toISOString()

  return {
    imdb_id: imdbId,
    title,
    year,
    type: 'movie',
    genres: ['horror'],
    subgenres: [],
    is_genre_highlight: true, // All horror films are genre highlights
    sources: [],
    director: director || 'Unknown',
    country: country || 'Unknown',
    runtime_minutes: runtime,
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
}

/**
 * Check which IMDB IDs already exist in the database
 */
async function getExistingImdbIds(imdbIds: string[]): Promise<Set<string>> {
  const existing = new Set<string>()

  // Query in chunks to avoid query size limits
  const chunkSize = 500
  for (let i = 0; i < imdbIds.length; i += chunkSize) {
    const chunk = imdbIds.slice(i, i + chunkSize)

    const { data, error } = await supabase
      .from('availability_cards')
      .select('imdb_id')
      .in('imdb_id', chunk)

    if (error) {
      console.error('Error checking existing IDs:', error.message)
      continue
    }

    if (data) {
      data.forEach((row) => existing.add(row.imdb_id))
    }
  }

  return existing
}

/**
 * Insert cards in batches
 */
async function insertBatch(cards: MinimalAvailabilityCard[]): Promise<{
  inserted: number
  errors: number
}> {
  if (cards.length === 0) return { inserted: 0, errors: 0 }

  const { data, error } = await supabase
    .from('availability_cards')
    .insert(cards)
    .select('id')

  if (error) {
    // Handle unique constraint violations individually
    if (error.code === '23505') {
      // Duplicate key - try individual inserts
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
 * Format duration for logging
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🎬 Horror Movie Guide - CSV Seed Script')
  console.log('=' .repeat(50))

  // Check if CSV file exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`\n❌ CSV file not found: ${CSV_FILE_PATH}`)
    console.error('\nPlease ensure query.csv is in the project root directory.')
    console.error('Expected format: imdb_id,title,year,director,country,runtime,rt_id')
    process.exit(1)
  }

  console.log(`\n📁 Reading CSV file: ${CSV_FILE_PATH}`)

  // Read and parse CSV
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8')

  const parseResult = Papa.parse<WikidataRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.toLowerCase().trim().replace(/\s+/g, '_'),
  })

  if (parseResult.errors.length > 0) {
    console.warn('\n⚠️ CSV parsing warnings:')
    parseResult.errors.slice(0, 5).forEach((err) => {
      console.warn(`  Row ${err.row}: ${err.message}`)
    })
    if (parseResult.errors.length > 5) {
      console.warn(`  ... and ${parseResult.errors.length - 5} more warnings`)
    }
  }

  const rows = parseResult.data
  console.log(`\n📊 Parsed ${rows.length.toLocaleString()} rows from CSV`)

  // Initialize stats
  const stats: SeedStats = {
    totalRows: rows.length,
    skippedNoImdb: 0,
    skippedDuplicate: 0,
    inserted: 0,
    errors: 0,
    startTime: Date.now(),
  }

  // First pass: create cards and collect IMDB IDs
  console.log('\n🔄 Processing rows...')
  const cards: MinimalAvailabilityCard[] = []
  const imdbIds: string[] = []

  for (const row of rows) {
    const card = createMinimalCard(row)
    if (card) {
      cards.push(card)
      imdbIds.push(card.imdb_id)
    } else {
      stats.skippedNoImdb++
    }
  }

  console.log(`\n✅ Valid cards created: ${cards.length.toLocaleString()}`)
  console.log(`⏭️ Skipped (no valid IMDB ID): ${stats.skippedNoImdb.toLocaleString()}`)

  // Check for existing entries
  console.log('\n🔍 Checking for existing entries in database...')
  const existingIds = await getExistingImdbIds(imdbIds)
  console.log(`  Found ${existingIds.size.toLocaleString()} existing entries`)

  // Filter out duplicates
  const newCards = cards.filter((card) => !existingIds.has(card.imdb_id))
  stats.skippedDuplicate = cards.length - newCards.length

  console.log(`\n📝 New cards to insert: ${newCards.length.toLocaleString()}`)
  console.log(`⏭️ Skipped (already in DB): ${stats.skippedDuplicate.toLocaleString()}`)

  if (newCards.length === 0) {
    console.log('\n✨ No new cards to insert. Database is up to date!')
    return
  }

  // Insert in batches
  console.log(`\n🚀 Inserting cards in batches of ${BATCH_SIZE}...`)
  console.log('')

  for (let i = 0; i < newCards.length; i += BATCH_SIZE) {
    const batch = newCards.slice(i, i + BATCH_SIZE)
    const result = await insertBatch(batch)

    stats.inserted += result.inserted
    stats.errors += result.errors

    // Log progress every LOG_INTERVAL or at the end
    const processed = i + batch.length
    if (processed % LOG_INTERVAL === 0 || processed === newCards.length) {
      const elapsed = Date.now() - stats.startTime
      const rate = Math.round(stats.inserted / (elapsed / 1000))
      const progress = ((processed / newCards.length) * 100).toFixed(1)

      console.log(
        `  Progress: ${processed.toLocaleString()}/${newCards.length.toLocaleString()} ` +
        `(${progress}%) | Inserted: ${stats.inserted.toLocaleString()} | ` +
        `Rate: ${rate}/sec | Elapsed: ${formatDuration(elapsed)}`
      )
    }
  }

  // Final summary
  const totalTime = Date.now() - stats.startTime
  console.log('\n' + '='.repeat(50))
  console.log('📊 SEED COMPLETE')
  console.log('='.repeat(50))
  console.log(`\n  Total rows in CSV:     ${stats.totalRows.toLocaleString()}`)
  console.log(`  Skipped (no IMDB):     ${stats.skippedNoImdb.toLocaleString()}`)
  console.log(`  Skipped (duplicate):   ${stats.skippedDuplicate.toLocaleString()}`)
  console.log(`  Successfully inserted: ${stats.inserted.toLocaleString()}`)
  console.log(`  Errors:                ${stats.errors.toLocaleString()}`)
  console.log(`\n  Total time: ${formatDuration(totalTime)}`)

  if (stats.inserted > 0) {
    const avgRate = Math.round(stats.inserted / (totalTime / 1000))
    console.log(`  Average rate: ${avgRate} records/second`)
  }

  console.log('\n✨ Database now has titles ready for enrichment via OMDB/Watchmode APIs!')
}

// Run the seed
seed()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

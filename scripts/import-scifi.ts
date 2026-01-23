/**
 * Import Script: Add Sci-Fi Films from Cleaned Wikidata CSV
 *
 * This script reads the cleaned sci-fi CSV and imports new titles
 * into the availability_cards table, skipping any that already exist.
 *
 * Usage:
 *   npm run import-scifi                    # Import all new titles
 *   npm run import-scifi -- --dry-run       # Preview without importing
 *   npm run import-scifi -- --limit 100     # Import up to 100 titles
 *
 * Expected CSV format (scifi_cleaned.csv):
 *   imdb_id,title,year,tmdb_id,country,director,wikidata_id
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const CSV_FILE_PATH = path.resolve(__dirname, '../scifi_cleaned.csv')
const BATCH_SIZE = 100
const LOG_INTERVAL = 100

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Parse arguments
interface Args {
  dryRun: boolean
  limit: number
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    dryRun: false,
    limit: Infinity,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      result.dryRun = true
    } else if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    }
  }

  return result
}

// Types
interface SciFiRow {
  imdb_id: string
  title: string
  year: string
  tmdb_id: string
  country: string
  director: string
  wikidata_id: string
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
  created_at: string
  updated_at: string
  availability_checked_at: string | null
}

// Parse CSV
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(content: string): SciFiRow[] {
  const lines = content.trim().split('\n')
  const rows: SciFiRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    rows.push({
      imdb_id: values[0] || '',
      title: values[1] || '',
      year: values[2] || '',
      tmdb_id: values[3] || '',
      country: values[4] || '',
      director: values[5] || '',
      wikidata_id: values[6] || '',
    })
  }

  return rows
}

// Create card from row
function createCard(row: SciFiRow): AvailabilityCard | null {
  if (!row.imdb_id || !row.title) return null

  const year = parseInt(row.year, 10)
  if (isNaN(year) || year < 1880 || year > 2030) {
    // Still allow import but with year 0 if missing
    // Actually, let's just skip if no valid year since it's important
    if (!row.year) return null
  }

  const now = new Date().toISOString()

  return {
    imdb_id: row.imdb_id,
    title: row.title,
    year: year || 0,
    type: 'movie',
    genres: ['science fiction'],
    subgenres: [],
    is_genre_highlight: false,
    sources: [],
    director: row.director || '',
    country: row.country || '',
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
    tmdb_id: row.tmdb_id || '',
    watchmode_id: '',
    created_at: now,
    updated_at: now,
    availability_checked_at: null,
  }
}

// Check existing IMDB IDs
async function getExistingImdbIds(imdbIds: string[]): Promise<Set<string>> {
  const existing = new Set<string>()
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

    process.stdout.write(`\r   Checked ${Math.min(i + chunkSize, imdbIds.length)}/${imdbIds.length} IDs...`)
  }
  console.log('')

  return existing
}

// Insert batch
async function insertBatch(cards: AvailabilityCard[]): Promise<{ inserted: number; errors: number }> {
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

// Format duration
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Main import function
async function importSciFi() {
  const args = parseArgs()

  console.log('🚀 Sci-Fi Import Script')
  console.log('=' .repeat(50))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No database changes will be made\n')
  }

  if (args.limit !== Infinity) {
    console.log(`\n📊 Limit: ${args.limit} titles\n`)
  }

  // Check CSV exists
  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`\n❌ CSV file not found: ${CSV_FILE_PATH}`)
    console.error('Run cleanup-scifi-csv.ts first to generate the cleaned CSV.')
    process.exit(1)
  }

  // Read and parse CSV
  console.log(`📁 Reading: ${CSV_FILE_PATH}`)
  const csvContent = fs.readFileSync(CSV_FILE_PATH, 'utf-8')
  const rows = parseCSV(csvContent)
  console.log(`   Parsed ${rows.length.toLocaleString()} rows`)

  // Create cards
  console.log('\n🔄 Creating cards...')
  const allCards: AvailabilityCard[] = []
  let skippedInvalid = 0

  for (const row of rows) {
    const card = createCard(row)
    if (card) {
      allCards.push(card)
    } else {
      skippedInvalid++
    }
  }

  console.log(`   Valid cards: ${allCards.length.toLocaleString()}`)
  console.log(`   Skipped (invalid): ${skippedInvalid}`)

  // Check for existing
  console.log('\n🔍 Checking for existing titles in database...')
  const imdbIds = allCards.map(c => c.imdb_id)
  const existingIds = await getExistingImdbIds(imdbIds)
  console.log(`   Found ${existingIds.size.toLocaleString()} already in database`)

  // Filter to new only
  const newCards = allCards.filter(c => !existingIds.has(c.imdb_id))
  const skippedDuplicate = allCards.length - newCards.length

  console.log(`\n📝 New titles to import: ${newCards.length.toLocaleString()}`)
  console.log(`   Skipped (already exist): ${skippedDuplicate.toLocaleString()}`)

  // Apply limit
  const cardsToInsert = newCards.slice(0, args.limit)
  if (args.limit !== Infinity && newCards.length > args.limit) {
    console.log(`   Limited to: ${cardsToInsert.length.toLocaleString()}`)
  }

  if (cardsToInsert.length === 0) {
    console.log('\n✨ No new titles to import!')
    return
  }

  // Show sample
  console.log('\n📋 Sample of titles to import:')
  cardsToInsert.slice(0, 10).forEach((card, i) => {
    console.log(`   ${i + 1}. ${card.title} (${card.year}) [${card.imdb_id}]`)
  })
  if (cardsToInsert.length > 10) {
    console.log(`   ... and ${cardsToInsert.length - 10} more`)
  }

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN - No changes made')
    console.log(`   Would import: ${cardsToInsert.length.toLocaleString()} titles`)
    return
  }

  // Insert
  console.log(`\n🚀 Importing ${cardsToInsert.length.toLocaleString()} titles...`)
  const startTime = Date.now()
  let totalInserted = 0
  let totalErrors = 0

  for (let i = 0; i < cardsToInsert.length; i += BATCH_SIZE) {
    const batch = cardsToInsert.slice(i, i + BATCH_SIZE)
    const result = await insertBatch(batch)

    totalInserted += result.inserted
    totalErrors += result.errors

    const processed = i + batch.length
    if (processed % LOG_INTERVAL === 0 || processed === cardsToInsert.length) {
      const elapsed = Date.now() - startTime
      const rate = Math.round(totalInserted / (elapsed / 1000))
      const progress = ((processed / cardsToInsert.length) * 100).toFixed(1)

      console.log(
        `   Progress: ${processed.toLocaleString()}/${cardsToInsert.length.toLocaleString()} ` +
        `(${progress}%) | Inserted: ${totalInserted.toLocaleString()} | ` +
        `Rate: ${rate}/sec`
      )
    }
  }

  // Summary
  const totalTime = Date.now() - startTime
  console.log('\n' + '='.repeat(50))
  console.log('✅ IMPORT COMPLETE')
  console.log('='.repeat(50))
  console.log(`
  Total in CSV:          ${rows.length.toLocaleString()}
  Skipped (invalid):     ${skippedInvalid.toLocaleString()}
  Skipped (duplicate):   ${skippedDuplicate.toLocaleString()}
  Successfully imported: ${totalInserted.toLocaleString()}
  Errors:                ${totalErrors.toLocaleString()}

  Time: ${formatDuration(totalTime)}
`)

  console.log('💡 Next step: Run enrichment to get posters and streaming sources')
  console.log('   npm run enrich -- --limit 1000')
}

// Run
importSciFi()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

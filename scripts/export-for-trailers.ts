/**
 * Export Script: Generate list of titles for trailer scraping
 *
 * This script exports titles that need trailers to a JSON file
 * for processing by the trailer-finder script.
 *
 * Usage:
 *   npx tsx scripts/export-for-trailers.ts              # Export 50 titles (default)
 *   npx tsx scripts/export-for-trailers.ts --limit 100  # Export 100 titles
 *   npx tsx scripts/export-for-trailers.ts --days 14    # Titles enriched in last 14 days
 *   npx tsx scripts/export-for-trailers.ts --all        # All titles without trailers (ignores days filter)
 *   npx tsx scripts/export-for-trailers.ts --dry-run    # Preview without writing file
 *
 * Output: ../trailer-finder/movies.json
 * Format: [{id, title, year}, ...]
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const DEFAULT_LIMIT = 50
const DEFAULT_DAYS = 7
const OUTPUT_PATH = path.resolve(__dirname, '../../trailer-finder/movies.json')

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
  days: number
  all: boolean
  dryRun: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    limit: DEFAULT_LIMIT,
    days: DEFAULT_DAYS,
    all: false,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--days' && args[i + 1]) {
      result.days = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--all') {
      result.all = true
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    }
  }

  return result
}

// Types
interface TitleForExport {
  id: string
  title: string
  year: number
}

interface DatabaseTitle {
  id: string
  title: string
  year: number
  availability_checked_at: string | null
  trailer_status: string | null
}

/**
 * Fetch titles that need trailers
 */
async function getTitlesForTrailers(args: Args): Promise<TitleForExport[]> {
  const allTitles: DatabaseTitle[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  console.log('   Fetching titles from database...')

  while (hasMore) {
    let query = supabase
      .from('availability_cards')
      .select('id, title, year, availability_checked_at, trailer_status')
      .or('trailer_status.is.null,trailer_status.eq.none')
      .order('availability_checked_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    const { data, error } = await query

    if (error) {
      console.error('Error fetching titles:', error.message)
      break
    }

    if (data && data.length > 0) {
      allTitles.push(...(data as DatabaseTitle[]))
      offset += data.length
      hasMore = data.length === pageSize
      process.stdout.write(`\r   Fetched ${allTitles.length} titles...`)
    } else {
      hasMore = false
    }
  }
  console.log('')

  // Filter by recency if not --all
  let filteredTitles = allTitles
  if (!args.all) {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - args.days)
    const cutoffISO = cutoffDate.toISOString()

    filteredTitles = allTitles.filter(t => {
      if (!t.availability_checked_at) return false
      return t.availability_checked_at >= cutoffISO
    })

    console.log(`   Filtered to ${filteredTitles.length} titles enriched in last ${args.days} days`)
  }

  // Apply limit and transform to export format
  const exportTitles = filteredTitles.slice(0, args.limit).map(t => ({
    id: t.id,
    title: t.title,
    year: t.year,
  }))

  return exportTitles
}

/**
 * Main export function
 */
async function exportForTrailers(args: Args) {
  console.log('🎬 Horror Movie Guide - Export Titles for Trailer Scraping')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No file will be written\n')
  }

  console.log(`\n📊 Configuration:`)
  console.log(`   Limit: ${args.limit} titles`)
  if (args.all) {
    console.log(`   Filter: All titles without trailers`)
  } else {
    console.log(`   Filter: Enriched in last ${args.days} days`)
  }
  console.log(`   Output: ${OUTPUT_PATH}\n`)

  // Fetch titles
  const titles = await getTitlesForTrailers(args)

  if (titles.length === 0) {
    console.log('\n⚠️  No titles found matching criteria!')
    console.log('   Try using --all flag or increasing --days value')
    return
  }

  console.log(`\n📝 Found ${titles.length} titles to export`)

  // Preview
  console.log('\n📋 Sample titles:')
  console.log('-'.repeat(55))
  titles.slice(0, 10).forEach((t, i) => {
    console.log(`   ${i + 1}. ${t.title} (${t.year})`)
  })
  if (titles.length > 10) {
    console.log(`   ... and ${titles.length - 10} more`)
  }

  if (args.dryRun) {
    console.log('\n✨ Dry run complete. No file written.')
    return
  }

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Write output file
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(titles, null, 2))

  console.log(`\n✅ Exported ${titles.length} titles to ${OUTPUT_PATH}`)
  console.log('\n📌 Next steps:')
  console.log('   1. cd ../trailer-finder')
  console.log('   2. node find-trailers.js')
  console.log('   3. npx tsx scripts/import-trailers.ts')
}

// Run
const args = parseArgs()
exportForTrailers(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

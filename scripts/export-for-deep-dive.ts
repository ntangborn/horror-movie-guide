/**
 * Export movies for Deep Dive article scraping
 *
 * Exports movies that have both poster AND streaming sources
 * as a CSV file for use with external article scrapers.
 *
 * Usage:
 *   npx tsx scripts/export-for-deep-dive.ts              # Export 500 movies (default)
 *   npx tsx scripts/export-for-deep-dive.ts --limit 100  # Export 100 movies
 *   npx tsx scripts/export-for-deep-dive.ts --all        # Export all qualifying movies
 *   npx tsx scripts/export-for-deep-dive.ts --dry-run    # Preview without writing file
 *
 * Output: deep-dive-export.txt with format: Title (Year)
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const DEFAULT_LIMIT = 500
const OUTPUT_PATH = path.resolve(__dirname, '../deep-dive-export.txt')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Args {
  limit: number
  all: boolean
  dryRun: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    limit: DEFAULT_LIMIT,
    all: false,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--all') {
      result.all = true
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    }
  }

  return result
}

interface MovieRecord {
  id: string
  imdb_id: string
  title: string
  year: number
  poster_url: string | null
  sources: any[] | null
  imdb_rating: number | null
  availability_checked_at: string | null
}

async function getMoviesForDeepDive(args: Args): Promise<MovieRecord[]> {
  console.log('📊 Fetching movies from database...')

  const allMovies: MovieRecord[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, poster_url, sources, imdb_rating, availability_checked_at')
      .order('availability_checked_at', { ascending: false, nullsFirst: false })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching movies:', error.message)
      break
    }

    if (data && data.length > 0) {
      allMovies.push(...(data as MovieRecord[]))
      offset += data.length
      hasMore = data.length === pageSize
      process.stdout.write(`\r   Fetched ${allMovies.length} movies...`)
    } else {
      hasMore = false
    }
  }
  console.log('')

  // Filter: must have poster AND streaming sources
  const hasPoster = (m: MovieRecord): boolean => {
    return !!(m.poster_url && m.poster_url !== '' && m.poster_url !== 'N/A')
  }

  const hasSources = (m: MovieRecord): boolean => {
    return !!(m.sources && Array.isArray(m.sources) && m.sources.length > 0)
  }

  const qualifying = allMovies
    .filter(m => hasPoster(m) && hasSources(m))
    .sort((a, b) => {
      // Sort by IMDB rating descending for quality
      const ratingA = a.imdb_rating || 0
      const ratingB = b.imdb_rating || 0
      return ratingB - ratingA
    })

  console.log(`   Total movies: ${allMovies.length}`)
  console.log(`   With poster + streaming: ${qualifying.length}`)

  if (args.all) {
    return qualifying
  }

  return qualifying.slice(0, args.limit)
}

async function exportForDeepDive(args: Args) {
  console.log('🎬 Export Movies for Deep Dive Scraping')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No file will be written\n')
  }

  console.log(`\n📊 Configuration:`)
  if (args.all) {
    console.log(`   Limit: All qualifying movies`)
  } else {
    console.log(`   Limit: ${args.limit} movies`)
  }
  console.log(`   Output: ${OUTPUT_PATH}`)
  console.log(`   Format: Title (Year)\n`)

  const movies = await getMoviesForDeepDive(args)

  if (movies.length === 0) {
    console.log('\n⚠️  No qualifying movies found!')
    return
  }

  console.log(`\n📝 Exporting ${movies.length} movies`)

  // Format as Title (Year)
  const lines = movies.map(m => `${m.title} (${m.year})`)

  // Preview
  console.log('\n📋 Sample output:')
  console.log('-'.repeat(55))
  movies.slice(0, 10).forEach((m, i) => {
    console.log(`   ${i + 1}. ${m.title} (${m.year})`)
  })
  if (movies.length > 10) {
    console.log(`   ... and ${movies.length - 10} more`)
  }

  if (args.dryRun) {
    console.log('\n✨ Dry run complete. No file written.')
    return
  }

  // Write file
  fs.writeFileSync(OUTPUT_PATH, lines.join('\n'))

  console.log(`\n✅ Exported ${movies.length} movies to ${OUTPUT_PATH}`)
  console.log('\n📌 Next steps:')
  console.log('   1. Send CSV to external scraper')
  console.log('   2. Get scraped articles (id/imdb_id, url, headline, summary)')
  console.log('   3. Run: npx tsx scripts/import-deep-dive.ts --file <results.csv>')
}

const args = parseArgs()
exportForDeepDive(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

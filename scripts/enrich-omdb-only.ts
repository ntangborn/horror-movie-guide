/**
 * OMDB-Only Enrichment Script
 *
 * Specifically targets titles that have Watchmode data but are missing OMDB data.
 * This is for titles that were enriched with --watchmode-only previously.
 *
 * Usage:
 *   npx ts-node scripts/enrich-omdb-only.ts --limit 500
 *   npx ts-node scripts/enrich-omdb-only.ts --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_DELAY_MS = 100

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface Args {
  limit: number
  dryRun: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = { limit: 100, dryRun: false }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) {
      result.limit = parseInt(args[i + 1], 10)
      i++
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    }
  }

  return result
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
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
  imdbVotes: string
  Metascore: string
  Awards: string
  imdbID: string
  Type: string
  Response: string
  Error?: string
  Country?: string
}

async function fetchFromOMDB(imdbId: string): Promise<OMDBResponse | null> {
  if (!OMDB_API_KEY) return null

  try {
    const url = `http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}&plot=full`
    const response = await fetch(url)

    if (!response.ok) return null

    const data: OMDBResponse = await response.json()
    if (data.Response !== 'True') return null

    return data
  } catch {
    return null
  }
}

async function main() {
  const args = parseArgs()

  console.log('🎬 OMDB-Only Enrichment Script')
  console.log('='.repeat(55))

  if (!OMDB_API_KEY) {
    console.error('❌ OMDB_API_KEY is not configured')
    process.exit(1)
  }

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE\n')
  }

  // Fetch all titles
  console.log('\n📊 Fetching titles...')
  const allTitles: any[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, watchmode_id, availability_checked_at, poster_url, imdb_rating')
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error:', error.message)
      break
    }

    if (data && data.length > 0) {
      allTitles.push(...data)
      offset += data.length
      hasMore = data.length === pageSize
      process.stdout.write(`\r   Fetched ${allTitles.length} titles...`)
    } else {
      hasMore = false
    }
  }
  console.log('')

  // Filter: Has Watchmode but missing OMDB
  const needsOmdb = allTitles.filter(t => {
    const hasWatchmode = t.watchmode_id || t.availability_checked_at
    const missingOmdb = !t.poster_url && !t.imdb_rating
    return hasWatchmode && missingOmdb && t.imdb_id
  })

  // Sort by year descending (recent first)
  needsOmdb.sort((a, b) => b.year - a.year)

  // Limit
  const toProcess = needsOmdb.slice(0, args.limit)

  console.log(`   Total in DB: ${allTitles.length}`)
  console.log(`   Need OMDB: ${needsOmdb.length}`)
  console.log(`   Will process: ${toProcess.length}`)

  if (args.dryRun) {
    console.log('\n📋 Would enrich:')
    toProcess.slice(0, 20).forEach((t, i) => {
      console.log(`  ${i + 1}. ${t.title} (${t.year}) [${t.imdb_id}]`)
    })
    if (toProcess.length > 20) {
      console.log(`  ... and ${toProcess.length - 20} more`)
    }
    return
  }

  // Process
  console.log('\n🚀 Starting OMDB enrichment...\n')

  let success = 0
  let failed = 0
  let updated = 0

  for (let i = 0; i < toProcess.length; i++) {
    const title = toProcess[i]

    process.stdout.write(`\r  [${i + 1}/${toProcess.length}] ${title.title.substring(0, 35).padEnd(35)} `)

    const omdb = await fetchFromOMDB(title.imdb_id)
    await sleep(OMDB_DELAY_MS)

    if (omdb) {
      success++

      const updates: Record<string, any> = { updated_at: new Date().toISOString() }

      if (omdb.Poster && omdb.Poster !== 'N/A') updates.poster_url = omdb.Poster
      if (omdb.Plot && omdb.Plot !== 'N/A') updates.synopsis = omdb.Plot
      if (omdb.imdbRating && omdb.imdbRating !== 'N/A') updates.imdb_rating = parseFloat(omdb.imdbRating)
      if (omdb.Rated && omdb.Rated !== 'N/A') updates.mpaa_rating = omdb.Rated
      if (omdb.Runtime && omdb.Runtime !== 'N/A') {
        const match = omdb.Runtime.match(/(\d+)/)
        if (match) updates.runtime_minutes = parseInt(match[1], 10)
      }
      if (omdb.Director && omdb.Director !== 'N/A') updates.director = omdb.Director
      if (omdb.Country && omdb.Country !== 'N/A') updates.country = omdb.Country
      if (omdb.Genre && omdb.Genre !== 'N/A') {
        updates.genres = omdb.Genre.split(',').map(g => g.trim().toLowerCase())
      }

      const { error } = await supabase
        .from('availability_cards')
        .update(updates)
        .eq('id', title.id)

      if (!error) updated++
    } else {
      failed++
    }

    if ((i + 1) % 50 === 0) {
      console.log(`  ✓ ${i + 1}/${toProcess.length} (${success} success, ${failed} failed)`)
    }
  }

  console.log('\n')
  console.log('='.repeat(55))
  console.log('📊 COMPLETE')
  console.log('='.repeat(55))
  console.log(`
  Processed:  ${toProcess.length}
  OMDB found: ${success}
  Not found:  ${failed}
  DB updated: ${updated}

  Remaining:  ${needsOmdb.length - toProcess.length} titles still need OMDB
`)
}

main()

/**
 * Find titles that have Watchmode enrichment but no OMDB data
 *
 * Watchmode sets: watchmode_id, sources, availability_checked_at
 * OMDB sets: poster_url, synopsis, imdb_rating, mpaa_rating, runtime_minutes, director, country, genres
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function findTitles() {
  console.log('Finding titles with Watchmode data but no OMDB enrichment...\n')

  // Fetch all titles with pagination
  const allTitles: any[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, watchmode_id, availability_checked_at, poster_url, imdb_rating, synopsis, director')
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching titles:', error.message)
      break
    }

    if (data && data.length > 0) {
      allTitles.push(...data)
      offset += data.length
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  console.log(`Total titles in database: ${allTitles.length}`)

  // Filter: Has Watchmode data (watchmode_id set or availability_checked_at set)
  // But missing OMDB data (no poster_url AND no imdb_rating)
  const watchmodeNoOmdb = allTitles.filter(t => {
    const hasWatchmode = t.watchmode_id || t.availability_checked_at
    const missingOmdb = !t.poster_url && !t.imdb_rating
    return hasWatchmode && missingOmdb
  })

  console.log(`\nTitles with Watchmode but no OMDB: ${watchmodeNoOmdb.length}`)

  // Sort by year descending
  watchmodeNoOmdb.sort((a, b) => b.year - a.year)

  // Display the list
  console.log('\n' + '='.repeat(80))
  console.log('TITLE'.padEnd(45) + 'YEAR'.padEnd(8) + 'IMDB ID'.padEnd(15) + 'WATCHMODE ID')
  console.log('='.repeat(80))

  watchmodeNoOmdb.forEach(t => {
    console.log(
      t.title.substring(0, 43).padEnd(45) +
      String(t.year).padEnd(8) +
      (t.imdb_id || 'N/A').padEnd(15) +
      (t.watchmode_id || 'checked')
    )
  })

  console.log('\n' + '='.repeat(80))
  console.log(`Total: ${watchmodeNoOmdb.length} titles need OMDB enrichment`)

  // Show breakdown by decade
  const byDecade: Record<string, number> = {}
  watchmodeNoOmdb.forEach(t => {
    const decade = Math.floor(t.year / 10) * 10
    byDecade[decade] = (byDecade[decade] || 0) + 1
  })

  console.log('\nBy decade:')
  Object.keys(byDecade).sort((a, b) => Number(b) - Number(a)).forEach(decade => {
    console.log(`  ${decade}s: ${byDecade[Number(decade)]}`)
  })

  // Suggest command
  if (watchmodeNoOmdb.length > 0) {
    console.log(`\nTo enrich these with OMDB data, run:`)
    console.log(`  npm run enrich -- --omdb-only --limit ${Math.min(watchmodeNoOmdb.length, 1000)}`)
  }
}

findTitles()

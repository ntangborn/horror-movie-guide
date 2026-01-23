/**
 * Enrich posters for titles that have streaming data but no poster
 * Targets only OMDB to get poster_url
 */

import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_DELAY_MS = 100

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  process.exit(1)
}

if (!OMDB_API_KEY) {
  console.error('Missing OMDB_API_KEY!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Title {
  id: string
  imdb_id: string
  title: string
  year: number
  sources: any[] | null
  poster_url: string | null
}

interface OMDBResponse {
  Title: string
  Year: string
  Poster: string
  Plot: string
  imdbRating: string
  Rated: string
  Runtime: string
  Director: string
  Country: string
  Genre: string
  Response: string
  Error?: string
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchFromOMDB(imdbId: string): Promise<OMDBResponse | null> {
  try {
    const url = `http://www.omdbapi.com/?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}&plot=full`
    const response = await fetch(url)

    if (!response.ok) return null

    const data: OMDBResponse = await response.json()
    if (data.Response !== 'True') return null

    return data
  } catch (error) {
    return null
  }
}

async function enrichPostersOnly(limit: number) {
  console.log('🖼️  Poster Enrichment - Titles with streaming but no poster')
  console.log('='.repeat(60))
  console.log(`\nLimit: ${limit} titles\n`)

  // Fetch all titles
  console.log('📊 Fetching titles...')
  const allTitles: Title[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, sources, poster_url')
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching titles:', error.message)
      break
    }

    if (data && data.length > 0) {
      allTitles.push(...(data as Title[]))
      offset += data.length
      hasMore = data.length === pageSize
      process.stdout.write(`\r   Fetched ${allTitles.length} titles...`)
    } else {
      hasMore = false
    }
  }
  console.log('\n')

  // Filter: has streaming sources but no poster
  const hasStreaming = (t: Title): boolean => {
    return !!(t.sources && Array.isArray(t.sources) && t.sources.length > 0)
  }

  const noPoster = (t: Title): boolean => {
    return !t.poster_url || t.poster_url === '' || t.poster_url === 'N/A'
  }

  const targets = allTitles
    .filter(t => hasStreaming(t) && noPoster(t))
    .sort((a, b) => {
      // Prioritize by number of sources (more sources = more important)
      const aCount = a.sources?.length || 0
      const bCount = b.sources?.length || 0
      return bCount - aCount
    })
    .slice(0, limit)

  console.log(`📝 Found ${targets.length} titles to process`)
  console.log(`   (sorted by streaming source count - most available first)\n`)

  if (targets.length === 0) {
    console.log('✨ No titles need poster enrichment!')
    return
  }

  // Process
  console.log('🚀 Starting OMDB enrichment...\n')

  let success = 0
  let failed = 0
  let alreadyHad = 0
  let noOmdbPoster = 0

  for (let i = 0; i < targets.length; i++) {
    const title = targets[i]
    const sourceCount = title.sources?.length || 0

    process.stdout.write(
      `\r  [${(i + 1).toString().padStart(3)}/${targets.length}] ${title.title.substring(0, 35).padEnd(35)} (${sourceCount} src) `
    )

    const omdbData = await fetchFromOMDB(title.imdb_id)
    await sleep(OMDB_DELAY_MS)

    if (!omdbData) {
      failed++
      continue
    }

    if (!omdbData.Poster || omdbData.Poster === 'N/A') {
      noOmdbPoster++
      continue
    }

    // Update with poster and any other missing data
    const updates: Record<string, unknown> = {
      poster_url: omdbData.Poster,
      updated_at: new Date().toISOString(),
    }

    // Also fill in other missing metadata while we're at it
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

    const { error } = await supabase
      .from('availability_cards')
      .update(updates)
      .eq('id', title.id)

    if (error) {
      failed++
    } else {
      success++
    }

    // Progress log every 50
    if ((i + 1) % 50 === 0) {
      console.log(`  ✓ ${i + 1}/${targets.length} - Success: ${success}, No poster in OMDB: ${noOmdbPoster}, Failed: ${failed}`)
    }
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('📊 ENRICHMENT COMPLETE')
  console.log('='.repeat(60))
  console.log(`
   Total processed:     ${targets.length}
   ✅ Posters added:     ${success}
   ⚠️  No poster in OMDB: ${noOmdbPoster}
   ❌ Failed/not found:  ${failed}

   OMDB calls used: ${targets.length} / 1000 daily limit
`)
}

// Parse limit from args
const args = process.argv.slice(2)
let limit = 500
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--limit' && args[i + 1]) {
    limit = parseInt(args[i + 1], 10)
  } else if (args[i].startsWith('--') && !isNaN(parseInt(args[i].slice(2)))) {
    limit = parseInt(args[i].slice(2), 10)
  }
}

enrichPostersOnly(limit)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

/**
 * Find titles that have Watchmode streaming data but no poster
 */

import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface Title {
  id: string
  imdb_id: string
  title: string
  year: number
  watchmode_id: string | null
  sources: any[] | null
  poster_url: string | null
}

async function findTitlesWithStreamingButNoPoster() {
  console.log('🔍 Finding titles with Watchmode data but no poster...\n')

  const allTitles: Title[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  // Fetch all titles
  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, watchmode_id, sources, poster_url')
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

  // Filter: has ACTUAL streaming sources (not just watchmode_id) but no poster
  const hasStreamingData = (t: Title): boolean => {
    return !!(t.sources && Array.isArray(t.sources) && t.sources.length > 0)
  }

  const noPoster = (t: Title): boolean => {
    return !t.poster_url || t.poster_url === '' || t.poster_url === 'N/A'
  }

  const matches = allTitles.filter(t => hasStreamingData(t) && noPoster(t))

  // Sort by year descending
  matches.sort((a, b) => b.year - a.year)

  console.log(`📊 Results:`)
  console.log(`   Total titles: ${allTitles.length}`)
  console.log(`   With streaming data: ${allTitles.filter(hasStreamingData).length}`)
  console.log(`   With streaming but NO poster: ${matches.length}`)
  console.log('')

  if (matches.length === 0) {
    console.log('✨ All titles with streaming data have posters!')
    return
  }

  console.log('📋 Titles with streaming data but no poster:')
  console.log('─'.repeat(70))

  matches.forEach((t, i) => {
    const sourceCount = t.sources && Array.isArray(t.sources) ? t.sources.length : 0
    console.log(`${(i + 1).toString().padStart(4)}. ${t.title} (${t.year}) [${t.imdb_id}] - ${sourceCount} sources`)
  })

  console.log('')
  console.log('─'.repeat(70))
  console.log(`Total: ${matches.length} titles need posters`)

  // Output IMDB IDs for easy copy
  console.log('\n📝 IMDB IDs (for batch processing):')
  console.log(matches.map(t => t.imdb_id).join('\n'))
}

findTitlesWithStreamingButNoPoster()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Error:', error)
    process.exit(1)
  })

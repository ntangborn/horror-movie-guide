import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function checkStatus() {
  console.log('📊 Checking enrichment status across ALL titles...\n')

  // Fetch ALL titles with pagination
  const allData: any[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, title, year, poster_url, sources, watchmode_id, availability_checked_at')
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching titles:', error)
      return
    }

    if (data && data.length > 0) {
      allData.push(...data)
      offset += data.length
      hasMore = data.length === pageSize
      process.stdout.write(`\r  Fetched ${allData.length} titles...`)
    } else {
      hasMore = false
    }
  }

  console.log(`\n\n📈 Total titles in database: ${allData.length}\n`)

  // Categorize titles
  let hasPoster = 0
  let hasSources = 0
  let hasWatchmodeId = 0
  let hasAvailabilityChecked = 0
  let fullyEnriched = 0
  let partiallyEnriched = 0
  let neverChecked = 0
  let checkedButNotFound = 0

  for (const title of allData) {
    const poster = !!title.poster_url
    const sources = title.sources && Array.isArray(title.sources) && title.sources.length > 0
    const watchmodeId = !!title.watchmode_id
    const checked = !!title.availability_checked_at

    if (poster) hasPoster++
    if (sources) hasSources++
    if (watchmodeId) hasWatchmodeId++
    if (checked) hasAvailabilityChecked++

    if (poster && sources) {
      fullyEnriched++
    } else if (poster || sources || watchmodeId) {
      partiallyEnriched++
    } else if (checked) {
      // Was checked but nothing found
      checkedButNotFound++
    } else {
      // Never attempted enrichment
      neverChecked++
    }
  }

  console.log('Field counts:')
  console.log(`  With poster_url:             ${hasPoster}`)
  console.log(`  With sources (non-empty):    ${hasSources}`)
  console.log(`  With watchmode_id:           ${hasWatchmodeId}`)
  console.log(`  With availability_checked:   ${hasAvailabilityChecked}`)
  console.log('')
  console.log('Enrichment status:')
  console.log(`  ✅ Fully enriched (poster + sources): ${fullyEnriched}`)
  console.log(`  🔶 Partially enriched:                ${partiallyEnriched}`)
  console.log(`  ⚠️  Checked but not found:             ${checkedButNotFound}`)
  console.log(`  ❌ Never checked:                     ${neverChecked}`)
  console.log('')
  console.log('Titles that SHOULD be enriched (never checked, missing data):')

  // Find titles that have never been checked AND are missing both poster and sources
  const needsEnrichment = allData.filter(t => {
    const neverAttempted = !t.availability_checked_at && !t.watchmode_id
    const missingPoster = !t.poster_url
    const missingSources = !t.sources || !Array.isArray(t.sources) || t.sources.length === 0
    return neverAttempted && missingPoster && missingSources
  })

  console.log(`  ${needsEnrichment.length} titles need enrichment`)
  console.log('')
  console.log('Sample of titles needing enrichment:')
  needsEnrichment.slice(0, 10).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.title} (${t.year})`)
  })
}

checkStatus()

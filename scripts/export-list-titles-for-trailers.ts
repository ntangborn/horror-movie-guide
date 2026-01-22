/**
 * Export Script: Get titles featured in curated lists for trailer scraping
 *
 * This script finds all titles that appear in curated lists and exports
 * those that need trailers.
 *
 * Usage:
 *   npx tsx scripts/export-list-titles-for-trailers.ts              # Export list titles needing trailers
 *   npx tsx scripts/export-list-titles-for-trailers.ts --dry-run    # Preview without writing file
 *   npx tsx scripts/export-list-titles-for-trailers.ts --show-lists # Show which lists each title is in
 *
 * Output: ../trailer-finder/movies.json
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
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
  dryRun: boolean
  showLists: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    showLists: args.includes('--show-lists'),
  }
}

// Types
interface CuratedList {
  id: string
  title: string
  slug: string
  cards: string[]
  published: boolean
}

interface TitleInfo {
  id: string
  title: string
  year: number
  trailer_status: string | null
  trailer_youtube_id: string | null
  lists: string[] // Which lists this title appears in
}

interface TitleForExport {
  id: string
  title: string
  year: number
}

/**
 * Fetch all curated lists with their card IDs
 */
async function getAllLists(): Promise<CuratedList[]> {
  const { data, error } = await supabase
    .from('curated_lists')
    .select('id, title, slug, cards, published')
    .order('title')

  if (error) {
    console.error('Error fetching lists:', error.message)
    return []
  }

  return (data || []) as CuratedList[]
}

/**
 * Fetch title details for given IDs
 */
async function getTitleDetails(ids: string[]): Promise<Map<string, TitleInfo>> {
  const titleMap = new Map<string, TitleInfo>()

  // Fetch in batches of 500
  const batchSize = 500
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize)

    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, title, year, trailer_status, trailer_youtube_id')
      .in('id', batch)

    if (error) {
      console.error('Error fetching titles:', error.message)
      continue
    }

    for (const title of (data || [])) {
      titleMap.set(title.id, {
        ...title,
        lists: [],
      })
    }
  }

  return titleMap
}

/**
 * Main function
 */
async function main(args: Args) {
  console.log('🎬 Ghost Guide - Export List Titles for Trailers')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No file will be written\n')
  }

  // Step 1: Get all curated lists
  console.log('\n📋 Fetching curated lists...')
  const lists = await getAllLists()
  console.log(`   Found ${lists.length} lists`)

  // Step 2: Extract all unique card IDs and track which lists they're in
  const cardToLists = new Map<string, string[]>()

  for (const list of lists) {
    const cards = list.cards || []
    for (const cardId of cards) {
      if (!cardToLists.has(cardId)) {
        cardToLists.set(cardId, [])
      }
      cardToLists.get(cardId)!.push(list.title)
    }
  }

  const uniqueCardIds = Array.from(cardToLists.keys())
  console.log(`   Found ${uniqueCardIds.length} unique titles across all lists`)

  // Step 3: Fetch title details
  console.log('\n📊 Fetching title details...')
  const titleMap = await getTitleDetails(uniqueCardIds)
  console.log(`   Loaded ${titleMap.size} titles`)

  // Step 4: Add list associations
  for (const [cardId, listNames] of cardToLists) {
    const title = titleMap.get(cardId)
    if (title) {
      title.lists = listNames
    }
  }

  // Step 5: Filter to titles needing trailers
  // A title needs a trailer if it doesn't have a trailer_youtube_id
  // (status 'none' means scraper tried but failed - we should retry those)
  const titlesNeedingTrailers: TitleInfo[] = []
  const titlesWithTrailers: TitleInfo[] = []

  for (const title of titleMap.values()) {
    if (title.trailer_youtube_id) {
      titlesWithTrailers.push(title)
    } else {
      titlesNeedingTrailers.push(title)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55))
  console.log('📊 SUMMARY')
  console.log('='.repeat(55))
  console.log(`
   Total titles in lists:     ${titleMap.size}
   Already have trailers:     ${titlesWithTrailers.length}
   Need trailers:             ${titlesNeedingTrailers.length}
`)

  // Show list breakdown
  console.log('📋 Lists breakdown:')
  console.log('-'.repeat(55))
  for (const list of lists) {
    const cardCount = (list.cards || []).length
    const needTrailers = (list.cards || []).filter(id => {
      const t = titleMap.get(id)
      return t && !t.trailer_youtube_id
    }).length
    const status = list.published ? '✓' : '○'
    console.log(`   ${status} ${list.title.padEnd(35)} ${needTrailers}/${cardCount} need trailers`)
  }

  if (titlesNeedingTrailers.length === 0) {
    console.log('\n✅ All list titles already have trailers!')
    return
  }

  // Show titles needing trailers
  console.log('\n📝 Titles needing trailers:')
  console.log('-'.repeat(55))

  // Sort by number of list appearances (most important first)
  titlesNeedingTrailers.sort((a, b) => b.lists.length - a.lists.length)

  for (const title of titlesNeedingTrailers.slice(0, 30)) {
    console.log(`   ${title.title} (${title.year})`)
    if (args.showLists) {
      console.log(`      └─ In: ${title.lists.join(', ')}`)
    }
  }
  if (titlesNeedingTrailers.length > 30) {
    console.log(`   ... and ${titlesNeedingTrailers.length - 30} more`)
  }

  if (args.dryRun) {
    console.log('\n✨ Dry run complete. No file written.')
    return
  }

  // Export to file
  const exportData: TitleForExport[] = titlesNeedingTrailers.map(t => ({
    id: t.id,
    title: t.title,
    year: t.year,
  }))

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(exportData, null, 2))

  console.log(`\n✅ Exported ${exportData.length} titles to ${OUTPUT_PATH}`)
  console.log('\n📌 Next steps:')
  console.log('   1. cd ../trailer-finder')
  console.log('   2. node find-trailers.js')
  console.log('   3. npx tsx scripts/import-trailers.ts')
}

// Run
const args = parseArgs()
main(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

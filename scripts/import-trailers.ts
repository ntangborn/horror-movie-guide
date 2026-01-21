/**
 * Import Script: Import trailer data from scraper results
 *
 * This script imports trailer data from the trailer-finder output
 * and updates the database with trailer information, setting status to 'pending'.
 *
 * Usage:
 *   npx tsx scripts/import-trailers.ts              # Import from default location
 *   npx tsx scripts/import-trailers.ts --file path  # Import from specific file
 *   npx tsx scripts/import-trailers.ts --dry-run    # Preview without updating database
 *
 * Input: ../trailer-finder/trailers.json
 * Format: [{id, title, year, videoId, videoTitle, channelTitle, embedCode, youtubeUrl}, ...]
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

// Configuration
const DEFAULT_INPUT_PATH = path.resolve(__dirname, '../../trailer-finder/trailers.json')

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
  inputFile: string
  dryRun: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    inputFile: DEFAULT_INPUT_PATH,
    dryRun: false,
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      result.inputFile = path.resolve(args[i + 1])
      i++
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    }
  }

  return result
}

// Types
interface TrailerResult {
  id: string
  title: string
  year: number
  videoId: string | null
  videoTitle?: string
  channelTitle?: string
  embedCode: string | null
  youtubeUrl?: string
  error?: string
}

interface ImportStats {
  total: number
  found: number
  notFound: number
  updated: number
  errors: number
  skipped: number
}

/**
 * Update a title with trailer data
 */
async function updateTrailer(
  id: string,
  trailerData: TrailerResult
): Promise<boolean> {
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = {
    trailer_scraped_at: now,
    updated_at: now,
  }

  if (trailerData.videoId) {
    updates.trailer_youtube_id = trailerData.videoId
    updates.trailer_video_title = trailerData.videoTitle || null
    updates.trailer_channel = trailerData.channelTitle || null
    updates.trailer_embed_code = trailerData.embedCode || null
    updates.trailer_status = 'pending'
  } else {
    // No trailer found - mark as none so we don't retry
    updates.trailer_status = 'none'
  }

  const { error } = await supabase
    .from('availability_cards')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error(`   Failed to update ${id}:`, error.message)
    return false
  }

  return true
}

/**
 * Main import function
 */
async function importTrailers(args: Args) {
  console.log('🎬 Horror Movie Guide - Import Trailer Data')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No database updates will be made\n')
  }

  console.log(`\n📂 Input file: ${args.inputFile}\n`)

  // Check if input file exists
  if (!fs.existsSync(args.inputFile)) {
    console.error(`❌ Input file not found: ${args.inputFile}`)
    console.error('\n   Run the trailer scraper first:')
    console.error('   1. cd ../trailer-finder')
    console.error('   2. node find-trailers.js')
    process.exit(1)
  }

  // Read input file
  const trailers: TrailerResult[] = JSON.parse(fs.readFileSync(args.inputFile, 'utf8'))
  console.log(`📝 Found ${trailers.length} trailer results to import\n`)

  // Initialize stats
  const stats: ImportStats = {
    total: trailers.length,
    found: 0,
    notFound: 0,
    updated: 0,
    errors: 0,
    skipped: 0,
  }

  // Count found vs not found
  stats.found = trailers.filter(t => t.videoId).length
  stats.notFound = trailers.filter(t => !t.videoId).length

  console.log(`   Trailers found: ${stats.found}`)
  console.log(`   Not found: ${stats.notFound}\n`)

  if (args.dryRun) {
    console.log('📋 Preview of trailers to import:')
    console.log('-'.repeat(55))
    trailers.filter(t => t.videoId).slice(0, 10).forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.title} (${t.year})`)
      console.log(`      Video: "${t.videoTitle}"`)
      console.log(`      Channel: ${t.channelTitle}`)
    })
    if (stats.found > 10) {
      console.log(`   ... and ${stats.found - 10} more`)
    }
    console.log('\n✨ Dry run complete. No database updates made.')
    return
  }

  // Process each trailer result
  console.log('🚀 Importing trailers...\n')

  for (let i = 0; i < trailers.length; i++) {
    const trailer = trailers[i]

    // Skip if no ID (shouldn't happen but safety check)
    if (!trailer.id) {
      console.log(`   [${i + 1}/${trailers.length}] Skipping: ${trailer.title} (no ID)`)
      stats.skipped++
      continue
    }

    const status = trailer.videoId ? '✓' : '○'
    process.stdout.write(`\r   [${i + 1}/${trailers.length}] ${status} ${trailer.title.substring(0, 35).padEnd(35)}`)

    const success = await updateTrailer(trailer.id, trailer)
    if (success) {
      stats.updated++
    } else {
      stats.errors++
    }
  }

  // Final summary
  console.log('\n\n')
  console.log('='.repeat(55))
  console.log('📊 IMPORT COMPLETE')
  console.log('='.repeat(55))
  console.log(`
   Total processed:     ${stats.total}
   Trailers found:      ${stats.found}
   Not found:           ${stats.notFound}

   Database updated:    ${stats.updated}
   Errors:              ${stats.errors}
   Skipped:             ${stats.skipped}
`)

  console.log('📌 Next steps:')
  console.log('   1. Go to /admin/trailers to review pending trailers')
  console.log('   2. Approve or reject each trailer')
  console.log('   3. Approved trailers will show on movie detail pages')
}

// Run
const args = parseArgs()
importTrailers(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

/**
 * Import Deep Dive articles from scraper results
 *
 * Imports scraped articles into the deep_dive_urls JSONB field,
 * appending to existing entries and skipping duplicates.
 *
 * Usage:
 *   npx tsx scripts/import-deep-dive.ts --file articles.csv    # Import from CSV
 *   npx tsx scripts/import-deep-dive.ts --file articles.json   # Import from JSON
 *   npx tsx scripts/import-deep-dive.ts --file articles.csv --dry-run  # Preview only
 *
 * CSV Format: id (or imdb_id), url, headline, summary (optional)
 * JSON Format: [{id/imdb_id, url, headline, summary?}, ...]
 *
 * Mapping:
 *   - url → url
 *   - headline → label
 *   - summary → source (or defaults to "Deep Dive")
 *   - added_at → auto-generated timestamp
 */

import * as fs from 'fs'
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

interface Args {
  inputFile: string
  dryRun: boolean
  source: string
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  const result: Args = {
    inputFile: '',
    dryRun: false,
    source: 'Deep Dive',
  }

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--file' && args[i + 1]) {
      result.inputFile = path.resolve(args[i + 1])
      i++
    } else if (args[i] === '--dry-run') {
      result.dryRun = true
    } else if (args[i] === '--source' && args[i + 1]) {
      result.source = args[i + 1]
      i++
    }
  }

  return result
}

interface ArticleInput {
  id?: string
  imdb_id?: string
  movie?: string  // Title lookup
  url: string
  headline: string
  summary?: string
  source?: string  // Source from scraper
}

interface DeepDiveUrl {
  url: string
  label: string
  source: string
  added_at: string
}

interface ImportStats {
  total: number
  imported: number
  duplicates: number
  notFound: number
  errors: number
}

function parseCsv(content: string): ArticleInput[] {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []

  const header = lines[0].toLowerCase()
  const columns = parseCsvLine(header)

  // Find column indices
  const idIndex = columns.findIndex(c => c === 'id')
  const imdbIdIndex = columns.findIndex(c => c === 'imdb_id')
  const urlIndex = columns.findIndex(c => c === 'url')
  const headlineIndex = columns.findIndex(c => c === 'headline')
  const summaryIndex = columns.findIndex(c => c === 'summary')

  if (urlIndex === -1 || headlineIndex === -1) {
    throw new Error('CSV must have "url" and "headline" columns')
  }

  if (idIndex === -1 && imdbIdIndex === -1) {
    throw new Error('CSV must have either "id" or "imdb_id" column')
  }

  const articles: ArticleInput[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    if (values.length === 0) continue

    const article: ArticleInput = {
      url: values[urlIndex] || '',
      headline: values[headlineIndex] || '',
    }

    if (idIndex !== -1) article.id = values[idIndex]
    if (imdbIdIndex !== -1) article.imdb_id = values[imdbIdIndex]
    if (summaryIndex !== -1) article.summary = values[summaryIndex]

    if (article.url && article.headline && (article.id || article.imdb_id)) {
      articles.push(article)
    }
  }

  return articles
}

function parseCsvLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  values.push(current.trim())
  return values
}

function parseJson(content: string): ArticleInput[] {
  const data = JSON.parse(content)
  const articles = Array.isArray(data) ? data : [data]

  return articles.filter((a: any) =>
    a.url && a.headline && (a.id || a.imdb_id || a.movie)
  )
}

async function lookupByImdbId(imdbId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('id')
    .eq('imdb_id', imdbId)
    .single()

  if (error || !data) return null
  return data.id
}

// Cache for title lookups to avoid repeated queries
const titleCache = new Map<string, string | null>()

async function lookupByTitle(title: string): Promise<string | null> {
  // Check cache first
  if (titleCache.has(title)) {
    return titleCache.get(title) || null
  }

  // Exact match first
  const { data, error } = await supabase
    .from('availability_cards')
    .select('id')
    .eq('title', title)
    .limit(1)
    .single()

  if (!error && data) {
    titleCache.set(title, data.id)
    return data.id
  }

  // Try case-insensitive match
  const { data: iData } = await supabase
    .from('availability_cards')
    .select('id')
    .ilike('title', title)
    .limit(1)
    .single()

  if (iData) {
    titleCache.set(title, iData.id)
    return iData.id
  }

  titleCache.set(title, null)
  return null
}

async function getExistingDeepDiveUrls(id: string): Promise<DeepDiveUrl[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('deep_dive_urls')
    .eq('id', id)
    .single()

  if (error || !data) return []
  return data.deep_dive_urls || []
}

async function updateDeepDiveUrls(id: string, urls: DeepDiveUrl[]): Promise<boolean> {
  const { error } = await supabase
    .from('availability_cards')
    .update({
      deep_dive_urls: urls,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  return !error
}

async function importDeepDive(args: Args) {
  console.log('📰 Import Deep Dive Articles')
  console.log('='.repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No database updates will be made\n')
  }

  if (!args.inputFile) {
    console.error('❌ No input file specified. Use --file <path>')
    console.log('\nUsage:')
    console.log('  npx tsx scripts/import-deep-dive.ts --file articles.csv')
    console.log('  npx tsx scripts/import-deep-dive.ts --file articles.json --dry-run')
    process.exit(1)
  }

  console.log(`\n📂 Input file: ${args.inputFile}`)
  console.log(`   Source label: ${args.source}\n`)

  if (!fs.existsSync(args.inputFile)) {
    console.error(`❌ File not found: ${args.inputFile}`)
    process.exit(1)
  }

  const content = fs.readFileSync(args.inputFile, 'utf8')
  const isJson = args.inputFile.endsWith('.json')

  let articles: ArticleInput[]
  try {
    articles = isJson ? parseJson(content) : parseCsv(content)
  } catch (error) {
    console.error('❌ Failed to parse input file:', (error as Error).message)
    process.exit(1)
  }

  console.log(`📝 Found ${articles.length} articles to import\n`)

  if (articles.length === 0) {
    console.log('⚠️  No valid articles found in file')
    return
  }

  const stats: ImportStats = {
    total: articles.length,
    imported: 0,
    duplicates: 0,
    notFound: 0,
    errors: 0,
  }

  // Group articles by movie ID for batch processing
  const articlesByMovie = new Map<string, ArticleInput[]>()

  console.log('🔍 Looking up movies...')
  let lookupCount = 0

  for (const article of articles) {
    let movieId: string | null | undefined = article.id

    if (!movieId && article.imdb_id) {
      movieId = await lookupByImdbId(article.imdb_id)
    }

    if (!movieId && article.movie) {
      movieId = await lookupByTitle(article.movie)
      lookupCount++
      if (lookupCount % 100 === 0) {
        process.stdout.write(`\r   Looked up ${lookupCount} titles...`)
      }
    }

    if (!movieId) {
      stats.notFound++
      continue
    }

    if (!articlesByMovie.has(movieId)) {
      articlesByMovie.set(movieId, [])
    }
    articlesByMovie.get(movieId)!.push(article)
  }
  if (lookupCount > 0) console.log(`\r   Looked up ${lookupCount} titles    `)

  console.log(`   Movies to update: ${articlesByMovie.size}`)
  console.log('')

  // Preview
  if (args.dryRun) {
    console.log('📋 Preview of articles to import:')
    console.log('-'.repeat(55))

    let count = 0
    for (const [movieId, movieArticles] of articlesByMovie) {
      if (count >= 5) {
        console.log(`   ... and ${articlesByMovie.size - 5} more movies`)
        break
      }

      const existing = await getExistingDeepDiveUrls(movieId)
      const existingUrls = new Set(existing.map(e => e.url))

      for (const article of movieArticles) {
        const isDuplicate = existingUrls.has(article.url)
        const status = isDuplicate ? '(duplicate)' : ''
        console.log(`   ${article.headline.substring(0, 50)}... ${status}`)
        console.log(`      → ${article.url}`)
      }
      count++
    }

    console.log('\n✨ Dry run complete. No database updates made.')
    return
  }

  // Process each movie
  console.log('🚀 Importing articles...\n')

  let processed = 0
  for (const [movieId, movieArticles] of articlesByMovie) {
    processed++
    process.stdout.write(`\r   [${processed}/${articlesByMovie.size}] Processing...`)

    try {
      const existing = await getExistingDeepDiveUrls(movieId)
      const existingUrls = new Set(existing.map(e => e.url))

      const newUrls: DeepDiveUrl[] = []

      for (const article of movieArticles) {
        if (existingUrls.has(article.url)) {
          stats.duplicates++
          continue
        }

        newUrls.push({
          url: article.url,
          label: article.headline,
          source: article.source || article.summary || args.source,
          added_at: new Date().toISOString(),
        })
      }

      if (newUrls.length > 0) {
        const updatedUrls = [...existing, ...newUrls]
        const success = await updateDeepDiveUrls(movieId, updatedUrls)

        if (success) {
          stats.imported += newUrls.length
        } else {
          stats.errors += newUrls.length
        }
      }
    } catch (error) {
      stats.errors += movieArticles.length
    }
  }

  // Final summary
  console.log('\n\n')
  console.log('='.repeat(55))
  console.log('📊 IMPORT COMPLETE')
  console.log('='.repeat(55))
  console.log(`
   Total articles:       ${stats.total}
   Movies updated:       ${articlesByMovie.size}

   Imported:             ${stats.imported}
   Duplicates skipped:   ${stats.duplicates}
   Movie not found:      ${stats.notFound}
   Errors:               ${stats.errors}
`)

  console.log('📌 Next steps:')
  console.log('   1. Go to /admin/titles to review imported articles')
  console.log('   2. Click "Manual Enrich" > "Deep Dive URLs" tab')
  console.log('   3. Edit or delete individual entries as needed')
}

const args = parseArgs()
importDeepDive(args)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

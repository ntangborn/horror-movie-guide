import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

async function findDuplicates() {
  console.log('🔍 Finding duplicate IMDB IDs...\n')

  // Fetch ALL titles with pagination (Supabase defaults to 1000)
  const allData: any[] = []
  const pageSize = 1000
  let offset = 0
  let hasMore = true

  while (hasMore) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, imdb_id, title, year, created_at, poster_url, sources')
      .order('imdb_id')
      .order('created_at', { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      console.error('Error fetching titles:', error)
      return
    }

    if (data && data.length > 0) {
      allData.push(...data)
      offset += data.length
      hasMore = data.length === pageSize
    } else {
      hasMore = false
    }
  }

  const data = allData

  // Group by IMDB ID
  const grouped = new Map<string, typeof data>()
  for (const row of data) {
    const existing = grouped.get(row.imdb_id) || []
    existing.push(row)
    grouped.set(row.imdb_id, existing)
  }

  // Find duplicates
  const duplicates = Array.from(grouped.entries())
    .filter(([_, rows]) => rows.length > 1)
    .sort((a, b) => b[1].length - a[1].length)

  console.log('📊 Total unique IMDB IDs: ' + grouped.size)
  console.log('📊 Total titles in DB: ' + data.length)
  console.log('📊 IMDB IDs with duplicates: ' + duplicates.length)

  const totalDuplicateRows = duplicates.reduce((sum, [_, rows]) => sum + rows.length - 1, 0)
  console.log('📊 Total duplicate rows to remove: ' + totalDuplicateRows + '\n')

  if (duplicates.length === 0) {
    console.log('✨ No duplicates found!')
    return
  }

  console.log('Top 20 duplicated titles:')
  console.log('-'.repeat(70))

  for (const [imdbId, rows] of duplicates.slice(0, 20)) {
    console.log('\n' + rows[0].title + ' (' + rows[0].year + ') [' + imdbId + '] - ' + rows.length + ' copies')
    for (const row of rows) {
      const hasData = row.poster_url ? '✓poster' : '✗poster'
      const hasSources = row.sources?.length > 0 ? '✓' + row.sources.length + 'src' : '✗sources'
      const shortId = row.id.substring(0, 8)
      const createdDate = row.created_at?.substring(0, 10) || 'unknown'
      console.log('  - ' + shortId + '... created: ' + createdDate + ' ' + hasData + ' ' + hasSources)
    }
  }

  // Output IDs to delete (keep the one with most data, or oldest if equal)
  const idsToDelete: string[] = []

  for (const [_, rows] of duplicates) {
    // Sort: prefer ones with poster, then with sources, then oldest
    const sorted = [...rows].sort((a, b) => {
      const aScore = (a.poster_url ? 10 : 0) + (a.sources?.length || 0)
      const bScore = (b.poster_url ? 10 : 0) + (b.sources?.length || 0)
      if (bScore !== aScore) return bScore - aScore
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    })

    // Keep first (best), delete rest
    idsToDelete.push(...sorted.slice(1).map(r => r.id))
  }

  console.log('\n\n📝 Would delete ' + idsToDelete.length + ' duplicate rows')
  console.log('\nRun with --delete flag to actually remove duplicates')

  // Check for --delete flag
  if (process.argv.includes('--delete')) {
    console.log('\n🗑️  Deleting duplicates...')

    // Delete in batches
    const batchSize = 100
    let deleted = 0

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize)
      const { error: deleteError } = await supabase
        .from('availability_cards')
        .delete()
        .in('id', batch)

      if (deleteError) {
        console.error('Delete error:', deleteError)
      } else {
        deleted += batch.length
        console.log('  Deleted ' + deleted + '/' + idsToDelete.length)
      }
    }

    console.log('\n✅ Deleted ' + deleted + ' duplicate rows')
  }
}

findDuplicates()

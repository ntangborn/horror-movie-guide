/**
 * Create a Binge List from movie titles
 */

import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// List metadata
const LIST_TITLE = '70s Pessimism – Everything Is Brown and Doomed'
const LIST_SLUG = '70s-pessimism'
const LIST_DESCRIPTION = 'Earth tones, cigarette smoke, institutions failing, hope dying. The decade when American cinema stopped believing in happy endings.'

// Movies to find
const movies = [
  { title: 'The Texas Chain Saw Massacre', year: 1974 },
  { title: 'Chinatown', year: 1974 },
  { title: 'The Parallax View', year: 1974 },
  { title: 'The Conversation', year: 1974 },
  { title: 'Night Moves', year: 1975 },
  { title: 'The Wicker Man', year: 1973 },
  { title: 'Don\'t Look Now', year: 1973 },
  { title: 'Sorcerer', year: 1977 },
  { title: 'Invasion of the Body Snatchers', year: 1978 },
  { title: 'The Omen', year: 1976 },
  { title: 'Carrie', year: 1976 },
  { title: 'Last House on the Left', year: 1972 },
  { title: 'I Spit on Your Grave', year: 1978 },
  { title: 'Race with the Devil', year: 1975 },
  { title: 'The Hills Have Eyes', year: 1977 },
]

interface CardResult {
  id: string
  title: string
  year: number
  poster_url: string | null
}

async function findMovies(): Promise<CardResult[]> {
  const results: CardResult[] = []

  console.log('🔍 Looking up movies in database...\n')

  for (const movie of movies) {
    // Try exact title + year first
    let { data } = await supabase
      .from('availability_cards')
      .select('id, title, year, poster_url')
      .ilike('title', movie.title)
      .eq('year', movie.year)
      .limit(1)

    // If not found, try partial title match with year
    if (!data || data.length === 0) {
      const res = await supabase
        .from('availability_cards')
        .select('id, title, year, poster_url')
        .ilike('title', `%${movie.title}%`)
        .eq('year', movie.year)
        .limit(1)
      data = res.data
    }

    // If still not found, try just partial title
    if (!data || data.length === 0) {
      const res = await supabase
        .from('availability_cards')
        .select('id, title, year, poster_url')
        .ilike('title', `%${movie.title}%`)
        .limit(3)
      data = res.data
    }

    if (data && data.length > 0) {
      console.log(`✓ ${movie.title} (${movie.year}) -> ${data[0].title} (${data[0].year})`)
      results.push(data[0])
    } else {
      console.log(`✗ ${movie.title} (${movie.year}) -> NOT FOUND`)
    }
  }

  return results
}

async function createList(cardResults: CardResult[]): Promise<void> {
  if (cardResults.length === 0) {
    console.log('\n❌ No movies found, cannot create list')
    return
  }

  const cardIds = cardResults.map(c => c.id)
  const coverImage = cardResults[0]?.poster_url || null

  console.log(`\n📋 Creating list: ${LIST_TITLE}`)
  console.log(`   Slug: ${LIST_SLUG}`)
  console.log(`   Movies: ${cardIds.length}`)
  console.log(`   Cover: ${cardResults[0]?.title || 'none'}`)

  const now = new Date().toISOString()

  const { error } = await supabase
    .from('curated_lists')
    .upsert({
      title: LIST_TITLE,
      slug: LIST_SLUG,
      description: LIST_DESCRIPTION,
      cover_image: coverImage,
      cards: cardIds,
      type: 'editorial',
      author: 'Editorial Team',
      featured: false,
      published: true,
      published_at: now,
      updated_at: now,
    }, {
      onConflict: 'slug',
    })

  if (error) {
    console.error(`\n❌ Error creating list: ${error.message}`)
    return
  }

  console.log(`\n✅ List created successfully!`)
  console.log(`   View at: /binge/${LIST_SLUG}`)
}

async function main() {
  console.log('🎬 Create Binge List: ' + LIST_TITLE)
  console.log('='.repeat(55) + '\n')

  const results = await findMovies()

  console.log(`\n--- Found ${results.length}/${movies.length} movies ---`)

  await createList(results)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

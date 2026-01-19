/**
 * Seed Script: Create Initial Curated Lists
 *
 * This script creates curated lists by querying for titles
 * matching various criteria and linking them together.
 *
 * Usage:
 *   npm run seed:lists
 *   npm run seed:lists -- --dry-run    # Preview without creating
 *   npm run seed:lists -- --clear      # Delete existing lists first
 */

import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

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
  clear: boolean
}

function parseArgs(): Args {
  const args = process.argv.slice(2)
  return {
    dryRun: args.includes('--dry-run'),
    clear: args.includes('--clear'),
  }
}

// Types
interface ListDefinition {
  title: string
  slug: string
  description: string
  type: 'editorial' | 'user-watchlist' | 'user-custom'
  author: string
  featured: boolean
  query: () => Promise<string[]> // Returns array of card UUIDs
}

interface CardResult {
  id: string
  title: string
  year: number
  poster_url: string | null
  imdb_rating: number | null
}

/**
 * Helper: Query cards by various criteria
 */
async function queryCardsByYearRange(
  minYear: number,
  maxYear: number,
  limit: number,
  orderBy: 'imdb_rating' | 'year' | 'title' = 'imdb_rating'
): Promise<CardResult[]> {
  let query = supabase
    .from('availability_cards')
    .select('id, title, year, poster_url, imdb_rating')
    .gte('year', minYear)
    .lte('year', maxYear)

  if (orderBy === 'imdb_rating') {
    query = query.order('imdb_rating', { ascending: false, nullsFirst: false })
  } else if (orderBy === 'year') {
    query = query.order('year', { ascending: false })
  } else {
    query = query.order('title', { ascending: true })
  }

  const { data, error } = await query.limit(limit)

  if (error) {
    console.error('Query error:', error.message)
    return []
  }

  return data || []
}

/**
 * Helper: Query cards by title search (ilike)
 */
async function queryCardsByTitleSearch(
  searchTerms: string[],
  limit: number = 20
): Promise<CardResult[]> {
  const allResults: CardResult[] = []
  const seenIds = new Set<string>()

  for (const term of searchTerms) {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('id, title, year, poster_url, imdb_rating')
      .ilike('title', `%${term}%`)
      .order('imdb_rating', { ascending: false, nullsFirst: false })
      .limit(limit)

    if (error) {
      console.error(`Query error for "${term}":`, error.message)
      continue
    }

    for (const card of data || []) {
      if (!seenIds.has(card.id)) {
        seenIds.add(card.id)
        allResults.push(card)
      }
    }
  }

  return allResults
}

/**
 * Helper: Query cards by director
 */
async function queryCardsByDirector(
  director: string,
  limit: number = 20
): Promise<CardResult[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('id, title, year, poster_url, imdb_rating')
    .ilike('director', `%${director}%`)
    .order('year', { ascending: true })
    .limit(limit)

  if (error) {
    console.error(`Query error for director "${director}":`, error.message)
    return []
  }

  return data || []
}

/**
 * Helper: Query recent highly-rated titles
 */
async function queryRecentHighlyRated(
  minYear: number,
  minRating: number,
  limit: number
): Promise<CardResult[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('id, title, year, poster_url, imdb_rating')
    .gte('year', minYear)
    .gte('imdb_rating', minRating)
    .order('imdb_rating', { ascending: false, nullsFirst: false })
    .limit(limit)

  if (error) {
    console.error('Query error:', error.message)
    return []
  }

  return data || []
}

/**
 * Helper: Query recently added titles
 */
async function queryRecentlyAdded(limit: number): Promise<CardResult[]> {
  const { data, error } = await supabase
    .from('availability_cards')
    .select('id, title, year, poster_url, imdb_rating')
    .not('sources', 'eq', '[]')
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Query error:', error.message)
    return []
  }

  return data || []
}

/**
 * List Definitions
 */
const LIST_DEFINITIONS: ListDefinition[] = [
  // 1. Staff Picks: January 2026
  {
    title: 'Staff Picks: January 2026',
    slug: 'staff-picks-january-2026',
    description: 'Our editors\' top horror picks to kick off the new year. From atmospheric slow-burns to pulse-pounding thrills.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: true, // First list - featured
    query: async () => {
      // Highly-rated recent horror (2020+, rating 6.5+)
      const cards = await queryRecentHighlyRated(2020, 6.5, 10)
      return cards.map(c => c.id)
    },
  },

  // 2. 80s Horror Essentials
  {
    title: '80s Horror Essentials',
    slug: '80s-horror-essentials',
    description: 'The definitive collection of 1980s horror. Slashers, creature features, and the birth of modern horror icons.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: true, // Second list - featured
    query: async () => {
      // Well-known 1980s titles by rating
      const cards = await queryCardsByYearRange(1980, 1989, 15, 'imdb_rating')
      return cards.map(c => c.id)
    },
  },

  // 3. Cosmic Horror Collection
  {
    title: 'Cosmic Horror Collection',
    slug: 'cosmic-horror-collection',
    description: 'Lovecraftian nightmares and existential dread. Films that explore the terror of the unknown and humanity\'s insignificance in the cosmos.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // Search for cosmic/Lovecraft related titles
      const searchTerms = [
        'Lovecraft',
        'Cthulhu',
        'Necronomicon',
        'Color Out of Space',
        'Re-Animator',
        'From Beyond',
        'Dagon',
        'The Void',
        'In the Mouth of Madness',
        'Event Horizon',
        'Annihilation',
        'The Mist',
        'The Thing',
        'Underwater',
        'Sphere',
      ]
      const cards = await queryCardsByTitleSearch(searchTerms, 10)
      return cards.slice(0, 10).map(c => c.id)
    },
  },

  // 4. VHS-Era Gems
  {
    title: 'VHS-Era Gems',
    slug: 'vhs-era-gems',
    description: 'Hidden treasures from the golden age of video rental. Discover the cult classics that defined a generation of horror fans.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // 1980-1995 titles
      const cards = await queryCardsByYearRange(1980, 1995, 12, 'imdb_rating')
      return cards.map(c => c.id)
    },
  },

  // 5. Hammer Horror Movies: Frankenstein
  {
    title: 'Hammer Horror: Frankenstein',
    slug: 'hammer-horror-frankenstein',
    description: 'The legendary Hammer Films Frankenstein series. Peter Cushing\'s iconic portrayal of Baron Frankenstein across decades of Gothic horror.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // Search for Hammer Frankenstein titles
      const searchTerms = [
        'Curse of Frankenstein',
        'Revenge of Frankenstein',
        'Evil of Frankenstein',
        'Frankenstein Created Woman',
        'Frankenstein Must Be Destroyed',
        'Horror of Frankenstein',
        'Frankenstein and the Monster',
        'Frankenstein',
      ]
      const cards = await queryCardsByTitleSearch(searchTerms, 15)
      // Filter to likely Hammer titles (1957-1974 era)
      const hammerEra = cards.filter(c => c.year >= 1957 && c.year <= 1980)
      return hammerEra.slice(0, 10).map(c => c.id)
    },
  },

  // 6. Hammer Horror Movies: Dracula and Vampires
  {
    title: 'Hammer Horror: Dracula & Vampires',
    slug: 'hammer-horror-dracula-vampires',
    description: 'Christopher Lee\'s immortal Dracula and Hammer\'s vampire legacy. Gothic romance, bloody fangs, and British horror at its finest.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // Search for Hammer Dracula/vampire titles
      const searchTerms = [
        'Horror of Dracula',
        'Dracula: Prince of Darkness',
        'Dracula Has Risen',
        'Taste the Blood of Dracula',
        'Scars of Dracula',
        'Dracula A.D.',
        'Satanic Rites of Dracula',
        'Brides of Dracula',
        'Kiss of the Vampire',
        'Vampire Circus',
        'Twins of Evil',
        'Vampire Lovers',
        'Countess Dracula',
        'Captain Kronos',
        'Legend of the 7 Golden Vampires',
      ]
      const cards = await queryCardsByTitleSearch(searchTerms, 20)
      // Filter to Hammer era
      const hammerEra = cards.filter(c => c.year >= 1958 && c.year <= 1980)
      return hammerEra.slice(0, 12).map(c => c.id)
    },
  },

  // 7. Films of Alex de la Iglesia
  {
    title: 'Films of Alex de la Iglesia',
    slug: 'films-alex-de-la-iglesia',
    description: 'The wild, satirical, and darkly comic world of Spanish director Alex de la Iglesia. From action-horror to surreal nightmares.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // Query by director
      let cards = await queryCardsByDirector('Alex de la Iglesia', 20)

      // If no results by director, try title search for known films
      if (cards.length === 0) {
        const knownFilms = [
          'Acción mutante',
          'Day of the Beast',
          'Perdita Durango',
          'Dying of Laughter',
          'Common Wealth',
          '800 Bullets',
          'Crimen ferpecto',
          'The Oxford Murders',
          'The Last Circus',
          'Witching and Bitching',
          'My Big Night',
          'The Bar',
          'Perfectos desconocidos',
          'Veneciafrenia',
          '30 Coins',
          'El día de la bestia',
        ]
        cards = await queryCardsByTitleSearch(knownFilms, 20)
      }

      return cards.slice(0, 16).map(c => c.id)
    },
  },

  // 8. New to Streaming This Month
  {
    title: 'New to Streaming This Month',
    slug: 'new-to-streaming',
    description: 'Fresh arrivals on your favorite streaming platforms. Updated regularly with the latest horror and thriller additions.',
    type: 'editorial',
    author: 'Editorial Team',
    featured: false,
    query: async () => {
      // Recently updated titles with streaming sources
      const cards = await queryRecentlyAdded(20)
      return cards.map(c => c.id)
    },
  },
]

/**
 * Create a curated list
 */
async function createList(
  definition: ListDefinition,
  dryRun: boolean
): Promise<{ success: boolean; cardCount: number; coverImage: string | null }> {
  console.log(`\n📋 ${definition.title}`)
  console.log(`   Slug: ${definition.slug}`)

  // Get card IDs from query
  const cardIds = await definition.query()
  console.log(`   Found ${cardIds.length} matching titles`)

  if (cardIds.length === 0) {
    console.log('   ⚠️  No titles found, skipping list')
    return { success: false, cardCount: 0, coverImage: null }
  }

  // Get cover image from first card
  let coverImage: string | null = null
  if (cardIds.length > 0) {
    const { data: firstCard } = await supabase
      .from('availability_cards')
      .select('poster_url, title')
      .eq('id', cardIds[0])
      .single()

    if (firstCard?.poster_url) {
      coverImage = firstCard.poster_url
      console.log(`   Cover: ${firstCard.title}`)
    }
  }

  if (dryRun) {
    console.log('   [DRY RUN] Would create list')
    return { success: true, cardCount: cardIds.length, coverImage }
  }

  // Create the list
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('curated_lists')
    .upsert({
      title: definition.title,
      slug: definition.slug,
      description: definition.description,
      cover_image: coverImage,
      cards: cardIds,
      type: definition.type,
      author: definition.author,
      featured: definition.featured,
      published: true,
      published_at: now,
      updated_at: now,
    }, {
      onConflict: 'slug',
    })

  if (error) {
    console.error(`   ❌ Error creating list: ${error.message}`)
    return { success: false, cardCount: 0, coverImage: null }
  }

  console.log(`   ✅ Created with ${cardIds.length} titles${definition.featured ? ' (Featured)' : ''}`)
  return { success: true, cardCount: cardIds.length, coverImage }
}

/**
 * Clear existing lists
 */
async function clearLists(): Promise<void> {
  console.log('\n🗑️  Clearing existing editorial lists...')

  const { error } = await supabase
    .from('curated_lists')
    .delete()
    .eq('type', 'editorial')

  if (error) {
    console.error('Error clearing lists:', error.message)
  } else {
    console.log('   Done')
  }
}

/**
 * Main seed function
 */
async function seedLists(): Promise<void> {
  const args = parseArgs()

  console.log('🎬 Horror Movie Guide - Curated Lists Seed Script')
  console.log('=' .repeat(55))

  if (args.dryRun) {
    console.log('\n🔍 DRY RUN MODE - No changes will be made')
  }

  if (args.clear && !args.dryRun) {
    await clearLists()
  }

  console.log(`\n📝 Creating ${LIST_DEFINITIONS.length} curated lists...`)

  let successCount = 0
  let totalCards = 0

  for (const definition of LIST_DEFINITIONS) {
    const result = await createList(definition, args.dryRun)
    if (result.success) {
      successCount++
      totalCards += result.cardCount
    }
  }

  // Summary
  console.log('\n' + '='.repeat(55))
  console.log('📊 SEED COMPLETE')
  console.log('='.repeat(55))
  console.log(`\n  Lists created:    ${successCount}/${LIST_DEFINITIONS.length}`)
  console.log(`  Total titles:     ${totalCards}`)
  console.log(`  Featured lists:   ${LIST_DEFINITIONS.filter(d => d.featured).length}`)

  if (args.dryRun) {
    console.log('\n  ℹ️  Run without --dry-run to create lists')
  }
}

// Run
seedLists()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

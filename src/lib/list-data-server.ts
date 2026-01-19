/**
 * List Data - Server-side Supabase Fetcher
 *
 * This file should ONLY be imported in Server Components.
 * For client components, use list-data.ts instead.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { AvailabilityCard, CuratedList } from '@/types'

/**
 * Create a simple Supabase client for static generation (no cookies needed)
 */
function createStaticClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )
}

/**
 * Create a Supabase client for server components (with cookies)
 */
async function createRequestClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}

/**
 * List with cards interface
 */
export interface ListWithCards {
  list: CuratedList
  cards: AvailabilityCard[]
}

/**
 * Get a list by its slug (server-side)
 */
export async function getListBySlugServer(slug: string): Promise<CuratedList | null> {
  const supabase = await createRequestClient()
  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching list:', error.message)
    return null
  }

  return data as CuratedList
}

/**
 * Get cards by their UUIDs (server-side)
 */
export async function getCardsByIdsServer(cardIds: string[]): Promise<AvailabilityCard[]> {
  if (!cardIds || cardIds.length === 0) return []

  const supabase = await createRequestClient()
  const { data, error } = await supabase
    .from('availability_cards')
    .select('*')
    .in('id', cardIds)

  if (error) {
    console.error('Error fetching cards:', error.message)
    return []
  }

  // Maintain the order from cardIds
  const cardMap = new Map((data || []).map(card => [card.id, card]))
  return cardIds
    .map(id => cardMap.get(id))
    .filter((card): card is AvailabilityCard => card !== undefined)
}

/**
 * Get list with cards by slug (server-side)
 */
export async function getListWithCardsServer(slug: string): Promise<ListWithCards | null> {
  const list = await getListBySlugServer(slug)
  if (!list) return null

  const cards = await getCardsByIdsServer(list.cards as string[])

  return {
    list,
    cards,
  }
}

/**
 * Get featured lists (server-side) - uses static client for generateStaticParams
 */
export async function getFeaturedListsServer(): Promise<CuratedList[]> {
  const supabase = createStaticClient()
  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('featured', true)
    .eq('published', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching featured lists:', error.message)
    return []
  }

  return (data || []) as CuratedList[]
}

/**
 * Get all featured list slugs for static generation (server-side)
 */
export async function getFeaturedListSlugsServer(): Promise<string[]> {
  const lists = await getFeaturedListsServer()
  return lists.map(list => list.slug)
}

/**
 * Get related lists (server-side)
 */
export async function getRelatedListsServer(currentSlug: string, limit: number = 3): Promise<CuratedList[]> {
  const supabase = await createRequestClient()
  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('type', 'editorial')
    .eq('published', true)
    .neq('slug', currentSlug)
    .order('featured', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching related lists:', error.message)
    return []
  }

  return (data || []) as CuratedList[]
}

/**
 * Get total runtime for cards
 */
export function getListTotalRuntime(cards: AvailabilityCard[]): number {
  return cards.reduce((total, card) => total + (card.runtime_minutes || 0), 0)
}

/**
 * Format runtime as hours and minutes
 */
export function formatTotalRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

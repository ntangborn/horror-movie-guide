/**
 * List Data - Client-side Supabase Fetcher
 *
 * Fetches curated lists and their cards from Supabase.
 * For use in Client Components ('use client').
 *
 * For Server Components, use list-data-server.ts instead.
 */

import { supabase } from './supabase'
import type { AvailabilityCard, CuratedList } from '@/types'

/**
 * Get a list by its slug
 */
export async function getListBySlug(slug: string): Promise<CuratedList | null> {
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
 * Get cards by their UUIDs
 */
export async function getCardsByIds(cardIds: string[]): Promise<AvailabilityCard[]> {
  if (!cardIds || cardIds.length === 0) return []

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
 * List with cards interface
 */
export interface ListWithCards {
  list: CuratedList
  cards: AvailabilityCard[]
}

/**
 * Get list with cards by slug
 */
export async function getListWithCards(slug: string): Promise<ListWithCards | null> {
  const list = await getListBySlug(slug)
  if (!list) return null

  const cards = await getCardsByIds(list.cards as string[])

  return {
    list,
    cards,
  }
}

/**
 * Get all published editorial lists
 */
export async function getEditorialLists(): Promise<CuratedList[]> {
  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('type', 'editorial')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching editorial lists:', error.message)
    return []
  }

  return (data || []) as CuratedList[]
}

/**
 * Get featured lists
 */
export async function getFeaturedLists(): Promise<CuratedList[]> {
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
 * Get all featured list slugs
 */
export async function getFeaturedListSlugs(): Promise<string[]> {
  const lists = await getFeaturedLists()
  return lists.map(list => list.slug)
}

/**
 * Get related lists (excluding current)
 */
export async function getRelatedLists(currentSlug: string, limit: number = 3): Promise<CuratedList[]> {
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
 * Binge row interface
 */
export interface BingeRow {
  list: CuratedList
  cards: AvailabilityCard[]
}

/**
 * Get binge rows for display
 */
export async function getBingeRows(filter: 'all' | 'editorial' | 'my-lists' = 'all'): Promise<BingeRow[]> {
  let query = supabase
    .from('curated_lists')
    .select('*')
    .eq('published', true)

  if (filter === 'editorial') {
    query = query.eq('type', 'editorial')
  } else if (filter === 'my-lists') {
    query = query.in('type', ['user-watchlist', 'user-custom'])
  }

  query = query
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })

  const { data: lists, error } = await query

  if (error) {
    console.error('Error fetching binge rows:', error.message)
    return []
  }

  // Fetch cards for each list
  const rows: BingeRow[] = []
  for (const list of (lists || [])) {
    const cards = await getCardsByIds(list.cards as string[])
    rows.push({ list: list as CuratedList, cards })
  }

  return rows
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

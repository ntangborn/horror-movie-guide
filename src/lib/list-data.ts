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
 * Uses API route to fetch data server-side
 */
export async function getEditorialLists(): Promise<CuratedList[]> {
  try {
    const response = await fetch('/api/binge?type=editorial-lists')

    if (!response.ok) {
      console.error('Error fetching editorial lists:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.lists || []
  } catch (error) {
    console.error('Error fetching editorial lists:', error)
    return []
  }
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
 * Get recently updated/created lists for Home page
 */
export async function getRecentLists(limit: number = 4): Promise<CuratedList[]> {
  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('published', true)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching recent lists:', error.message)
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
 * Uses API route to fetch data server-side (bypasses RLS issues)
 */
export async function getBingeRows(filter: 'all' | 'editorial' | 'my-lists' = 'all'): Promise<BingeRow[]> {
  try {
    const response = await fetch(`/api/binge?filter=${filter}`)

    if (!response.ok) {
      console.error('Error fetching binge rows:', response.statusText)
      return []
    }

    const data = await response.json()
    return data.rows || []
  } catch (error) {
    console.error('Error fetching binge rows:', error)
    return []
  }
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

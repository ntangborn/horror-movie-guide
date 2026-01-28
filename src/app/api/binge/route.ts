import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { AvailabilityCard, CuratedList } from '@/types'

/**
 * Service client for database operations
 */
function createDbClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

export interface BingeRow {
  list: CuratedList
  cards: AvailabilityCard[]
}

/**
 * GET /api/binge?type=editorial-lists
 * Get just editorial lists (for modal, etc.)
 */
async function getEditorialListsOnly() {
  const supabase = createDbClient()

  const { data, error } = await supabase
    .from('curated_lists')
    .select('*')
    .eq('type', 'editorial')
    .eq('published', true)
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching editorial lists:', error)
    return NextResponse.json(
      { error: 'Failed to fetch editorial lists' },
      { status: 500 }
    )
  }

  const response = NextResponse.json({ lists: data || [] })
  response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')
  return response
}

/**
 * GET /api/binge
 * Get binge rows (curated lists with their cards)
 *
 * Query params:
 * - filter: 'all' | 'editorial' | 'my-lists' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createDbClient()
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const type = searchParams.get('type')

    // Handle editorial-lists-only request
    if (type === 'editorial-lists') {
      return getEditorialListsOnly()
    }

    // Build query for curated lists
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

    const { data: lists, error: listsError } = await query

    if (listsError) {
      console.error('Error fetching binge lists:', listsError)
      return NextResponse.json(
        { error: 'Failed to fetch lists', details: listsError.message },
        { status: 500 }
      )
    }

    if (!lists || lists.length === 0) {
      return NextResponse.json({ rows: [] })
    }

    // Collect all unique card IDs from all lists
    const allCardIds = new Set<string>()
    lists.forEach((list: any) => {
      if (Array.isArray(list.cards)) {
        list.cards.forEach((id: string) => allCardIds.add(id))
      }
    })

    // Fetch all cards in one query
    let cardsMap = new Map<string, AvailabilityCard>()
    if (allCardIds.size > 0) {
      const { data: cards, error: cardsError } = await supabase
        .from('availability_cards')
        .select('*')
        .in('id', Array.from(allCardIds))

      if (cardsError) {
        console.error('Error fetching cards:', cardsError)
      } else if (cards) {
        cards.forEach((card: AvailabilityCard) => {
          cardsMap.set(card.id, card)
        })
      }
    }

    // Build binge rows
    const rows: BingeRow[] = lists.map((list: any) => {
      const listCards = Array.isArray(list.cards)
        ? list.cards
            .map((id: string) => cardsMap.get(id))
            .filter((card: AvailabilityCard | undefined): card is AvailabilityCard => card !== undefined)
        : []

      return {
        list: list as CuratedList,
        cards: listCards,
      }
    })

    const response = NextResponse.json({ rows })

    // Cache for 1 minute, stale-while-revalidate for 5 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error('Binge GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

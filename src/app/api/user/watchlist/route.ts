import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Create authenticated Supabase client for API routes
 */
async function createApiClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors
          }
        },
      },
    }
  )
}

/**
 * GET /api/user/watchlist
 * Get all watchlist items for the current user
 */
export async function GET() {
  try {
    const supabase = await createApiClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get watchlist items with card data - only select needed columns
    const { data: items, error } = await supabase
      .from('user_list_items')
      .select(`
        id,
        card_id,
        added_at,
        position,
        availability_cards (
          id,
          title,
          year,
          poster_url,
          imdb_rating,
          runtime_minutes,
          sources,
          genres,
          mpaa_rating,
          synopsis
        )
      `)
      .eq('user_id', user.id)
      .eq('list_type', 'watchlist')
      .order('position', { ascending: true, nullsFirst: false })
      .order('added_at', { ascending: false })

    if (error) {
      console.error('Error fetching watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      )
    }

    // Transform to include card data at top level
    const watchlist = items.map((item: any) => ({
      id: item.id,
      cardId: item.card_id,
      addedAt: item.added_at,
      position: item.position,
      card: item.availability_cards,
    }))

    const response = NextResponse.json({ watchlist })

    // Private cache - user-specific data
    response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')

    return response
  } catch (error) {
    console.error('Watchlist GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/watchlist
 * Add a card to the user's watchlist
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cardId } = body

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      )
    }

    // Get current max position
    const { data: maxPosData } = await supabase
      .from('user_list_items')
      .select('position')
      .eq('user_id', user.id)
      .eq('list_type', 'watchlist')
      .order('position', { ascending: false, nullsFirst: false })
      .limit(1)
      .single()

    const nextPosition = (maxPosData?.position ?? -1) + 1

    // Insert into user_list_items
    const { data, error } = await supabase
      .from('user_list_items')
      .insert({
        user_id: user.id,
        card_id: cardId,
        list_type: 'watchlist',
        position: nextPosition,
      })
      .select()
      .single()

    if (error) {
      // Handle duplicate
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Already in watchlist' },
          { status: 409 }
        )
      }
      console.error('Error adding to watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to add to watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ item: data }, { status: 201 })
  } catch (error) {
    console.error('Watchlist POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/watchlist
 * Remove a card from the user's watchlist
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createApiClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const cardId = searchParams.get('cardId')

    if (!cardId) {
      return NextResponse.json(
        { error: 'cardId is required' },
        { status: 400 }
      )
    }

    // Delete from user_list_items
    const { error } = await supabase
      .from('user_list_items')
      .delete()
      .eq('user_id', user.id)
      .eq('card_id', cardId)
      .eq('list_type', 'watchlist')

    if (error) {
      console.error('Error removing from watchlist:', error)
      return NextResponse.json(
        { error: 'Failed to remove from watchlist' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watchlist DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/user/watchlist
 * Reorder watchlist items
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createApiClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { items } = body // Array of { cardId, position }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'items array is required' },
        { status: 400 }
      )
    }

    // Update positions for each item
    const updates = items.map(({ cardId, position }: { cardId: string; position: number }) =>
      supabase
        .from('user_list_items')
        .update({ position })
        .eq('user_id', user.id)
        .eq('card_id', cardId)
        .eq('list_type', 'watchlist')
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Watchlist PATCH error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

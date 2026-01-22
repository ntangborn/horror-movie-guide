import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Service client for database operations
 */
function createDbClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

/**
 * GET /api/community/lists/[slug]
 * Get a single shared list with full card data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      )
    }

    const supabase = createDbClient()

    // Get the shared list
    const { data: list, error: listError } = await supabase
      .from('shared_lists')
      .select(`
        id,
        name,
        slug,
        description,
        card_ids,
        header_image_url,
        card_count,
        is_public,
        created_at,
        updated_at,
        user_id,
        users (
          email
        )
      `)
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (listError || !list) {
      return NextResponse.json(
        { error: 'List not found' },
        { status: 404 }
      )
    }

    // Get the full card data for all cards in the list
    const { data: cards, error: cardsError } = await supabase
      .from('availability_cards')
      .select(`
        id,
        title,
        year,
        poster_url,
        imdb_rating,
        runtime_minutes,
        sources,
        genres,
        mpaa_rating,
        synopsis,
        backdrop_url
      `)
      .in('id', list.card_ids || [])

    if (cardsError) {
      console.error('Error fetching cards:', cardsError)
    }

    // Sort cards to match the order in card_ids
    const cardMap = new Map((cards || []).map((card: any) => [card.id, card]))
    const orderedCards = (list.card_ids || [])
      .map((id: string) => cardMap.get(id))
      .filter(Boolean)

    // Transform response
    const response = NextResponse.json({
      list: {
        id: list.id,
        name: list.name,
        slug: list.slug,
        description: list.description,
        header_image_url: list.header_image_url,
        card_count: list.card_count,
        is_public: list.is_public,
        created_at: list.created_at,
        updated_at: list.updated_at,
        user_id: list.user_id,
        user_email: (list as any).users?.email || 'Anonymous',
        cards: orderedCards,
      },
    })

    // Public cache
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error('Community list GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

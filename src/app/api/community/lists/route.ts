import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
 * GET /api/community/lists
 * Get all public shared lists
 */
export async function GET() {
  try {
    const supabase = createDbClient()

    // Get all public shared lists with user email
    const { data: lists, error } = await supabase
      .from('shared_lists')
      .select(`
        id,
        name,
        slug,
        description,
        header_image_url,
        card_count,
        created_at,
        user_id,
        users (
          email
        )
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching community lists:', error)
      return NextResponse.json(
        { error: 'Failed to fetch community lists' },
        { status: 500 }
      )
    }

    // Transform to include user_email at top level
    const transformedLists = lists.map((list: any) => ({
      id: list.id,
      name: list.name,
      slug: list.slug,
      description: list.description,
      header_image_url: list.header_image_url,
      card_count: list.card_count,
      created_at: list.created_at,
      user_id: list.user_id,
      user_email: list.users?.email || 'Anonymous',
    }))

    const response = NextResponse.json({ lists: transformedLists })

    // Public cache for community lists
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300')

    return response
  } catch (error) {
    console.error('Community lists GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

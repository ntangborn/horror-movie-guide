import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Create authenticated Supabase client for checking auth
 */
async function createAuthClient() {
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
            // Ignore errors in Route Handlers
          }
        },
      },
    }
  )
}

/**
 * Service client for database operations (bypasses RLS)
 */
function createDbClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

/**
 * Get or create the internal user ID from the users table based on auth user
 */
async function getOrCreateUserId(supabase: ReturnType<typeof createDbClient>, authUser: { id: string; email?: string }): Promise<string | null> {
  // First try to find by auth user ID
  const { data: byId } = await supabase
    .from('users')
    .select('id')
    .eq('id', authUser.id)
    .single()

  if (byId) return byId.id

  // Fallback: find by email
  if (authUser.email) {
    const { data: byEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', authUser.email)
      .single()

    if (byEmail) return byEmail.id
  }

  // User doesn't exist - create them
  if (authUser.email) {
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: authUser.id,
        email: authUser.email,
      })
      .select('id')
      .single()

    if (newUser) return newUser.id
    console.error('Failed to create user:', error)
  }

  return null
}

/**
 * Generate a URL-friendly slug from a name
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  // Add random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).substring(2, 8)
  return `${base}-${suffix}`
}

/**
 * GET /api/user/shared-lists
 * Get all shared lists for the current user
 */
export async function GET() {
  try {
    const authClient = await createAuthClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createDbClient()

    const userId = await getOrCreateUserId(supabase, user)
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const { data: lists, error } = await supabase
      .from('shared_lists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shared lists:', error)
      return NextResponse.json(
        { error: 'Failed to fetch shared lists' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lists })
  } catch (error) {
    console.error('Shared lists GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/user/shared-lists
 * Create a new shared list (snapshot of current watchlist)
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    const supabase = createDbClient()

    const userId = await getOrCreateUserId(supabase, user)
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's current watchlist
    const { data: watchlistItems, error: watchlistError } = await supabase
      .from('user_list_items')
      .select(`
        card_id,
        availability_cards (
          id,
          poster_url
        )
      `)
      .eq('user_id', userId)
      .eq('list_type', 'watchlist')
      .order('position', { ascending: true })

    if (watchlistError) {
      console.error('Error fetching watchlist:', watchlistError)
      return NextResponse.json(
        { error: 'Failed to fetch watchlist' },
        { status: 500 }
      )
    }

    if (!watchlistItems || watchlistItems.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist is empty' },
        { status: 400 }
      )
    }

    // Extract card IDs and header image (first movie's poster)
    const cardIds = watchlistItems.map((item: any) => item.card_id)
    const headerImageUrl = (watchlistItems[0] as any)?.availability_cards?.poster_url || null

    // Generate unique slug
    const slug = generateSlug(name.trim())

    // Create the shared list
    const { data: newList, error: insertError } = await supabase
      .from('shared_lists')
      .insert({
        user_id: userId,
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        card_ids: cardIds,
        header_image_url: headerImageUrl,
        card_count: cardIds.length,
        is_public: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating shared list:', insertError)
      return NextResponse.json(
        { error: 'Failed to create shared list' },
        { status: 500 }
      )
    }

    return NextResponse.json({ list: newList }, { status: 201 })
  } catch (error) {
    console.error('Shared lists POST error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/user/shared-lists?id=xxx
 * Delete a shared list
 */
export async function DELETE(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const listId = searchParams.get('id')

    if (!listId) {
      return NextResponse.json(
        { error: 'List ID is required' },
        { status: 400 }
      )
    }

    const supabase = createDbClient()

    const userId = await getOrCreateUserId(supabase, user)
    if (!userId) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Delete the list (only if owned by user)
    const { error } = await supabase
      .from('shared_lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting shared list:', error)
      return NextResponse.json(
        { error: 'Failed to delete shared list' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shared lists DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

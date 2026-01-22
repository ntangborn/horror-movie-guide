import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Admin email list
const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
]

/**
 * Create authenticated Supabase client for auth check
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
            // Ignore
          }
        },
      },
    }
  )
}

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    // Check authentication
    const authClient = await createAuthClient()
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Use service key to bypass RLS for admin access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )

    // Get users from our users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError.message)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get watchlist counts for each user
    const { data: watchlists, error: watchlistError } = await supabase
      .from('user_watchlist')
      .select('user_id')

    const watchlistCounts: Record<string, number> = {}
    if (watchlists) {
      watchlists.forEach((w: { user_id: string }) => {
        watchlistCounts[w.user_id] = (watchlistCounts[w.user_id] || 0) + 1
      })
    }

    // Format users for response
    const formattedUsers = (users || []).map(user => ({
      id: user.id,
      email: user.email,
      tier: user.substack_tier || 'free',
      status: isActiveUser(user.last_active) ? 'active' : 'inactive',
      watchlist_count: watchlistCounts[user.id] || 0,
      joined: user.created_at,
      last_active: user.last_active,
    }))

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
    })
  } catch (error) {
    console.error('Users API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Check if user was active in the last 30 days
 */
function isActiveUser(lastActive: string | null): boolean {
  if (!lastActive) return false
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return new Date(lastActive) > thirtyDaysAgo
}

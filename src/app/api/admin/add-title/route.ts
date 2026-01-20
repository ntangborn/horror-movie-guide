import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Admin email list
const ADMIN_EMAILS = ['ntangborn@gmail.com', 'admin@example.com']

// Auth client for checking user session
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

// Service client for admin operations (bypasses RLS)
function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

/**
 * POST /api/admin/add-title
 * Add a new title to the database
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const titleData = await request.json()

    if (!titleData.imdb_id) {
      return NextResponse.json({ error: 'imdb_id is required' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient()

    // Check if title already exists
    const { data: existing } = await supabase
      .from('availability_cards')
      .select('id')
      .eq('imdb_id', titleData.imdb_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Title with this IMDB ID already exists' }, { status: 409 })
    }

    // Insert the new title
    const { data, error: insertError } = await supabase
      .from('availability_cards')
      .insert(titleData)
      .select()
      .single()

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Add title error:', error)
    return NextResponse.json({ error: 'Failed to add title' }, { status: 500 })
  }
}

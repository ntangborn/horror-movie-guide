import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Admin email list - must match middleware
const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
]

/**
 * Create authenticated Supabase client for auth checks
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
            // Ignore errors
          }
        },
      },
    }
  )
}

/**
 * Create admin client for database operations (bypasses RLS)
 */
function createAdminClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )
}

/**
 * POST /api/admin/refresh-availability
 * Refresh streaming availability for a title from Watchmode
 */
export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()

    // Check authentication
    const { data: { user }, error: authError } = await authClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { card_id } = await request.json()

    if (!card_id) {
      return NextResponse.json({ error: 'card_id is required' }, { status: 400 })
    }

    // Use admin client for database operations (bypasses RLS)
    const supabase = createAdminClient()

    // Get the title from database
    const { data: title, error: titleError } = await supabase
      .from('availability_cards')
      .select('*')
      .eq('id', card_id)
      .single()

    if (titleError || !title) {
      return NextResponse.json({ error: 'Title not found' }, { status: 404 })
    }

    const watchmodeKey = process.env.WATCHMODE_API_KEY
    if (!watchmodeKey) {
      return NextResponse.json({ error: 'Watchmode API key not configured' }, { status: 500 })
    }

    let sources: any[] = []
    let watchmodeId = title.watchmode_id

    // If we don't have a Watchmode ID, search for it
    if (!watchmodeId && title.imdb_id) {
      try {
        const searchResponse = await fetch(
          `https://api.watchmode.com/v1/search/?apiKey=${watchmodeKey}&search_field=imdb_id&search_value=${title.imdb_id}`
        )
        const searchData = await searchResponse.json()

        if (searchData.title_results && searchData.title_results.length > 0) {
          watchmodeId = searchData.title_results[0].id

          // Save the Watchmode ID for future use
          await supabase
            .from('availability_cards')
            .update({ watchmode_id: watchmodeId.toString() })
            .eq('id', card_id)
        }
      } catch (searchError) {
        console.error('Watchmode search error:', searchError)
      }
    }

    // If we have a Watchmode ID, fetch the sources
    if (watchmodeId) {
      try {
        const sourcesResponse = await fetch(
          `https://api.watchmode.com/v1/title/${watchmodeId}/sources/?apiKey=${watchmodeKey}&regions=US`
        )
        const sourcesData = await sourcesResponse.json()

        if (Array.isArray(sourcesData)) {
          sources = sourcesData.map((s: any) => ({
            source_id: s.source_id,
            name: s.name,
            type: s.type,
            region: s.region,
            ios_url: s.ios_url,
            android_url: s.android_url,
            web_url: s.web_url,
            format: s.format,
            price: s.price,
            seasons: s.seasons,
            episodes: s.episodes,
          }))
        }
      } catch (sourcesError) {
        console.error('Watchmode sources error:', sourcesError)
        return NextResponse.json({ error: 'Failed to fetch sources from Watchmode' }, { status: 500 })
      }
    } else {
      return NextResponse.json({ error: 'Could not find title in Watchmode' }, { status: 404 })
    }

    // Update the database with new sources
    const { error: updateError } = await supabase
      .from('availability_cards')
      .update({
        sources,
        updated_at: new Date().toISOString(),
      })
      .eq('id', card_id)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      sources_count: sources.length,
      sources,
    })
  } catch (error) {
    console.error('Refresh availability error:', error)
    return NextResponse.json(
      { error: 'Failed to refresh availability' },
      { status: 500 }
    )
  }
}

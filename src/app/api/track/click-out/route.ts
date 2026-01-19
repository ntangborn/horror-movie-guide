import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Create Supabase client for API routes
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
 * POST /api/track/click-out
 * Log a click-out event when user clicks a streaming link
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createApiClient()

    // Get current user (may be null for anonymous users)
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { cardId, service, serviceType, deepLink, sessionId } = body

    if (!cardId || !service) {
      return NextResponse.json(
        { error: 'cardId and service are required' },
        { status: 400 }
      )
    }

    // Get request metadata
    const userAgent = request.headers.get('user-agent') || null
    const referrer = request.headers.get('referer') || null

    // Insert click event
    const { data, error } = await supabase
      .from('click_events')
      .insert({
        user_id: user?.id || null,
        card_id: cardId,
        service: service,
        service_type: serviceType || null,
        deep_link: deepLink || null,
        session_id: sessionId || null,
        user_agent: userAgent,
        referrer: referrer,
      })
      .select()
      .single()

    if (error) {
      console.error('Error logging click event:', error)
      // Don't fail the request if logging fails - user should still be able to click
      return NextResponse.json({ success: true, logged: false })
    }

    return NextResponse.json({ success: true, logged: true, eventId: data.id })
  } catch (error) {
    console.error('Click tracking error:', error)
    // Don't fail - tracking should be non-blocking
    return NextResponse.json({ success: true, logged: false })
  }
}

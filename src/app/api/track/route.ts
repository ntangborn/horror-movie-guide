import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Use service key for inserting events (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface TrackEvent {
  session_id: string
  event_type: 'page_view' | 'filter_change' | 'card_click' | 'list_view' | 'heartbeat'
  page_path?: string
  event_data?: Record<string, unknown>
}

/**
 * POST /api/track
 * Track session events (fire-and-forget)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const events: TrackEvent[] = Array.isArray(body) ? body : [body]

    // Validate events
    const validEvents = events.filter(
      (e) => e.session_id && e.event_type
    )

    if (validEvents.length === 0) {
      return NextResponse.json({ error: 'No valid events' }, { status: 400 })
    }

    // Insert events
    const { error } = await supabase.from('session_events').insert(
      validEvents.map((e) => ({
        session_id: e.session_id,
        event_type: e.event_type,
        page_path: e.page_path || null,
        event_data: e.event_data || {},
      }))
    )

    if (error) {
      console.error('Track error:', error)
      return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: validEvents.length })
  } catch (error) {
    console.error('Track error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}

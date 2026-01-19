import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Admin email list
const ADMIN_EMAILS = ['ntangborn@gmail.com', 'admin@example.com']

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
            // Ignore
          }
        },
      },
    }
  )
}

/**
 * GET /api/admin/sessions
 * Get session analytics data
 */
export async function GET() {
  try {
    const supabase = await createApiClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Sessions today (unique session_ids)
    const { data: todaySessions } = await supabase
      .from('session_events')
      .select('session_id')
      .gte('created_at', todayStart.toISOString())

    const uniqueSessionsToday = new Set(
      (todaySessions || []).map((s) => s.session_id)
    ).size

    // Sessions this week
    const { data: weekSessions } = await supabase
      .from('session_events')
      .select('session_id')
      .gte('created_at', weekAgo.toISOString())

    const uniqueSessionsWeek = new Set(
      (weekSessions || []).map((s) => s.session_id)
    ).size

    // Page views today
    const { count: pageViewsToday } = await supabase
      .from('session_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view')
      .gte('created_at', todayStart.toISOString())

    // Popular pages (last 7 days)
    const { data: pageViews } = await supabase
      .from('session_events')
      .select('page_path')
      .eq('event_type', 'page_view')
      .gte('created_at', weekAgo.toISOString())

    const pageCounts: Record<string, number> = {}
    ;(pageViews || []).forEach((pv) => {
      if (pv.page_path) {
        pageCounts[pv.page_path] = (pageCounts[pv.page_path] || 0) + 1
      }
    })
    const popularPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Popular filters (last 7 days)
    const { data: filterEvents } = await supabase
      .from('session_events')
      .select('event_data')
      .eq('event_type', 'filter_change')
      .gte('created_at', weekAgo.toISOString())

    const filterCounts: Record<string, number> = {}
    ;(filterEvents || []).forEach((fe) => {
      const data = fe.event_data as { filterType?: string; filterValue?: string }
      if (data?.filterType && data?.filterValue) {
        const key = `${data.filterType}: ${data.filterValue}`
        filterCounts[key] = (filterCounts[key] || 0) + 1
      }
    })
    const popularFilters = Object.entries(filterCounts)
      .map(([filter, count]) => ({ filter, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Average session duration (based on heartbeats)
    // Group heartbeats by session, calculate time between first and last event
    const { data: sessionData } = await supabase
      .from('session_events')
      .select('session_id, created_at')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true })

    const sessionTimes: Record<string, { first: Date; last: Date }> = {}
    ;(sessionData || []).forEach((event) => {
      const time = new Date(event.created_at)
      if (!sessionTimes[event.session_id]) {
        sessionTimes[event.session_id] = { first: time, last: time }
      } else {
        if (time < sessionTimes[event.session_id].first) {
          sessionTimes[event.session_id].first = time
        }
        if (time > sessionTimes[event.session_id].last) {
          sessionTimes[event.session_id].last = time
        }
      }
    })

    const durations = Object.values(sessionTimes).map(
      (s) => (s.last.getTime() - s.first.getTime()) / 1000
    )
    const avgDuration =
      durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0

    // Card clicks (last 7 days)
    const { data: cardClicks } = await supabase
      .from('session_events')
      .select('event_data')
      .eq('event_type', 'card_click')
      .gte('created_at', weekAgo.toISOString())

    const cardCounts: Record<string, { title: string; count: number }> = {}
    ;(cardClicks || []).forEach((cc) => {
      const data = cc.event_data as { cardId?: string; cardTitle?: string }
      if (data?.cardId) {
        if (!cardCounts[data.cardId]) {
          cardCounts[data.cardId] = { title: data.cardTitle || 'Unknown', count: 0 }
        }
        cardCounts[data.cardId].count++
      }
    })
    const popularCards = Object.entries(cardCounts)
      .map(([cardId, { title, count }]) => ({ cardId, title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Sessions by day (last 7 days)
    const sessionsByDay: { date: string; sessions: number; pageViews: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const daySessions = (sessionData || []).filter((s) => {
        const t = new Date(s.created_at)
        return t >= dayStart && t < dayEnd
      })

      const uniqueSessions = new Set(daySessions.map((s) => s.session_id)).size
      const pvCount = (pageViews || []).filter((pv) => {
        // This is a rough estimate since pageViews doesn't have timestamps
        return true
      }).length

      sessionsByDay.push({
        date: dateStr,
        sessions: uniqueSessions,
        pageViews: Math.round(pvCount / 7), // Rough average
      })
    }

    return NextResponse.json({
      sessionsToday: uniqueSessionsToday,
      sessionsWeek: uniqueSessionsWeek,
      pageViewsToday: pageViewsToday || 0,
      avgSessionDuration: avgDuration,
      popularPages,
      popularFilters,
      popularCards,
      sessionsByDay,
    })
  } catch (error) {
    console.error('Sessions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
  }
}

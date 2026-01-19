import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// Admin email list - must match middleware
const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
]

/**
 * Create authenticated Supabase client
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
 * GET /api/admin/analytics
 * Get click-out analytics data
 */
export async function GET() {
  try {
    const supabase = await createApiClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if admin
    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get total click-outs
    const { count: totalClicks } = await supabase
      .from('click_events')
      .select('*', { count: 'exact', head: true })

    // Get click-outs by service
    const { data: byService } = await supabase
      .rpc('get_clicks_by_service')
      .limit(20)

    // If RPC doesn't exist, fall back to manual query
    let serviceStats = byService
    if (!serviceStats) {
      const { data: clickData } = await supabase
        .from('click_events')
        .select('service')

      if (clickData) {
        const counts: Record<string, number> = {}
        clickData.forEach((row: { service: string }) => {
          counts[row.service] = (counts[row.service] || 0) + 1
        })
        serviceStats = Object.entries(counts)
          .map(([service, count]) => ({ service, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20)
      }
    }

    // Get most clicked titles
    const { data: clicksByCard } = await supabase
      .from('click_events')
      .select(`
        card_id,
        availability_cards (
          id,
          title,
          year,
          poster_url
        )
      `)

    let titleStats: { card_id: string; title: string; year: number; poster_url: string; count: number }[] = []
    if (clicksByCard) {
      const counts: Record<string, { card: any; count: number }> = {}
      clicksByCard.forEach((row: any) => {
        if (row.availability_cards) {
          const cardId = row.card_id
          if (!counts[cardId]) {
            counts[cardId] = { card: row.availability_cards, count: 0 }
          }
          counts[cardId].count++
        }
      })
      titleStats = Object.entries(counts)
        .map(([card_id, { card, count }]) => ({
          card_id,
          title: card.title,
          year: card.year,
          poster_url: card.poster_url,
          count,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    }

    // Get clicks over time (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: timeData } = await supabase
      .from('click_events')
      .select('created_at')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: true })

    // Group by day
    const clicksByDay: Record<string, number> = {}
    if (timeData) {
      timeData.forEach((row: { created_at: string }) => {
        const date = row.created_at.split('T')[0]
        clicksByDay[date] = (clicksByDay[date] || 0) + 1
      })
    }

    // Fill in missing days with zeros
    const timeStats: { date: string; count: number }[] = []
    const current = new Date(thirtyDaysAgo)
    const today = new Date()
    while (current <= today) {
      const dateStr = current.toISOString().split('T')[0]
      timeStats.push({
        date: dateStr,
        count: clicksByDay[dateStr] || 0,
      })
      current.setDate(current.getDate() + 1)
    }

    // Get unique users count
    const { data: uniqueUsers } = await supabase
      .from('click_events')
      .select('user_id')
      .not('user_id', 'is', null)

    const uniqueUserCount = uniqueUsers
      ? new Set(uniqueUsers.map((u: { user_id: string }) => u.user_id)).size
      : 0

    // Get unique sessions count
    const { data: uniqueSessions } = await supabase
      .from('click_events')
      .select('session_id')
      .not('session_id', 'is', null)

    const uniqueSessionCount = uniqueSessions
      ? new Set(uniqueSessions.map((s: { session_id: string }) => s.session_id)).size
      : 0

    return NextResponse.json({
      totalClicks: totalClicks || 0,
      uniqueUsers: uniqueUserCount,
      uniqueSessions: uniqueSessionCount,
      byService: serviceStats || [],
      topTitles: titleStats,
      clicksOverTime: timeStats,
    })
  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}

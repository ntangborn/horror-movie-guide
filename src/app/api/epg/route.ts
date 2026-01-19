import { NextResponse } from 'next/server'
import { getPlutoTVEPG, getWhatsOnNow, getUpcoming } from '@/lib/pluto-tv'

/**
 * GET /api/epg
 * Fetch EPG data from Pluto TV
 *
 * Query params:
 * - filter: 'now' | 'upcoming' | 'all' (default: 'all')
 * - hours: number of hours for upcoming (default: 4)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all'
    const hours = parseInt(searchParams.get('hours') || '4', 10)

    let programs

    switch (filter) {
      case 'now':
        programs = await getWhatsOnNow()
        break
      case 'upcoming':
        programs = await getUpcoming(hours)
        break
      default:
        programs = await getPlutoTVEPG()
    }

    const response = NextResponse.json({
      programs,
      count: programs.length,
      filter,
      timestamp: new Date().toISOString(),
    })

    // Cache for 5 minutes
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )

    return response
  } catch (error) {
    console.error('EPG API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch EPG data' },
      { status: 500 }
    )
  }
}

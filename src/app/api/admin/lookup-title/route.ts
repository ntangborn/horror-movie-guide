import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

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

interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Released: string
  Runtime: string
  Genre: string
  Director: string
  Writer: string
  Actors: string
  Plot: string
  Language: string
  Country: string
  Awards: string
  Poster: string
  Ratings: { Source: string; Value: string }[]
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: string
  DVD: string
  BoxOffice: string
  Production: string
  Website: string
  Response: string
  Error?: string
}

interface WatchmodeSource {
  source_id: number
  name: string
  type: string
  region: string
  ios_url: string
  android_url: string
  web_url: string
  format: string
  price: number | null
  seasons: number | null
  episodes: number | null
}

/**
 * POST /api/admin/lookup-title
 * Look up title info from OMDB and optionally Watchmode
 */
export async function POST(request: NextRequest) {
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

    const { imdb_id } = await request.json()

    if (!imdb_id || !imdb_id.match(/^tt\d{7,}$/)) {
      return NextResponse.json({ error: 'Invalid IMDB ID format' }, { status: 400 })
    }

    // Check if title already exists
    const { data: existing } = await supabase
      .from('availability_cards')
      .select('id')
      .eq('imdb_id', imdb_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'Title already exists in database' }, { status: 409 })
    }

    // Fetch from OMDB
    const omdbKey = process.env.OMDB_API_KEY
    if (!omdbKey) {
      return NextResponse.json({ error: 'OMDB API key not configured' }, { status: 500 })
    }

    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${imdb_id}&apikey=${omdbKey}`
    )
    const omdbData: OMDBResponse = await omdbResponse.json()

    if (omdbData.Response === 'False') {
      return NextResponse.json({ error: omdbData.Error || 'Title not found' }, { status: 404 })
    }

    // Parse runtime to minutes
    const runtimeMatch = omdbData.Runtime?.match(/(\d+)/)
    const runtimeMinutes = runtimeMatch ? parseInt(runtimeMatch[1]) : null

    // Parse genres
    const genres = omdbData.Genre?.split(',').map(g => g.trim()) || []

    // Try to get Watchmode data for streaming sources
    let sources: WatchmodeSource[] = []
    const watchmodeKey = process.env.WATCHMODE_API_KEY

    if (watchmodeKey) {
      try {
        // First, search for the title in Watchmode by IMDB ID
        const searchResponse = await fetch(
          `https://api.watchmode.com/v1/search/?apiKey=${watchmodeKey}&search_field=imdb_id&search_value=${imdb_id}`
        )
        const searchData = await searchResponse.json()

        if (searchData.title_results && searchData.title_results.length > 0) {
          const watchmodeId = searchData.title_results[0].id

          // Get streaming sources
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
        }
      } catch (watchmodeError) {
        console.error('Watchmode API error:', watchmodeError)
        // Continue without sources - not a fatal error
      }
    }

    return NextResponse.json({
      imdb_id: omdbData.imdbID,
      title: omdbData.Title,
      year: parseInt(omdbData.Year) || new Date().getFullYear(),
      type: omdbData.Type === 'series' ? 'series' : 'movie',
      poster_url: omdbData.Poster !== 'N/A' ? omdbData.Poster : null,
      runtime_minutes: runtimeMinutes,
      genres,
      plot: omdbData.Plot !== 'N/A' ? omdbData.Plot : null,
      director: omdbData.Director !== 'N/A' ? omdbData.Director : null,
      actors: omdbData.Actors !== 'N/A' ? omdbData.Actors : null,
      imdb_rating: omdbData.imdbRating !== 'N/A' ? parseFloat(omdbData.imdbRating) : null,
      sources,
    })
  } catch (error) {
    console.error('Lookup title error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup title' },
      { status: 500 }
    )
  }
}

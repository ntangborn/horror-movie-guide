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

interface OMDBResponse {
  Title: string
  Year: string
  Rated: string
  Runtime: string
  Genre: string
  Director: string
  Plot: string
  Poster: string
  imdbRating: string
  imdbID: string
  Type: string
  Response: string
  Error?: string
  Country?: string
}

/**
 * Try to get poster from TMDB as fallback
 */
async function getTmdbPoster(imdbId: string): Promise<string | null> {
  const tmdbKey = process.env.TMDB_API_KEY
  if (!tmdbKey) {
    console.log('TMDB API key not configured')
    return null
  }

  try {
    // Use TMDB's find endpoint to search by IMDB ID
    const response = await fetch(
      `https://api.themoviedb.org/3/find/${imdbId}?api_key=${tmdbKey}&external_source=imdb_id`
    )
    const data = await response.json()

    // Check movie results first, then TV results
    const result = data.movie_results?.[0] || data.tv_results?.[0]

    if (result?.poster_path) {
      // TMDB image base URL with w500 size
      return `https://image.tmdb.org/t/p/w500${result.poster_path}`
    }
  } catch (err) {
    console.error('TMDB fetch error:', err)
  }

  return null
}

/**
 * Try to validate and fix OMDB poster URL
 * OMDB sometimes returns stale URLs - try different sizes/formats
 */
async function getValidPosterUrl(omdbPosterUrl: string): Promise<string | null> {
  if (!omdbPosterUrl || omdbPosterUrl === 'N/A') return null

  // Try different URL variations
  const urlVariations = [
    omdbPosterUrl, // Original URL
    omdbPosterUrl.replace('_V1_SX300.jpg', '_V1_SX600.jpg'), // Larger size
    omdbPosterUrl.replace('_V1_SX300.jpg', '_V1_.jpg'), // Original size
    omdbPosterUrl.replace(/@\._V1_SX\d+\.jpg$/, '@._V1_.jpg'), // Pattern match
  ]

  for (const url of urlVariations) {
    try {
      // Use GET with Range header - more reliable than HEAD for CDNs
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Range': 'bytes=0-0' },
      })
      // 200 or 206 (partial content) means the image exists
      if (response.ok || response.status === 206) {
        return url
      }
    } catch {
      // Continue to next URL
    }
  }

  // If validation fails, return original URL anyway and let client handle errors
  console.log(`Poster validation failed for all URLs, using original: ${omdbPosterUrl}`)
  return omdbPosterUrl
}

/**
 * POST /api/admin/enrich-title
 * Enrich a single title with OMDB data
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

    const omdbKey = process.env.OMDB_API_KEY
    if (!omdbKey) {
      return NextResponse.json({ error: 'OMDB API key not configured' }, { status: 500 })
    }

    // Fetch from OMDB
    const omdbResponse = await fetch(
      `https://www.omdbapi.com/?i=${title.imdb_id}&apikey=${omdbKey}&plot=full`
    )
    const omdbData: OMDBResponse = await omdbResponse.json()

    if (omdbData.Response !== 'True') {
      return NextResponse.json({ error: omdbData.Error || 'Title not found in OMDB' }, { status: 404 })
    }

    // Build updates
    const updates: Record<string, unknown> = {}

    // Try to get poster - OMDB first, then TMDB fallback
    let posterUrl: string | null = null

    if (omdbData.Poster && omdbData.Poster !== 'N/A') {
      posterUrl = await getValidPosterUrl(omdbData.Poster)
      console.log('OMDB poster URL:', posterUrl)
    } else {
      console.log('OMDB returned no poster, trying TMDB fallback...')
      posterUrl = await getTmdbPoster(title.imdb_id)
      console.log('TMDB poster URL:', posterUrl)
    }

    if (posterUrl) {
      updates.poster_url = posterUrl
    }
    if (omdbData.Plot && omdbData.Plot !== 'N/A') {
      updates.synopsis = omdbData.Plot
    }
    if (omdbData.imdbRating && omdbData.imdbRating !== 'N/A') {
      updates.imdb_rating = parseFloat(omdbData.imdbRating)
    }
    if (omdbData.Rated && omdbData.Rated !== 'N/A') {
      updates.mpaa_rating = omdbData.Rated
    }
    if (omdbData.Runtime && omdbData.Runtime !== 'N/A') {
      const runtimeMatch = omdbData.Runtime.match(/(\d+)/)
      if (runtimeMatch) {
        updates.runtime_minutes = parseInt(runtimeMatch[1], 10)
      }
    }
    if (omdbData.Director && omdbData.Director !== 'N/A') {
      updates.director = omdbData.Director
    }
    if (omdbData.Country && omdbData.Country !== 'N/A') {
      updates.country = omdbData.Country
    }
    if (omdbData.Genre && omdbData.Genre !== 'N/A') {
      updates.genres = omdbData.Genre.split(',').map((g) => g.trim().toLowerCase())
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No new data to update' }, { status: 200 })
    }

    // Debug: log full updates object
    console.log('Updates object before save:', JSON.stringify(updates, null, 2))

    // Update database
    updates.updated_at = new Date().toISOString()

    const { data: updatedRow, error: updateError } = await supabase
      .from('availability_cards')
      .update(updates)
      .eq('id', card_id)
      .select('id, poster_url')
      .single()

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ error: 'Failed to update database' }, { status: 500 })
    }

    console.log('Database update result:', updatedRow)

    return NextResponse.json({
      success: true,
      updated_fields: Object.keys(updates).filter(k => k !== 'updated_at'),
      data: {
        poster_url: updates.poster_url,
        synopsis: updates.synopsis,
        imdb_rating: updates.imdb_rating,
        runtime_minutes: updates.runtime_minutes,
      }
    })
  } catch (error) {
    console.error('Enrich title error:', error)
    return NextResponse.json({ error: 'Failed to enrich title' }, { status: 500 })
  }
}

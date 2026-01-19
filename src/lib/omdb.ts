const OMDB_API_KEY = process.env.OMDB_API_KEY
const OMDB_BASE_URL = 'https://www.omdbapi.com/'

/**
 * OMDB API response for a single movie/series
 */
export interface OMDBMovie {
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
  Ratings: Array<{ Source: string; Value: string }>
  Metascore: string
  imdbRating: string
  imdbVotes: string
  imdbID: string
  Type: 'movie' | 'series' | 'episode'
  DVD?: string
  BoxOffice?: string
  Production?: string
  Website?: string
  Response: 'True' | 'False'
  Error?: string
}

/**
 * Parsed movie data with normalized types
 */
export interface ParsedMovie {
  title: string
  year: number
  runtime: number | null
  genre: string
  director: string
  plot: string
  poster: string
  imdbRating: number | null
  country: string
  rated: string
  imdbId: string
  type: 'movie' | 'series' | 'episode'
}

/**
 * OMDB search result item
 */
export interface OMDBSearchResult {
  Title: string
  Year: string
  imdbID: string
  Type: 'movie' | 'series' | 'episode'
  Poster: string
}

/**
 * OMDB search response
 */
export interface OMDBSearchResponse {
  Search?: OMDBSearchResult[]
  totalResults?: string
  Response: 'True' | 'False'
  Error?: string
}

/**
 * Parsed search result with normalized types
 */
export interface ParsedSearchResult {
  title: string
  year: number
  imdbId: string
  type: 'movie' | 'series' | 'episode'
  poster: string
}

/**
 * Search results with pagination info
 */
export interface SearchResults {
  results: ParsedSearchResult[]
  totalResults: number
  page: number
  totalPages: number
}

/**
 * Parses runtime string (e.g., "120 min") to minutes number
 */
function parseRuntime(runtime: string): number | null {
  const match = runtime.match(/(\d+)/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Parses rating string to number
 */
function parseRating(rating: string): number | null {
  const parsed = parseFloat(rating)
  return isNaN(parsed) ? null : parsed
}

/**
 * Fetches detailed movie information by IMDB ID
 *
 * @param imdbId - The IMDB ID of the movie (e.g., "tt0111161")
 * @returns Parsed movie data or null if not found/error
 *
 * @example
 * ```ts
 * const movie = await getMovieByImdbId('tt0111161')
 * if (movie) {
 *   console.log(movie.title) // "The Shawshank Redemption"
 * }
 * ```
 */
export async function getMovieByImdbId(imdbId: string): Promise<ParsedMovie | null> {
  if (!OMDB_API_KEY) {
    console.error('OMDB_API_KEY is not configured')
    return null
  }

  try {
    const url = `${OMDB_BASE_URL}?i=${encodeURIComponent(imdbId)}&apikey=${OMDB_API_KEY}&plot=full`
    const response = await fetch(url)

    if (!response.ok) {
      console.error(`OMDB API error: ${response.status} ${response.statusText}`)
      return null
    }

    const data: OMDBMovie = await response.json()

    if (data.Response === 'False') {
      console.error(`OMDB error: ${data.Error}`)
      return null
    }

    return {
      title: data.Title,
      year: parseInt(data.Year, 10),
      runtime: parseRuntime(data.Runtime),
      genre: data.Genre,
      director: data.Director,
      plot: data.Plot,
      poster: data.Poster !== 'N/A' ? data.Poster : '',
      imdbRating: parseRating(data.imdbRating),
      country: data.Country,
      rated: data.Rated,
      imdbId: data.imdbID,
      type: data.Type,
    }
  } catch (error) {
    console.error('Failed to fetch movie from OMDB:', error)
    return null
  }
}

/**
 * Searches for movies by title with optional year filter
 *
 * @param title - The movie title to search for
 * @param year - Optional release year to narrow results
 * @param page - Page number for pagination (default: 1, OMDB returns 10 results per page)
 * @returns Search results with pagination info, or empty results on error
 *
 * @example
 * ```ts
 * const results = await searchMovies('Halloween', 1978)
 * console.log(results.totalResults) // Total number of matches
 * console.log(results.results[0].title) // "Halloween"
 * ```
 */
export async function searchMovies(
  title: string,
  year?: number,
  page: number = 1
): Promise<SearchResults> {
  const emptyResults: SearchResults = {
    results: [],
    totalResults: 0,
    page,
    totalPages: 0,
  }

  if (!OMDB_API_KEY) {
    console.error('OMDB_API_KEY is not configured')
    return emptyResults
  }

  try {
    let url = `${OMDB_BASE_URL}?s=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}&page=${page}`

    if (year) {
      url += `&y=${year}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      console.error(`OMDB API error: ${response.status} ${response.statusText}`)
      return emptyResults
    }

    const data: OMDBSearchResponse = await response.json()

    if (data.Response === 'False') {
      // "Movie not found!" is a valid response for no results
      if (data.Error !== 'Movie not found!') {
        console.error(`OMDB error: ${data.Error}`)
      }
      return emptyResults
    }

    const totalResults = parseInt(data.totalResults || '0', 10)

    return {
      results: (data.Search || []).map((item) => ({
        title: item.Title,
        year: parseInt(item.Year, 10),
        imdbId: item.imdbID,
        type: item.Type,
        poster: item.Poster !== 'N/A' ? item.Poster : '',
      })),
      totalResults,
      page,
      totalPages: Math.ceil(totalResults / 10), // OMDB returns 10 results per page
    }
  } catch (error) {
    console.error('Failed to search OMDB:', error)
    return emptyResults
  }
}

/**
 * Fetches all pages of search results for a given query
 * Use with caution - may make many API calls for broad searches
 *
 * @param title - The movie title to search for
 * @param year - Optional release year to narrow results
 * @param maxPages - Maximum number of pages to fetch (default: 10)
 * @returns Array of all search results up to maxPages
 *
 * @example
 * ```ts
 * const allResults = await searchMoviesAll('Nightmare', undefined, 5)
 * console.log(allResults.length) // Up to 50 results (5 pages × 10 per page)
 * ```
 */
export async function searchMoviesAll(
  title: string,
  year?: number,
  maxPages: number = 10
): Promise<ParsedSearchResult[]> {
  const firstPage = await searchMovies(title, year, 1)

  if (firstPage.totalPages <= 1) {
    return firstPage.results
  }

  const allResults = [...firstPage.results]
  const pagesToFetch = Math.min(firstPage.totalPages, maxPages)

  for (let page = 2; page <= pagesToFetch; page++) {
    const pageResults = await searchMovies(title, year, page)
    allResults.push(...pageResults.results)
  }

  return allResults
}

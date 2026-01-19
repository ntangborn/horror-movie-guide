/**
 * Pluto TV API Integration
 *
 * Fetches live TV EPG data from Pluto TV's public API.
 * Filters for horror, sci-fi, and thriller related channels.
 */

// Pluto TV API base URL
const PLUTO_API_BASE = 'https://api.pluto.tv/v2'

// Channels we care about (horror/sci-fi focused)
const TARGET_CHANNEL_SLUGS = [
  'pluto-tv-horror',
  'pluto-tv-sci-fi',
  'mst3k',
  'amc',
  'classic-movies',
  'the-asylum',
  'pluto-tv-thrillers',
  'pluto-tv-action',
]

// Categories that might have horror/sci-fi content
const TARGET_CATEGORIES = [
  'Movies',
  'Entertainment',
  'Action',
]

export interface PlutoChannel {
  _id: string
  slug: string
  name: string
  number: number
  summary?: string
  category: string
  logo?: {
    path: string
  }
  colorLogoSVG?: {
    path: string
  }
  timelines?: PlutoProgram[]
}

export interface PlutoProgram {
  start: string
  stop: string
  title: string
  episode?: {
    _id: string
    name: string
    number?: number
    season?: number
    description?: string
    duration: number
    rating?: string
    genre?: string
    subGenre?: string
    poster?: {
      path: string
    }
    thumbnail?: {
      path: string
    }
    series?: {
      name: string
      _id: string
    }
  }
}

export interface EPGProgram {
  id: string
  channel: string
  channelSlug: string
  channelLogo?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  rating?: string
  genre?: string
  subGenre?: string
  poster?: string
  thumbnail?: string
  isHorrorOrSciFi: boolean
}

/**
 * Check if a program is horror/sci-fi related
 */
function isHorrorOrSciFi(program: PlutoProgram): boolean {
  const horrorKeywords = [
    'horror', 'terror', 'scary', 'fright', 'nightmare', 'haunted',
    'zombie', 'vampire', 'ghost', 'demon', 'monster', 'slasher',
    'sci-fi', 'science fiction', 'alien', 'space', 'robot',
    'thriller', 'suspense', 'mystery', 'supernatural',
  ]

  const title = program.title?.toLowerCase() || ''
  const description = program.episode?.description?.toLowerCase() || ''
  const genre = program.episode?.genre?.toLowerCase() || ''
  const subGenre = program.episode?.subGenre?.toLowerCase() || ''

  const allText = `${title} ${description} ${genre} ${subGenre}`

  return horrorKeywords.some(keyword => allText.includes(keyword))
}

/**
 * Fetch Pluto TV channels with EPG data
 */
export async function fetchPlutoTVChannels(hoursAhead: number = 6): Promise<PlutoChannel[]> {
  const now = new Date()
  const start = now.toISOString()
  const stop = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000).toISOString()

  const url = `${PLUTO_API_BASE}/channels?start=${start}&stop=${stop}`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      throw new Error(`Pluto TV API error: ${response.status}`)
    }

    const channels: PlutoChannel[] = await response.json()
    return channels
  } catch (error) {
    console.error('Failed to fetch Pluto TV channels:', error)
    return []
  }
}

/**
 * Get horror/sci-fi relevant channels from Pluto TV
 */
export async function getHorrorSciFiChannels(): Promise<PlutoChannel[]> {
  const allChannels = await fetchPlutoTVChannels(8)

  // Filter to relevant channels
  const relevantChannels = allChannels.filter(channel => {
    const slugMatch = TARGET_CHANNEL_SLUGS.some(slug =>
      channel.slug?.toLowerCase().includes(slug.toLowerCase())
    )
    const categoryMatch = TARGET_CATEGORIES.includes(channel.category)
    return slugMatch || categoryMatch
  })

  return relevantChannels
}

/**
 * Get EPG programs formatted for our app
 */
export async function getPlutoTVEPG(): Promise<EPGProgram[]> {
  const channels = await fetchPlutoTVChannels(8)
  const programs: EPGProgram[] = []

  for (const channel of channels) {
    if (!channel.timelines) continue

    // Check if this is a target channel or has relevant content
    const isTargetChannel = TARGET_CHANNEL_SLUGS.some(slug =>
      channel.slug?.toLowerCase().includes(slug.toLowerCase())
    )

    for (const program of channel.timelines) {
      const isRelevant = isTargetChannel || isHorrorOrSciFi(program)

      if (isRelevant) {
        programs.push({
          id: `${channel._id}-${program.start}`,
          channel: channel.name,
          channelSlug: channel.slug,
          channelLogo: channel.colorLogoSVG?.path || channel.logo?.path,
          title: program.title,
          description: program.episode?.description,
          startTime: program.start,
          endTime: program.stop,
          duration: program.episode?.duration || 0,
          rating: program.episode?.rating,
          genre: program.episode?.genre,
          subGenre: program.episode?.subGenre,
          poster: program.episode?.poster?.path,
          thumbnail: program.episode?.thumbnail?.path,
          isHorrorOrSciFi: isHorrorOrSciFi(program),
        })
      }
    }
  }

  // Sort by start time
  programs.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())

  return programs
}

/**
 * Get currently airing horror/sci-fi programs
 */
export async function getWhatsOnNow(): Promise<EPGProgram[]> {
  const programs = await getPlutoTVEPG()
  const now = new Date()

  return programs.filter(program => {
    const start = new Date(program.startTime)
    const end = new Date(program.endTime)
    return now >= start && now < end
  })
}

/**
 * Get upcoming horror/sci-fi programs
 */
export async function getUpcoming(hours: number = 4): Promise<EPGProgram[]> {
  const programs = await getPlutoTVEPG()
  const now = new Date()
  const cutoff = new Date(now.getTime() + hours * 60 * 60 * 1000)

  return programs.filter(program => {
    const start = new Date(program.startTime)
    return start > now && start < cutoff
  })
}

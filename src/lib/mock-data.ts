/**
 * Mock Data for MVP Development
 *
 * Realistic-looking data for testing UI components before
 * real API integrations are complete.
 */

import { addMinutes, subMinutes, startOfHour } from 'date-fns'
import type { EPGScheduleItem, AvailabilityCard } from '@/types'

// ============================================
// CHANNELS
// ============================================

export const MOCK_CHANNELS = [
  'AMC',
  'SyFy',
  'Shudder TV',
  'Chiller',
  'TCM',
  'IFC',
  'FX',
  'Comet',
] as const

// ============================================
// EPG SCHEDULE DATA
// ============================================

interface MockProgram {
  title: string
  synopsis: string
  duration: number // minutes
  isGenreHighlight: boolean
}

const HORROR_PROGRAMS: MockProgram[] = [
  {
    title: 'A Nightmare on Elm Street',
    synopsis: 'Teenager Nancy Thompson must uncover the dark truth concealed by her parents after she and her friends become combatants of a disfigured dream stalker named Freddy Krueger.',
    duration: 120,
    isGenreHighlight: true,
  },
  {
    title: 'Halloween',
    synopsis: 'Fifteen years after murdering his sister on Halloween night 1963, Michael Myers escapes from a mental hospital and returns to the small town of Haddonfield to kill again.',
    duration: 105,
    isGenreHighlight: true,
  },
  {
    title: 'The Thing',
    synopsis: 'A research team in Antarctica is hunted by a shape-shifting alien that assumes the appearance of its victims.',
    duration: 120,
    isGenreHighlight: true,
  },
  {
    title: 'Alien',
    synopsis: 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating an unknown transmission.',
    duration: 135,
    isGenreHighlight: true,
  },
  {
    title: 'The Exorcist',
    synopsis: 'When a young girl is possessed by a mysterious entity, her mother seeks the help of two Catholic priests to save her.',
    duration: 135,
    isGenreHighlight: true,
  },
  {
    title: 'Scream',
    synopsis: 'A year after the murder of her mother, a teenage girl is terrorized by a masked killer who targets her and her friends.',
    duration: 120,
    isGenreHighlight: true,
  },
  {
    title: 'The Shining',
    synopsis: 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
    duration: 150,
    isGenreHighlight: true,
  },
  {
    title: 'Poltergeist',
    synopsis: 'A family\'s home is haunted by a host of demonic ghosts that abduct their youngest daughter.',
    duration: 120,
    isGenreHighlight: true,
  },
  {
    title: 'Event Horizon',
    synopsis: 'A rescue crew investigates a spaceship that disappeared into a black hole and has now returned with a hellish presence.',
    duration: 105,
    isGenreHighlight: true,
  },
  {
    title: 'The Fly',
    synopsis: 'A scientist becomes a mutant after a teleportation experiment goes wrong and his genes get fused with those of a fly.',
    duration: 105,
    isGenreHighlight: true,
  },
]

const REGULAR_PROGRAMS: MockProgram[] = [
  {
    title: 'CSI: Crime Scene Investigation',
    synopsis: 'A team of forensic investigators in Las Vegas solve crimes using evidence collected at crime scenes.',
    duration: 60,
    isGenreHighlight: false,
  },
  {
    title: 'Law & Order: SVU',
    synopsis: 'The Special Victims Unit investigates crimes involving sexual assault and abuse.',
    duration: 60,
    isGenreHighlight: false,
  },
  {
    title: 'Dateline NBC',
    synopsis: 'Newsmagazine featuring stories about true crime, investigations, and human interest.',
    duration: 60,
    isGenreHighlight: false,
  },
  {
    title: 'NCIS',
    synopsis: 'The Naval Criminal Investigative Service investigates crimes involving the U.S. Navy and Marine Corps.',
    duration: 60,
    isGenreHighlight: false,
  },
  {
    title: 'The Walking Dead',
    synopsis: 'Sheriff\'s deputy Rick Grimes awakens from a coma to find a world overrun by zombies.',
    duration: 60,
    isGenreHighlight: true,
  },
  {
    title: 'Paid Programming',
    synopsis: 'Commercial programming.',
    duration: 30,
    isGenreHighlight: false,
  },
  {
    title: 'Local News',
    synopsis: 'Local news coverage and weather updates.',
    duration: 30,
    isGenreHighlight: false,
  },
  {
    title: 'Supernatural',
    synopsis: 'Two brothers follow their father\'s footsteps as hunters, fighting evil supernatural beings.',
    duration: 60,
    isGenreHighlight: true,
  },
]

/**
 * Generate mock EPG schedule for a given time window
 */
export function generateMockEPGSchedule(
  startTime: Date,
  hours: number = 6
): EPGScheduleItem[] {
  const schedules: EPGScheduleItem[] = []
  const allPrograms = [...HORROR_PROGRAMS, ...REGULAR_PROGRAMS]

  MOCK_CHANNELS.forEach((channel, channelIndex) => {
    let currentTime = new Date(startTime)
    const endTime = addMinutes(startTime, hours * 60)

    // Seed randomness per channel for consistency
    let programIndex = channelIndex * 3

    while (currentTime < endTime) {
      // Pick a program (favor horror on horror-focused channels)
      const isHorrorChannel = ['Shudder TV', 'Chiller', 'AMC', 'SyFy'].includes(channel)
      const useHorror = isHorrorChannel ? Math.random() > 0.3 : Math.random() > 0.7
      const programPool = useHorror ? HORROR_PROGRAMS : REGULAR_PROGRAMS
      const program = programPool[programIndex % programPool.length]

      const programStart = new Date(currentTime)
      const programEnd = addMinutes(programStart, program.duration)

      schedules.push({
        id: `${channel}-${programStart.getTime()}`,
        channel_id: channel.toLowerCase().replace(/\s+/g, '-'),
        channel_name: channel,
        start_time: programStart.toISOString(),
        end_time: programEnd.toISOString(),
        duration_minutes: program.duration,
        title: program.title,
        synopsis: program.synopsis,
        is_genre_highlight: program.isGenreHighlight,
        source: 'manual',
        imported_at: new Date().toISOString(),
      })

      currentTime = programEnd
      programIndex++
    }
  })

  return schedules
}

// ============================================
// STAFF PICKS / AVAILABILITY CARDS
// ============================================

export const MOCK_STAFF_PICKS: AvailabilityCard[] = [
  {
    id: 'pick-1',
    imdb_id: 'tt0087800',
    tmdb_id: '377',
    watchmode_id: '12345',
    title: 'A Nightmare on Elm Street',
    year: 1984,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Slasher', 'Supernatural'],
    is_genre_highlight: true,
    sources: [
      { service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/wGTpGGRMZmyFCcrY2YoxVTIBlli.jpg',
    backdrop_url: '',
    synopsis: 'Teenager Nancy Thompson must uncover the dark truth concealed by her parents after she and her friends become targeted by the vengeful ghost of a serial child murderer.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 7.5,
    rt_score: 94,
    letterboxd_rating: 3.7,
    editorial_tags: ['Staff Pick', '80s Horror'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: 'pick-2',
    imdb_id: 'tt0078748',
    tmdb_id: '348',
    watchmode_id: '12346',
    title: 'Alien',
    year: 1979,
    type: 'movie',
    genres: ['Horror', 'Science Fiction'],
    subgenres: ['Space Horror', 'Monster'],
    is_genre_highlight: true,
    sources: [
      { service: 'Hulu', service_id: '157', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg',
    backdrop_url: '',
    synopsis: 'The crew of a commercial spacecraft encounter a deadly lifeform after investigating a mysterious transmission.',
    runtime_minutes: 117,
    mpaa_rating: 'R',
    director: 'Ridley Scott',
    country: 'USA, UK',
    imdb_rating: 8.5,
    rt_score: 98,
    letterboxd_rating: 4.1,
    editorial_tags: ['Staff Pick', 'Classic'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: 'pick-3',
    imdb_id: 'tt0081505',
    tmdb_id: '694',
    watchmode_id: '12347',
    title: 'The Shining',
    year: 1980,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Psychological Horror', 'Haunted House'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/nRj5511mZdTl4saWEPoj9QroTIu.jpg',
    backdrop_url: '',
    synopsis: 'A family heads to an isolated hotel for the winter where a sinister presence influences the father into violence.',
    runtime_minutes: 146,
    mpaa_rating: 'R',
    director: 'Stanley Kubrick',
    country: 'USA, UK',
    imdb_rating: 8.4,
    rt_score: 83,
    letterboxd_rating: 4.2,
    editorial_tags: ['Staff Pick', 'Kubrick'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: 'pick-4',
    imdb_id: 'tt0084787',
    tmdb_id: '1091',
    watchmode_id: '12348',
    title: 'The Thing',
    year: 1982,
    type: 'movie',
    genres: ['Horror', 'Science Fiction'],
    subgenres: ['Body Horror', 'Paranoia'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Tubi', service_id: '73', type: 'free', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/tzGY49kseSE9QAKk47uuDGwnSCu.jpg',
    backdrop_url: '',
    synopsis: 'A research team in Antarctica is hunted by a shape-shifting alien that assumes the appearance of its victims.',
    runtime_minutes: 109,
    mpaa_rating: 'R',
    director: 'John Carpenter',
    country: 'USA',
    imdb_rating: 8.2,
    rt_score: 82,
    letterboxd_rating: 4.1,
    editorial_tags: ['Staff Pick', 'Practical Effects'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: 'pick-5',
    imdb_id: 'tt0077651',
    tmdb_id: '948',
    watchmode_id: '12349',
    title: 'Halloween',
    year: 1978,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [
      { service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'AMC+', service_id: '474', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/qVpCaBcnjRzGL3nOPHi6Sn5dGC0.jpg',
    backdrop_url: '',
    synopsis: 'Fifteen years after murdering his sister on Halloween night 1963, Michael Myers escapes from a mental hospital and returns to Haddonfield.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'John Carpenter',
    country: 'USA',
    imdb_rating: 7.7,
    rt_score: 96,
    letterboxd_rating: 3.9,
    editorial_tags: ['Staff Pick', 'Essential'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: 'pick-6',
    imdb_id: 'tt6751668',
    tmdb_id: '493922',
    watchmode_id: '12350',
    title: 'Hereditary',
    year: 2018,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Psychological Horror', 'Supernatural'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3kiDgUPTTqxYXFLxAL.jpg',
    backdrop_url: '',
    synopsis: 'A grieving family is haunted by tragic and disturbing occurrences after the death of their secretive grandmother.',
    runtime_minutes: 127,
    mpaa_rating: 'R',
    director: 'Ari Aster',
    country: 'USA',
    imdb_rating: 7.3,
    rt_score: 89,
    letterboxd_rating: 3.8,
    editorial_tags: ['Staff Pick', 'A24'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

// ============================================
// WHAT'S ON NOW
// ============================================

/**
 * Get programs currently airing, sorted with genre highlights first
 */
export function getWhatsOnNow(schedules: EPGScheduleItem[]): EPGScheduleItem[] {
  const now = new Date()

  const currentlyAiring = schedules.filter((schedule) => {
    const start = new Date(schedule.start_time)
    const end = new Date(schedule.end_time)
    return now >= start && now < end
  })

  // Sort: genre highlights first, then by channel
  return currentlyAiring.sort((a, b) => {
    if (a.is_genre_highlight && !b.is_genre_highlight) return -1
    if (!a.is_genre_highlight && b.is_genre_highlight) return 1
    return a.channel_name.localeCompare(b.channel_name)
  })
}

/**
 * Get schedule data for React Query
 */
export async function fetchMockEPGData(): Promise<{
  schedules: EPGScheduleItem[]
  channels: string[]
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  const now = new Date()
  const startTime = subMinutes(startOfHour(now), 30)
  const schedules = generateMockEPGSchedule(startTime, 8)

  return {
    schedules,
    channels: [...MOCK_CHANNELS],
  }
}

/**
 * Fetch staff picks
 */
export async function fetchStaffPicks(): Promise<AvailabilityCard[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return MOCK_STAFF_PICKS
}

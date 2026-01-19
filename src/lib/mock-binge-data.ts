/**
 * Mock Binge Data
 *
 * Curated lists and user lists for the Binge Now feature
 */

import type { AvailabilityCard, CuratedList } from '@/types'

// Helper to generate IDs
const cardId = (n: number) => `binge-card-${n.toString().padStart(4, '0')}`
const listId = (n: number) => `list-${n.toString().padStart(4, '0')}`

// ============================================
// FRANCHISE MOVIES
// ============================================

const NIGHTMARE_MOVIES: AvailabilityCard[] = [
  {
    id: cardId(1),
    imdb_id: 'tt0087800',
    tmdb_id: '377',
    watchmode_id: '1',
    title: 'A Nightmare on Elm Street',
    year: 1984,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/wGTpGGRMZmyFCcrY2YoxVTIBlli.jpg',
    backdrop_url: '',
    synopsis: 'The original nightmare begins.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 7.5,
    rt_score: 94,
    letterboxd_rating: 3.7,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(2),
    imdb_id: 'tt0089686',
    tmdb_id: '10679',
    watchmode_id: '2',
    title: "Nightmare on Elm Street 2: Freddy's Revenge",
    year: 1985,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/bXVLvK2uQsOsV3S3g3fJ5w8sLMf.jpg',
    backdrop_url: '',
    synopsis: 'Freddy returns to possess a teenage boy.',
    runtime_minutes: 87,
    mpaa_rating: 'R',
    director: 'Jack Sholder',
    country: 'USA',
    imdb_rating: 5.4,
    rt_score: 41,
    letterboxd_rating: 2.9,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(3),
    imdb_id: 'tt0093629',
    tmdb_id: '10680',
    watchmode_id: '3',
    title: 'Nightmare on Elm Street 3: Dream Warriors',
    year: 1987,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/sUqJgJt92brBfAjfXiYHUIcvmvb.jpg',
    backdrop_url: '',
    synopsis: 'A group of teens fight back in their dreams.',
    runtime_minutes: 96,
    mpaa_rating: 'R',
    director: 'Chuck Russell',
    country: 'USA',
    imdb_rating: 6.6,
    rt_score: 75,
    letterboxd_rating: 3.4,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(4),
    imdb_id: 'tt0095725',
    tmdb_id: '10681',
    watchmode_id: '4',
    title: 'Nightmare on Elm Street 4: The Dream Master',
    year: 1988,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/3XxJEtx0qFnfRCUoMqNLmOnSFPQ.jpg',
    backdrop_url: '',
    synopsis: 'A new dream master rises to fight Freddy.',
    runtime_minutes: 93,
    mpaa_rating: 'R',
    director: 'Renny Harlin',
    country: 'USA',
    imdb_rating: 5.8,
    rt_score: 49,
    letterboxd_rating: 2.9,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

const HALLOWEEN_MOVIES: AvailabilityCard[] = [
  {
    id: cardId(10),
    imdb_id: 'tt0077651',
    tmdb_id: '948',
    watchmode_id: '10',
    title: 'Halloween',
    year: 1978,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/qVpCaBcnjRzGL3nOPHi6Sn5dGC0.jpg',
    backdrop_url: '',
    synopsis: 'The night HE came home.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'John Carpenter',
    country: 'USA',
    imdb_rating: 7.7,
    rt_score: 96,
    letterboxd_rating: 3.9,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(11),
    imdb_id: 'tt0082495',
    tmdb_id: '11281',
    watchmode_id: '11',
    title: 'Halloween II',
    year: 1981,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/nkwOLMZlNm7JTAZKQR5JdMX4GUL.jpg',
    backdrop_url: '',
    synopsis: 'The nightmare continues at Haddonfield Memorial Hospital.',
    runtime_minutes: 92,
    mpaa_rating: 'R',
    director: 'Rick Rosenthal',
    country: 'USA',
    imdb_rating: 6.5,
    rt_score: 32,
    letterboxd_rating: 3.1,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(12),
    imdb_id: 'tt0085636',
    tmdb_id: '11282',
    watchmode_id: '12',
    title: 'Halloween III: Season of the Witch',
    year: 1982,
    type: 'movie',
    genres: ['Horror', 'Sci-Fi'],
    subgenres: ['Cult'],
    is_genre_highlight: true,
    sources: [{ service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/5kNY32kIwCz6aJuQBIWuCIKSVJX.jpg',
    backdrop_url: '',
    synopsis: 'A different kind of Halloween terror.',
    runtime_minutes: 98,
    mpaa_rating: 'R',
    director: 'Tommy Lee Wallace',
    country: 'USA',
    imdb_rating: 5.6,
    rt_score: 53,
    letterboxd_rating: 3.0,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(13),
    imdb_id: 'tt0095271',
    tmdb_id: '11283',
    watchmode_id: '13',
    title: 'Halloween 4: The Return of Michael Myers',
    year: 1988,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/wIRx0vFe9kLTvhGrCxbsZXqdzLV.jpg',
    backdrop_url: '',
    synopsis: 'Michael returns for his niece.',
    runtime_minutes: 88,
    mpaa_rating: 'R',
    director: 'Dwight H. Little',
    country: 'USA',
    imdb_rating: 5.9,
    rt_score: 30,
    letterboxd_rating: 2.9,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(14),
    imdb_id: 'tt0097474',
    tmdb_id: '11284',
    watchmode_id: '14',
    title: 'Halloween 5: The Revenge of Michael Myers',
    year: 1989,
    type: 'movie',
    genres: ['Horror'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [{ service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/nDnK2RoYQAT6cW0hnxVW4gAYgI.jpg',
    backdrop_url: '',
    synopsis: 'The terror continues one year later.',
    runtime_minutes: 96,
    mpaa_rating: 'R',
    director: 'Dominique Othenin-Girard',
    country: 'USA',
    imdb_rating: 5.1,
    rt_score: 13,
    letterboxd_rating: 2.5,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

const SCREAM_MOVIES: AvailabilityCard[] = [
  {
    id: cardId(20),
    imdb_id: 'tt0117571',
    tmdb_id: '4232',
    watchmode_id: '20',
    title: 'Scream',
    year: 1996,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Slasher', 'Meta'],
    is_genre_highlight: true,
    sources: [{ service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/1z7j4QjlVu4H1yYBpSmN7KMTMhU.jpg',
    backdrop_url: '',
    synopsis: "What's your favorite scary movie?",
    runtime_minutes: 111,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 7.4,
    rt_score: 79,
    letterboxd_rating: 3.7,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(21),
    imdb_id: 'tt0120082',
    tmdb_id: '4233',
    watchmode_id: '21',
    title: 'Scream 2',
    year: 1997,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Slasher', 'Meta'],
    is_genre_highlight: true,
    sources: [{ service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/uPyHqiTd7YjLc4Dw1sFAl7SKlya.jpg',
    backdrop_url: '',
    synopsis: 'Someone has taken their love of sequels too far.',
    runtime_minutes: 120,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 6.3,
    rt_score: 81,
    letterboxd_rating: 3.3,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(22),
    imdb_id: 'tt0134084',
    tmdb_id: '4234',
    watchmode_id: '22',
    title: 'Scream 3',
    year: 2000,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Slasher', 'Meta'],
    is_genre_highlight: true,
    sources: [{ service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/ldLrPEqCYWVRy8hj3G6XeR5YPBJ.jpg',
    backdrop_url: '',
    synopsis: 'The trilogy concludes in Hollywood.',
    runtime_minutes: 116,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 5.6,
    rt_score: 41,
    letterboxd_rating: 2.8,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(23),
    imdb_id: 'tt1262416',
    tmdb_id: '48593',
    watchmode_id: '23',
    title: 'Scream 4',
    year: 2011,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Slasher', 'Meta'],
    is_genre_highlight: true,
    sources: [{ service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/y5RKKqPSYG8b0p0R6FkhYCqB7S3.jpg',
    backdrop_url: '',
    synopsis: 'New decade. New rules.',
    runtime_minutes: 111,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 6.2,
    rt_score: 60,
    letterboxd_rating: 3.1,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

const A24_HORROR: AvailabilityCard[] = [
  {
    id: cardId(30),
    imdb_id: 'tt6751668',
    tmdb_id: '493922',
    watchmode_id: '30',
    title: 'Hereditary',
    year: 2018,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Psychological Horror'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3kiDgUPTTqxYXFLxAL.jpg',
    backdrop_url: '',
    synopsis: 'Every family tree hides a secret.',
    runtime_minutes: 127,
    mpaa_rating: 'R',
    director: 'Ari Aster',
    country: 'USA',
    imdb_rating: 7.3,
    rt_score: 89,
    letterboxd_rating: 3.8,
    editorial_tags: ['A24'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(31),
    imdb_id: 'tt7740496',
    tmdb_id: '530385',
    watchmode_id: '31',
    title: 'Midsommar',
    year: 2019,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Folk Horror'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/7LEI8ulZzO5gy9Ww2zVLxfES8f9.jpg',
    backdrop_url: '',
    synopsis: 'Let the festivities begin.',
    runtime_minutes: 148,
    mpaa_rating: 'R',
    director: 'Ari Aster',
    country: 'USA',
    imdb_rating: 7.1,
    rt_score: 83,
    letterboxd_rating: 3.6,
    editorial_tags: ['A24'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(32),
    imdb_id: 'tt3322940',
    tmdb_id: '336480',
    watchmode_id: '32',
    title: 'The Witch',
    year: 2015,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Folk Horror', 'Period'],
    is_genre_highlight: true,
    sources: [{ service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/zap5VZ3vsaSwDP0rLdKhMSLJvaZ.jpg',
    backdrop_url: '',
    synopsis: 'Wouldst thou like to live deliciously?',
    runtime_minutes: 92,
    mpaa_rating: 'R',
    director: 'Robert Eggers',
    country: 'USA',
    imdb_rating: 6.9,
    rt_score: 91,
    letterboxd_rating: 3.6,
    editorial_tags: ['A24'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(33),
    imdb_id: 'tt7784604',
    tmdb_id: '458220',
    watchmode_id: '33',
    title: 'Us',
    year: 2019,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Social Horror'],
    is_genre_highlight: true,
    sources: [{ service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/ux2dU1jQ2ACIMShzB3yP93Udpzc.jpg',
    backdrop_url: '',
    synopsis: 'Watch yourself.',
    runtime_minutes: 116,
    mpaa_rating: 'R',
    director: 'Jordan Peele',
    country: 'USA',
    imdb_rating: 6.8,
    rt_score: 93,
    letterboxd_rating: 3.5,
    editorial_tags: [],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: cardId(34),
    imdb_id: 'tt5052448',
    tmdb_id: '419430',
    watchmode_id: '34',
    title: 'Get Out',
    year: 2017,
    type: 'movie',
    genres: ['Horror', 'Thriller', 'Mystery'],
    subgenres: ['Social Horror'],
    is_genre_highlight: true,
    sources: [{ service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() }],
    poster_url: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdrop_url: '',
    synopsis: 'Just because you are invited, does not mean you are welcome.',
    runtime_minutes: 104,
    mpaa_rating: 'R',
    director: 'Jordan Peele',
    country: 'USA',
    imdb_rating: 7.7,
    rt_score: 98,
    letterboxd_rating: 3.9,
    editorial_tags: ['Oscar Winner'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

// Sample user watchlist
const USER_WATCHLIST: AvailabilityCard[] = [
  NIGHTMARE_MOVIES[0],
  HALLOWEEN_MOVIES[0],
  SCREAM_MOVIES[0],
  A24_HORROR[0],
  A24_HORROR[1],
]

// ============================================
// CURATED LISTS
// ============================================

export const EDITORIAL_LISTS: CuratedList[] = [
  {
    id: listId(1),
    title: 'Nightmare on Elm Street Marathon',
    slug: 'nightmare-marathon',
    description: 'Follow Freddy Krueger through the complete franchise. Sweet dreams!',
    cover_image: 'https://image.tmdb.org/t/p/w500/wGTpGGRMZmyFCcrY2YoxVTIBlli.jpg',
    cards: NIGHTMARE_MOVIES.map((c) => c.id),
    type: 'editorial',
    author: 'Horror Guide Team',
    featured: true,
    published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: listId(2),
    title: 'Halloween Complete Timeline',
    slug: 'halloween-timeline',
    description: 'Experience the Shape\'s reign of terror from 1978 to present. Multiple timelines, one unstoppable evil.',
    cover_image: 'https://image.tmdb.org/t/p/w500/qVpCaBcnjRzGL3nOPHi6Sn5dGC0.jpg',
    cards: HALLOWEEN_MOVIES.map((c) => c.id),
    type: 'editorial',
    author: 'Horror Guide Team',
    featured: true,
    published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: listId(3),
    title: 'Scream Series',
    slug: 'scream-series',
    description: 'The meta-horror franchise that reinvented slashers. What\'s your favorite scary movie?',
    cover_image: 'https://image.tmdb.org/t/p/w500/1z7j4QjlVu4H1yYBpSmN7KMTMhU.jpg',
    cards: SCREAM_MOVIES.map((c) => c.id),
    type: 'editorial',
    author: 'Horror Guide Team',
    featured: true,
    published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: listId(4),
    title: 'Elevated Horror: A24 & Beyond',
    slug: 'elevated-horror',
    description: 'The new wave of prestige horror that critics love. Artistic, atmospheric, and absolutely terrifying.',
    cover_image: 'https://image.tmdb.org/t/p/w500/p9fmuz2Oj3kiDgUPTTqxYXFLxAL.jpg',
    cards: A24_HORROR.map((c) => c.id),
    type: 'editorial',
    author: 'Horror Guide Team',
    featured: true,
    published: true,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const USER_LISTS: CuratedList[] = [
  {
    id: listId(100),
    title: 'My Watchlist',
    slug: 'my-watchlist',
    description: 'Movies I want to watch',
    cover_image: '',
    cards: USER_WATCHLIST.map((c) => c.id),
    type: 'user-watchlist',
    author: 'You',
    featured: false,
    published: false,
    published_at: '',
    updated_at: new Date().toISOString(),
  },
  {
    id: listId(101),
    title: 'Halloween Party Picks',
    slug: 'halloween-party',
    description: 'Perfect movies for a Halloween movie night',
    cover_image: '',
    cards: [HALLOWEEN_MOVIES[0].id, SCREAM_MOVIES[0].id, NIGHTMARE_MOVIES[0].id],
    type: 'user-custom',
    author: 'You',
    featured: false,
    published: false,
    published_at: '',
    updated_at: new Date().toISOString(),
  },
]

// ============================================
// DATA ACCESS FUNCTIONS
// ============================================

const ALL_CARDS: AvailabilityCard[] = [
  ...NIGHTMARE_MOVIES,
  ...HALLOWEEN_MOVIES,
  ...SCREAM_MOVIES,
  ...A24_HORROR,
]

/**
 * Get cards for a list by card IDs
 */
export function getCardsForList(cardIds: string[]): AvailabilityCard[] {
  return cardIds
    .map((id) => ALL_CARDS.find((c) => c.id === id))
    .filter((c): c is AvailabilityCard => c !== undefined)
}

/**
 * Get all binge data
 */
export interface BingeRow {
  list: CuratedList
  cards: AvailabilityCard[]
}

export function getBingeRows(filter: 'all' | 'editorial' | 'my-lists'): BingeRow[] {
  let lists: CuratedList[] = []

  switch (filter) {
    case 'editorial':
      lists = EDITORIAL_LISTS
      break
    case 'my-lists':
      lists = USER_LISTS
      break
    case 'all':
    default:
      lists = [...USER_LISTS, ...EDITORIAL_LISTS]
  }

  return lists.map((list) => ({
    list,
    cards: getCardsForList(list.cards),
  }))
}

/**
 * Simulate async fetch
 */
export async function fetchBingeRows(
  filter: 'all' | 'editorial' | 'my-lists'
): Promise<BingeRow[]> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  return getBingeRows(filter)
}

// ============================================
// LIST PAGE FUNCTIONS
// ============================================

const ALL_LISTS = [...EDITORIAL_LISTS, ...USER_LISTS]

/**
 * Get a list by its slug
 */
export function getListBySlug(slug: string): CuratedList | null {
  return ALL_LISTS.find((list) => list.slug === slug) || null
}

/**
 * Get list with cards by slug
 */
export interface ListWithCards {
  list: CuratedList
  cards: AvailabilityCard[]
}

export function getListWithCards(slug: string): ListWithCards | null {
  const list = getListBySlug(slug)
  if (!list) return null

  return {
    list,
    cards: getCardsForList(list.cards),
  }
}

/**
 * Fetch list by slug (async for React Query)
 */
export async function fetchListBySlug(slug: string): Promise<ListWithCards | null> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return getListWithCards(slug)
}

/**
 * Get related lists (same type, excluding current)
 */
export function getRelatedLists(currentSlug: string, limit: number = 3): CuratedList[] {
  const current = getListBySlug(currentSlug)
  if (!current) return []

  return EDITORIAL_LISTS
    .filter((list) => list.slug !== currentSlug)
    .slice(0, limit)
}

/**
 * Get all featured list slugs for static generation
 */
export function getFeaturedListSlugs(): string[] {
  return EDITORIAL_LISTS.filter((list) => list.featured).map((list) => list.slug)
}

/**
 * Get total runtime for a list
 */
export function getListTotalRuntime(cards: AvailabilityCard[]): number {
  return cards.reduce((total, card) => total + (card.runtime_minutes || 0), 0)
}

/**
 * Format runtime as hours and minutes
 */
export function formatTotalRuntime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

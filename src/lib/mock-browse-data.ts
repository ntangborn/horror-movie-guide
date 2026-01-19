/**
 * Mock Browse Data for MVP
 *
 * Extended dataset for testing the browse page filters
 * and infinite scroll functionality.
 */

import type { AvailabilityCard } from '@/types'
import {
  DECADE_OPTIONS,
  RUNTIME_OPTIONS,
  type FilterState,
} from '@/components/FilterBar'

// Helper to generate consistent IDs
const id = (n: number) => `mock-card-${n.toString().padStart(4, '0')}`

/**
 * Complete mock dataset for browsing
 */
export const MOCK_BROWSE_CARDS: AvailabilityCard[] = [
  // 1980s Horror Classics
  {
    id: id(1),
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
    synopsis: 'Teenager Nancy Thompson must uncover the dark truth concealed by her parents.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 7.5,
    rt_score: 94,
    letterboxd_rating: 3.7,
    editorial_tags: ['80s Horror'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(2),
    imdb_id: 'tt0077651',
    tmdb_id: '948',
    watchmode_id: '12346',
    title: 'Halloween',
    year: 1978,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [
      { service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/qVpCaBcnjRzGL3nOPHi6Sn5dGC0.jpg',
    backdrop_url: '',
    synopsis: 'Fifteen years after murdering his sister, Michael Myers escapes and returns to Haddonfield.',
    runtime_minutes: 91,
    mpaa_rating: 'R',
    director: 'John Carpenter',
    country: 'USA',
    imdb_rating: 7.7,
    rt_score: 96,
    letterboxd_rating: 3.9,
    editorial_tags: ['Essential'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(3),
    imdb_id: 'tt0081505',
    tmdb_id: '694',
    watchmode_id: '12347',
    title: 'The Shining',
    year: 1980,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Psychological Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/nRj5511mZdTl4saWEPoj9QroTIu.jpg',
    backdrop_url: '',
    synopsis: 'A family heads to an isolated hotel where a sinister presence influences the father.',
    runtime_minutes: 146,
    mpaa_rating: 'R',
    director: 'Stanley Kubrick',
    country: 'USA',
    imdb_rating: 8.4,
    rt_score: 83,
    letterboxd_rating: 4.2,
    editorial_tags: ['Kubrick'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(4),
    imdb_id: 'tt0084787',
    tmdb_id: '1091',
    watchmode_id: '12348',
    title: 'The Thing',
    year: 1982,
    type: 'movie',
    genres: ['Horror', 'Sci-Fi'],
    subgenres: ['Body Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Tubi', service_id: '73', type: 'free', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/tzGY49kseSE9QAKk47uuDGwnSCu.jpg',
    backdrop_url: '',
    synopsis: 'A research team in Antarctica is hunted by a shape-shifting alien.',
    runtime_minutes: 109,
    mpaa_rating: 'R',
    director: 'John Carpenter',
    country: 'USA',
    imdb_rating: 8.2,
    rt_score: 82,
    letterboxd_rating: 4.1,
    editorial_tags: ['Practical Effects'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(5),
    imdb_id: 'tt0078748',
    tmdb_id: '348',
    watchmode_id: '12349',
    title: 'Alien',
    year: 1979,
    type: 'movie',
    genres: ['Horror', 'Sci-Fi'],
    subgenres: ['Space Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Hulu', service_id: '157', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/vfrQk5IPloGg1v9Rzbh2Eg3VGyM.jpg',
    backdrop_url: '',
    synopsis: 'The crew of a commercial spacecraft encounter a deadly lifeform.',
    runtime_minutes: 117,
    mpaa_rating: 'R',
    director: 'Ridley Scott',
    country: 'USA',
    imdb_rating: 8.5,
    rt_score: 98,
    letterboxd_rating: 4.1,
    editorial_tags: ['Classic'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(6),
    imdb_id: 'tt0080761',
    tmdb_id: '11423',
    watchmode_id: '12350',
    title: 'Friday the 13th',
    year: 1980,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Slasher'],
    is_genre_highlight: true,
    sources: [
      { service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/HzrPn1gEHWixfMOvOehOTlHROo.jpg',
    backdrop_url: '',
    synopsis: 'A group of camp counselors are stalked and murdered by an unknown assailant.',
    runtime_minutes: 95,
    mpaa_rating: 'R',
    director: 'Sean S. Cunningham',
    country: 'USA',
    imdb_rating: 6.4,
    rt_score: 64,
    letterboxd_rating: 3.2,
    editorial_tags: ['Slasher'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(7),
    imdb_id: 'tt0082971',
    tmdb_id: '89',
    watchmode_id: '12351',
    title: 'An American Werewolf in London',
    year: 1981,
    type: 'movie',
    genres: ['Horror', 'Comedy'],
    subgenres: ['Werewolf'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/ttpvmDbxZ3q6PXZk3EjlYDviGLS.jpg',
    backdrop_url: '',
    synopsis: 'Two American college students are attacked by a werewolf during a backpacking trip.',
    runtime_minutes: 97,
    mpaa_rating: 'R',
    director: 'John Landis',
    country: 'USA',
    imdb_rating: 7.5,
    rt_score: 89,
    letterboxd_rating: 3.8,
    editorial_tags: ['Transformation'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // 1990s Horror
  {
    id: id(8),
    imdb_id: 'tt0117571',
    tmdb_id: '4232',
    watchmode_id: '12352',
    title: 'Scream',
    year: 1996,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Slasher', 'Meta'],
    is_genre_highlight: true,
    sources: [
      { service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/1z7j4QjlVu4H1yYBpSmN7KMTMhU.jpg',
    backdrop_url: '',
    synopsis: 'A year after her mother\'s murder, Sidney Prescott is terrorized by a masked killer.',
    runtime_minutes: 111,
    mpaa_rating: 'R',
    director: 'Wes Craven',
    country: 'USA',
    imdb_rating: 7.4,
    rt_score: 79,
    letterboxd_rating: 3.7,
    editorial_tags: ['Meta Horror'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(9),
    imdb_id: 'tt0103644',
    tmdb_id: '665',
    watchmode_id: '12353',
    title: 'Candyman',
    year: 1992,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Supernatural', 'Urban Legend'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/7fUzNoFbGZ4kKShLgpSFZawjfLh.jpg',
    backdrop_url: '',
    synopsis: 'A graduate student researches the legend of a hook-handed killer.',
    runtime_minutes: 99,
    mpaa_rating: 'R',
    director: 'Bernard Rose',
    country: 'USA',
    imdb_rating: 6.6,
    rt_score: 84,
    letterboxd_rating: 3.5,
    editorial_tags: ['Urban Horror'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(10),
    imdb_id: 'tt0107688',
    tmdb_id: '11626',
    watchmode_id: '12354',
    title: 'Leprechaun',
    year: 1993,
    type: 'movie',
    genres: ['Horror', 'Comedy'],
    subgenres: ['Creature Feature'],
    is_genre_highlight: true,
    sources: [
      { service: 'Tubi', service_id: '73', type: 'free', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/8f0r9i6dpWVUC5WMWO6LFFmkWl8.jpg',
    backdrop_url: '',
    synopsis: 'An evil leprechaun hunts those who have stolen his pot of gold.',
    runtime_minutes: 92,
    mpaa_rating: 'R',
    director: 'Mark Jones',
    country: 'USA',
    imdb_rating: 4.7,
    rt_score: 27,
    letterboxd_rating: 2.5,
    editorial_tags: ['Cult Classic'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // 2000s Horror
  {
    id: id(11),
    imdb_id: 'tt0289043',
    tmdb_id: '565',
    watchmode_id: '12355',
    title: 'The Ring',
    year: 2002,
    type: 'movie',
    genres: ['Horror', 'Mystery'],
    subgenres: ['Supernatural', 'J-Horror Remake'],
    is_genre_highlight: true,
    sources: [
      { service: 'Paramount+', service_id: '444', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/99Tvn9PjLdrlpBz6YAGGhBl3sWb.jpg',
    backdrop_url: '',
    synopsis: 'A journalist investigates a mysterious videotape that seems to cause death.',
    runtime_minutes: 115,
    mpaa_rating: 'PG-13',
    director: 'Gore Verbinski',
    country: 'USA',
    imdb_rating: 7.1,
    rt_score: 71,
    letterboxd_rating: 3.4,
    editorial_tags: ['J-Horror'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(12),
    imdb_id: 'tt0405159',
    tmdb_id: '1933',
    watchmode_id: '12356',
    title: 'Saw',
    year: 2004,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Torture Porn', 'Puzzle'],
    is_genre_highlight: true,
    sources: [
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/iUixASLB7MBnyJe3mzXAZVQzBcR.jpg',
    backdrop_url: '',
    synopsis: 'Two strangers wake up chained in a room with a dead body between them.',
    runtime_minutes: 103,
    mpaa_rating: 'R',
    director: 'James Wan',
    country: 'USA',
    imdb_rating: 7.6,
    rt_score: 50,
    letterboxd_rating: 3.5,
    editorial_tags: ['Twist Ending'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // 2010s Horror
  {
    id: id(13),
    imdb_id: 'tt1457767',
    tmdb_id: '38575',
    watchmode_id: '12357',
    title: 'The Conjuring',
    year: 2013,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Supernatural', 'Haunted House'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/wVYREutTvI2tmxr6ujrHT704wGF.jpg',
    backdrop_url: '',
    synopsis: 'Paranormal investigators help a family terrorized by a dark presence.',
    runtime_minutes: 112,
    mpaa_rating: 'R',
    director: 'James Wan',
    country: 'USA',
    imdb_rating: 7.5,
    rt_score: 86,
    letterboxd_rating: 3.6,
    editorial_tags: ['Based on True Story'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(14),
    imdb_id: 'tt5052448',
    tmdb_id: '419430',
    watchmode_id: '12358',
    title: 'Get Out',
    year: 2017,
    type: 'movie',
    genres: ['Horror', 'Thriller', 'Mystery'],
    subgenres: ['Social Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/tFXcEccSQMf3lfhfXKSU9iRBpa3.jpg',
    backdrop_url: '',
    synopsis: 'A young Black man visits his white girlfriend\'s family estate with sinister results.',
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
  {
    id: id(15),
    imdb_id: 'tt6751668',
    tmdb_id: '493922',
    watchmode_id: '12359',
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
    synopsis: 'A grieving family is haunted after the death of their secretive grandmother.',
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
  // 2020s Horror
  {
    id: id(16),
    imdb_id: 'tt10954984',
    tmdb_id: '631842',
    watchmode_id: '12360',
    title: 'Nope',
    year: 2022,
    type: 'movie',
    genres: ['Horror', 'Sci-Fi', 'Mystery'],
    subgenres: ['UFO', 'Spectacle'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/AcKVlWaNVVVFQwro3nLXqPljcYA.jpg',
    backdrop_url: '',
    synopsis: 'Ranch residents witness a mysterious phenomenon above their property.',
    runtime_minutes: 135,
    mpaa_rating: 'R',
    director: 'Jordan Peele',
    country: 'USA',
    imdb_rating: 6.8,
    rt_score: 83,
    letterboxd_rating: 3.5,
    editorial_tags: ['Spectacle Horror'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(17),
    imdb_id: 'tt7740496',
    tmdb_id: '530385',
    watchmode_id: '12361',
    title: 'Midsommar',
    year: 2019,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Folk Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/7LEI8ulZzO5gy9Ww2zVLxfES8f9.jpg',
    backdrop_url: '',
    synopsis: 'A couple travels to Sweden for a midsummer festival that becomes increasingly disturbing.',
    runtime_minutes: 148,
    mpaa_rating: 'R',
    director: 'Ari Aster',
    country: 'USA',
    imdb_rating: 7.1,
    rt_score: 83,
    letterboxd_rating: 3.6,
    editorial_tags: ['A24', 'Folk Horror'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // Sci-Fi
  {
    id: id(18),
    imdb_id: 'tt0088247',
    tmdb_id: '218',
    watchmode_id: '12362',
    title: 'The Terminator',
    year: 1984,
    type: 'movie',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    subgenres: ['Cyborg', 'Time Travel'],
    is_genre_highlight: true,
    sources: [
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/qvktm0BHcnmDpul0fqI9yE6ywPv.jpg',
    backdrop_url: '',
    synopsis: 'A cyborg assassin is sent back in time to kill the mother of humanity\'s future savior.',
    runtime_minutes: 107,
    mpaa_rating: 'R',
    director: 'James Cameron',
    country: 'USA',
    imdb_rating: 8.1,
    rt_score: 100,
    letterboxd_rating: 4.0,
    editorial_tags: ['Essential Sci-Fi'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(19),
    imdb_id: 'tt0090605',
    tmdb_id: '679',
    watchmode_id: '12363',
    title: 'Aliens',
    year: 1986,
    type: 'movie',
    genres: ['Sci-Fi', 'Action', 'Horror'],
    subgenres: ['Space Horror', 'War'],
    is_genre_highlight: true,
    sources: [
      { service: 'Hulu', service_id: '157', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/r1x5JGpyqZU8PYhbs4UcrO1Xb6x.jpg',
    backdrop_url: '',
    synopsis: 'Ellen Ripley returns to the planet where her crew encountered the hostile Alien creatures.',
    runtime_minutes: 137,
    mpaa_rating: 'R',
    director: 'James Cameron',
    country: 'USA',
    imdb_rating: 8.4,
    rt_score: 98,
    letterboxd_rating: 4.1,
    editorial_tags: ['Essential Sci-Fi'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // Thriller
  {
    id: id(20),
    imdb_id: 'tt0102926',
    tmdb_id: '274',
    watchmode_id: '12364',
    title: 'The Silence of the Lambs',
    year: 1991,
    type: 'movie',
    genres: ['Thriller', 'Horror', 'Drama'],
    subgenres: ['Psychological Thriller', 'Serial Killer'],
    is_genre_highlight: true,
    sources: [
      { service: 'Max', service_id: '387', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/rplLJ2hPcOQmkFhTqUte0MkEaO2.jpg',
    backdrop_url: '',
    synopsis: 'An FBI trainee seeks the advice of an imprisoned cannibal to catch another serial killer.',
    runtime_minutes: 118,
    mpaa_rating: 'R',
    director: 'Jonathan Demme',
    country: 'USA',
    imdb_rating: 8.6,
    rt_score: 96,
    letterboxd_rating: 4.2,
    editorial_tags: ['Oscar Winner', 'Essential'],
    featured: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  // More modern horror
  {
    id: id(21),
    imdb_id: 'tt7784604',
    tmdb_id: '458220',
    watchmode_id: '12365',
    title: 'Us',
    year: 2019,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Doppelganger'],
    is_genre_highlight: true,
    sources: [
      { service: 'Netflix', service_id: '203', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/ux2dU1jQ2ACIMShzB3yP93Udpzc.jpg',
    backdrop_url: '',
    synopsis: 'A family is attacked by mysterious doppelgangers during their vacation.',
    runtime_minutes: 116,
    mpaa_rating: 'R',
    director: 'Jordan Peele',
    country: 'USA',
    imdb_rating: 6.8,
    rt_score: 93,
    letterboxd_rating: 3.5,
    editorial_tags: [],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(22),
    imdb_id: 'tt1396484',
    tmdb_id: '52520',
    watchmode_id: '12366',
    title: 'It Follows',
    year: 2014,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Supernatural'],
    is_genre_highlight: true,
    sources: [
      { service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/4MrT4pVEqpvnLgJnJKuBbMCkAH5.jpg',
    backdrop_url: '',
    synopsis: 'A young woman is followed by an unknown supernatural force after a sexual encounter.',
    runtime_minutes: 100,
    mpaa_rating: 'R',
    director: 'David Robert Mitchell',
    country: 'USA',
    imdb_rating: 6.8,
    rt_score: 95,
    letterboxd_rating: 3.5,
    editorial_tags: ['Indie Horror'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(23),
    imdb_id: 'tt2321549',
    tmdb_id: '270303',
    watchmode_id: '12367',
    title: 'The Babadook',
    year: 2014,
    type: 'movie',
    genres: ['Horror', 'Drama'],
    subgenres: ['Psychological Horror'],
    is_genre_highlight: true,
    sources: [
      { service: 'Shudder', service_id: '251', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
      { service: 'Tubi', service_id: '73', type: 'free', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/6H3ZLuHMGQR4sWrBJdYJbWd3VPj.jpg',
    backdrop_url: '',
    synopsis: 'A single mother discovers a disturbing children\'s book that brings terror.',
    runtime_minutes: 94,
    mpaa_rating: 'NR',
    director: 'Jennifer Kent',
    country: 'Australia',
    imdb_rating: 6.8,
    rt_score: 98,
    letterboxd_rating: 3.6,
    editorial_tags: ['Indie Horror'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
  {
    id: id(24),
    imdb_id: 'tt1179904',
    tmdb_id: '23827',
    watchmode_id: '12368',
    title: 'The Strangers',
    year: 2008,
    type: 'movie',
    genres: ['Horror', 'Thriller'],
    subgenres: ['Home Invasion'],
    is_genre_highlight: true,
    sources: [
      { service: 'Peacock', service_id: '389', type: 'subscription', deep_link: '', region: 'US', last_verified: new Date().toISOString() },
    ],
    poster_url: 'https://image.tmdb.org/t/p/w500/qxQN1WCUphFB0UkFlBh0JEIqcz9.jpg',
    backdrop_url: '',
    synopsis: 'A couple is terrorized by three masked strangers at their remote vacation home.',
    runtime_minutes: 86,
    mpaa_rating: 'R',
    director: 'Bryan Bertino',
    country: 'USA',
    imdb_rating: 6.2,
    rt_score: 48,
    letterboxd_rating: 3.1,
    editorial_tags: ['Home Invasion'],
    featured: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    availability_checked_at: new Date().toISOString(),
  },
]

/**
 * Filter mock cards based on filter state
 */
export function filterMockCards(
  cards: AvailabilityCard[],
  filters: FilterState
): AvailabilityCard[] {
  let result = [...cards]

  // Genre filter
  if (filters.genre) {
    const genreSearch = filters.genre.toLowerCase()
    result = result.filter((card) =>
      card.genres.some((g) => g.toLowerCase().includes(genreSearch))
    )
  }

  // Decade filter
  if (filters.decade) {
    const decade = DECADE_OPTIONS.find((d) => d.value === filters.decade)
    if (decade) {
      result = result.filter(
        (card) => card.year >= decade.min && card.year <= decade.max
      )
    }
  }

  // Service filter
  if (filters.service) {
    const serviceSearch = filters.service.toLowerCase()
    result = result.filter((card) =>
      card.sources.some((s) => s.service.toLowerCase().includes(serviceSearch))
    )
  }

  // Runtime filter
  if (filters.runtime) {
    const runtime = RUNTIME_OPTIONS.find((r) => r.value === filters.runtime)
    if (runtime) {
      result = result.filter((card) => {
        if (runtime.min !== undefined && card.runtime_minutes < runtime.min) return false
        if (runtime.max !== undefined && card.runtime_minutes > runtime.max) return false
        return true
      })
    }
  }

  // Sorting
  switch (filters.sort) {
    case 'rating':
      result.sort((a, b) => (b.imdb_rating || 0) - (a.imdb_rating || 0))
      break
    case 'year_desc':
      result.sort((a, b) => b.year - a.year)
      break
    case 'year_asc':
      result.sort((a, b) => a.year - b.year)
      break
    case 'title':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'recently_added':
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      break
    default:
      // Default: genre highlights first, then rating
      result.sort((a, b) => {
        if (a.is_genre_highlight && !b.is_genre_highlight) return -1
        if (!a.is_genre_highlight && b.is_genre_highlight) return 1
        return (b.imdb_rating || 0) - (a.imdb_rating || 0)
      })
  }

  return result
}

/**
 * Paginate mock cards
 */
export function paginateMockCards(
  cards: AvailabilityCard[],
  page: number,
  pageSize: number = 24
): {
  cards: AvailabilityCard[]
  totalCount: number
  hasMore: boolean
} {
  const start = page * pageSize
  const end = start + pageSize

  return {
    cards: cards.slice(start, end),
    totalCount: cards.length,
    hasMore: end < cards.length,
  }
}

/**
 * Fetch mock cards with simulated delay
 */
export async function fetchMockBrowseCards(
  filters: FilterState,
  page: number = 0
): Promise<{
  cards: AvailabilityCard[]
  nextPage: number | null
  totalCount: number
}> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const filtered = filterMockCards(MOCK_BROWSE_CARDS, filters)
  const { cards, totalCount, hasMore } = paginateMockCards(filtered, page, 12)

  return {
    cards,
    totalCount,
    nextPage: hasMore ? page + 1 : null,
  }
}

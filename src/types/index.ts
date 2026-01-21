export interface StreamingSource {
  service: string
  service_id: string
  type: 'subscription' | 'free' | 'rent' | 'buy'
  deep_link: string
  url?: string // Alias for deep_link used by modal
  price?: number
  quality?: string
  region: string
  expires?: string
  last_verified: string
}

export type TrailerStatus = 'none' | 'pending' | 'approved' | 'rejected'

export interface AvailabilityCard {
  id: string
  imdb_id: string
  tmdb_id: string
  watchmode_id: string
  title: string
  year: number
  type: 'movie' | 'series'
  genres: string[]
  subgenres: string[]
  is_genre_highlight: boolean
  sources: StreamingSource[]
  poster_url: string
  backdrop_url: string
  synopsis: string
  runtime_minutes: number
  mpaa_rating: string
  director: string
  country: string
  imdb_rating: number
  rt_score: number
  letterboxd_rating: number
  editorial_tags: string[]
  featured: boolean
  created_at: string
  updated_at: string
  availability_checked_at: string
  // Trailer fields
  trailer_youtube_id?: string
  trailer_video_title?: string
  trailer_channel?: string
  trailer_embed_code?: string
  trailer_status?: TrailerStatus
  trailer_reviewed_at?: string
  trailer_scraped_at?: string
}

export interface EPGScheduleItem {
  id: string
  channel_id: string
  channel_name: string
  start_time: string
  end_time: string
  duration_minutes: number
  card_id?: string
  title: string
  synopsis: string
  is_genre_highlight: boolean
  source: 'api' | 'spreadsheet' | 'manual'
  imported_at: string
}

export interface CuratedList {
  id: string
  title: string
  slug: string
  description: string
  cover_image: string
  cards: string[]
  type: 'editorial' | 'user-watchlist' | 'user-custom'
  author: string
  featured: boolean
  published: boolean
  published_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  substack_tier: string
  connected_services: string[]
  watchlist: string[]
  favorites: string[]
  watched: string[]
  custom_lists: string[]
  onboarding_completed: boolean
  email_notifications: boolean
  created_at: string
  last_active: string
}

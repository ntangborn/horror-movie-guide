'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Ghost,
  ArrowLeft,
  Users,
  Loader2,
  Film,
  Star,
  Clock,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { useCommunityList } from '@/hooks/useCommunityLists'
import { useTitleModal } from '@/contexts/TitleModalContext'
import type { AvailabilityCard } from '@/types'

/**
 * Format runtime to "Xhr Ym" format
 */
function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Format date to readable string
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Get display name from email
 */
function getDisplayName(email: string): string {
  if (!email || email === 'Anonymous') return 'Anonymous'
  const name = email.split('@')[0]
  return name.charAt(0).toUpperCase() + name.slice(1)
}

/**
 * Movie card component for the list
 */
function MovieCard({
  card,
  onClick,
}: {
  card: AvailabilityCard
  onClick: (card: AvailabilityCard) => void
}) {
  const runtime = formatRuntime(card.runtime_minutes)

  return (
    <div
      onClick={() => onClick(card)}
      className="group bg-[#1a1a1a] border border-gray-800 rounded-lg overflow-hidden cursor-pointer hover:border-gray-700 transition-all"
    >
      <div className="flex items-stretch">
        {/* Poster */}
        <div className="relative w-20 aspect-[2/3] flex-shrink-0">
          {card.poster_url ? (
            <Image
              src={card.poster_url}
              alt={card.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[#252525] flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 p-4 group-hover:bg-[#252525] transition-colors">
          <h3 className="font-medium text-white mb-1 line-clamp-1">
            {card.title}
          </h3>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <span>{card.year}</span>
            {runtime && (
              <>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {runtime}
                </span>
              </>
            )}
            {card.imdb_rating > 0 && (
              <>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                  {card.imdb_rating.toFixed(1)}
                </span>
              </>
            )}
          </div>
          {card.genres && card.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {card.genres.slice(0, 3).map((genre) => (
                <span
                  key={genre}
                  className="px-2 py-0.5 text-xs bg-gray-800 text-gray-400 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Watch button */}
        {card.sources && card.sources.length > 0 && (
          <div className="flex items-center px-4 border-l border-gray-800">
            <a
              href={card.sources[0].deep_link || card.sources[0].url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              title={`Watch on ${card.sources[0].service}`}
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Community List Detail Page
 */
export default function CommunityListPage({
  params,
}: {
  params: { slug: string }
}) {
  const { slug } = params
  const { list, isLoading, error } = useCommunityList(slug)
  const { openModal } = useTitleModal()

  const handleCardClick = (card: AvailabilityCard) => {
    openModal(card, false)
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/community"
                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {isLoading ? 'Loading...' : list?.name || 'Community List'}
                  </h1>
                  {list && (
                    <p className="text-sm text-gray-500">
                      {list.card_count} {list.card_count === 1 ? 'movie' : 'movies'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Link href="/" className="flex items-center gap-2 group">
              <Ghost className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden sm:block">
                Ghost Guide
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-center">
            <p className="text-red-400">
              {error.message === 'List not found' ? 'List not found' : 'Failed to load list'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {error.message === 'List not found'
                ? 'This list may have been deleted or made private.'
                : 'Please try again later'}
            </p>
            <Link
              href="/community"
              className="inline-flex items-center gap-2 mt-4 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Community
            </Link>
          </div>
        )}

        {/* List content */}
        {!isLoading && !error && list && (
          <>
            {/* List info */}
            <div className="mb-8 p-6 bg-[#1a1a1a] border border-gray-800 rounded-xl">
              {list.description && (
                <p className="text-gray-300 mb-4">{list.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  {getDisplayName(list.user_email)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {formatDate(list.created_at)}
                </span>
              </div>
            </div>

            {/* Movies list */}
            <div className="space-y-3">
              {list.cards.map((card) => (
                <MovieCard
                  key={card.id}
                  card={card}
                  onClick={handleCardClick}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

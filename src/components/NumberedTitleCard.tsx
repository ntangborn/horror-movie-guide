'use client'

import Image from 'next/image'
import { Film, Star } from 'lucide-react'
import { useTitleModal } from '@/contexts/TitleModalContext'
import type { AvailabilityCard } from '@/types'

interface NumberedTitleCardProps {
  card: AvailabilityCard
  position: number
  onSelect?: (card: AvailabilityCard) => void
}

/**
 * Format runtime to hours and minutes
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
 * Get primary streaming service
 */
function getPrimaryService(card: AvailabilityCard): string | null {
  if (!card.sources || card.sources.length === 0) return null
  return card.sources[0].service
}

/**
 * Service color mapping
 */
const SERVICE_COLORS: Record<string, string> = {
  shudder: '#E50914',
  netflix: '#E50914',
  'amazon prime': '#00A8E1',
  'prime video': '#00A8E1',
  hulu: '#1CE783',
  tubi: '#FA5C28',
  max: '#B026FF',
  peacock: '#000000',
  'paramount+': '#0064FF',
}

function getServiceColor(service: string): string {
  return SERVICE_COLORS[service.toLowerCase()] || '#6B7280'
}

/**
 * Numbered Title Card Component
 *
 * A title card with a large position number indicator,
 * designed for curated list pages.
 */
export function NumberedTitleCard({ card, position, onSelect }: NumberedTitleCardProps) {
  const { openModal } = useTitleModal()
  const runtime = formatRuntime(card.runtime_minutes)
  const service = getPrimaryService(card)

  const handleClick = () => {
    // Open the detail modal
    openModal(card)
    // Also call onSelect callback if provided
    if (onSelect) {
      onSelect(card)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="
        group relative flex gap-4 p-4 rounded-xl
        bg-[#141414] hover:bg-[#1a1a1a] border border-gray-800/50 hover:border-purple-500/30
        transition-all duration-300 cursor-pointer
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0a]
      "
    >
      {/* Position Number */}
      <div className="flex-shrink-0 w-12 flex items-center justify-center">
        <span
          className="
            text-4xl font-bold text-transparent bg-clip-text
            bg-gradient-to-b from-gray-500 to-gray-700
            group-hover:from-purple-400 group-hover:to-purple-600
            transition-all duration-300
          "
        >
          {position}
        </span>
      </div>

      {/* Poster */}
      <div className="relative w-20 md:w-24 flex-shrink-0">
        <div className="aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a1a]">
          {card.poster_url ? (
            <Image
              src={card.poster_url}
              alt={`${card.title} poster`}
              fill
              sizes="100px"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Service badge */}
        {service && (
          <div
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-lg"
            style={{ backgroundColor: getServiceColor(service) }}
            title={service}
          >
            {service.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className="font-semibold text-white text-lg group-hover:text-purple-300 transition-colors line-clamp-1">
          {card.title}
        </h3>

        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
          <span>{card.year}</span>
          {runtime && (
            <>
              <span className="text-gray-600">•</span>
              <span>{runtime}</span>
            </>
          )}
          {card.mpaa_rating && (
            <>
              <span className="text-gray-600">•</span>
              <span className="px-1.5 py-0.5 bg-gray-800 rounded text-xs">
                {card.mpaa_rating}
              </span>
            </>
          )}
        </div>

        {/* Synopsis preview */}
        <p className="mt-2 text-sm text-gray-500 line-clamp-2 hidden md:block">
          {card.synopsis}
        </p>

        {/* Genres and rating */}
        <div className="flex items-center gap-3 mt-3">
          {/* Genres */}
          <div className="flex gap-1.5">
            {card.genres.slice(0, 2).map((genre) => (
              <span
                key={genre}
                className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-400"
              >
                {genre}
              </span>
            ))}
          </div>

          {/* Rating */}
          {card.imdb_rating > 0 && (
            <div className="flex items-center gap-1 ml-auto">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span className="text-sm text-white font-medium">
                {card.imdb_rating.toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NumberedTitleCard

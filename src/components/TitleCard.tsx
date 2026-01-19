'use client'

import Image from 'next/image'
import { Film, Heart, Loader2 } from 'lucide-react'
import { useTitleModal } from '@/contexts/TitleModalContext'
import { useWatchlist } from '@/hooks/useWatchlist'
import { POSTER_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils'
import type { AvailabilityCard } from '@/types'

interface TitleCardProps {
  card: AvailabilityCard
  onSelect?: (card: AvailabilityCard) => void
  isEPGItem?: boolean
  showWatchlistButton?: boolean
  onRemoveFromWatchlist?: (cardId: string) => void
}

/**
 * Service color mapping for streaming badges
 */
const SERVICE_COLORS: Record<string, string> = {
  shudder: '#E50914',
  netflix: '#E50914',
  'amazon prime': '#00A8E1',
  'prime video': '#00A8E1',
  hulu: '#1CE783',
  tubi: '#FA5C28',
  'tubi tv': '#FA5C28',
  peacock: '#000000',
  'hbo max': '#B026FF',
  max: '#B026FF',
  'paramount+': '#0064FF',
  'paramount plus': '#0064FF',
  'apple tv+': '#000000',
  'apple tv plus': '#000000',
  'disney+': '#113CCF',
  'disney plus': '#113CCF',
  freevee: '#35B4A7',
  pluto: '#151515',
  'pluto tv': '#151515',
  crackle: '#FDC500',
  'amc+': '#00B359',
}

/**
 * Get color for a streaming service
 */
function getServiceColor(serviceName: string): string {
  const normalized = serviceName.toLowerCase().trim()
  return SERVICE_COLORS[normalized] || '#6B7280' // gray-500 default
}

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
 * Get unique streaming services from sources
 */
function getUniqueServices(
  sources: AvailabilityCard['sources']
): Array<{ name: string; color: string }> {
  const seen = new Set<string>()
  const services: Array<{ name: string; color: string }> = []

  for (const source of sources) {
    const normalized = source.service.toLowerCase().trim()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      services.push({
        name: source.service,
        color: getServiceColor(source.service),
      })
    }
  }

  return services.slice(0, 5) // Limit to 5 badges
}

export function TitleCard({
  card,
  onSelect,
  isEPGItem = false,
  showWatchlistButton = true,
  onRemoveFromWatchlist,
}: TitleCardProps) {
  const { openModal } = useTitleModal()
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isAdding, isRemoving } = useWatchlist()
  const runtime = formatRuntime(card.runtime_minutes)
  const services = getUniqueServices(card.sources)
  const hasMoreServices = card.sources.length > 5
  const inWatchlist = isInWatchlist(card.id)
  const isWatchlistLoading = isAdding || isRemoving

  const handleClick = () => {
    // Open the detail modal
    openModal(card, isEPGItem)
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

  const handleWatchlistClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click
    if (inWatchlist) {
      removeFromWatchlist(card.id)
      onRemoveFromWatchlist?.(card.id)
    } else {
      addToWatchlist(card.id)
    }
  }

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className={`
        group relative cursor-pointer rounded-lg overflow-hidden
        bg-[#242424] transition-all duration-300 ease-out
        hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-900/20
        focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]
        ${card.is_genre_highlight ? 'border-l-4 border-purple-500' : ''}
      `}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#1a1a1a]">
        {card.poster_url ? (
          <Image
            src={card.poster_url}
            alt={`${card.title} poster`}
            fill
            sizes={IMAGE_SIZES.posterGrid}
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            placeholder="blur"
            blurDataURL={POSTER_BLUR_DATA_URL}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-600">
            <Film className="w-12 h-12 mb-2" />
            <span className="text-xs text-center px-2">No Poster</span>
          </div>
        )}

        {/* Watchlist button */}
        {showWatchlistButton && (
          <button
            onClick={handleWatchlistClick}
            disabled={isWatchlistLoading}
            className={`
              absolute top-2 right-2 z-10 p-2 rounded-full
              transition-all duration-200
              opacity-0 group-hover:opacity-100 focus:opacity-100
              ${inWatchlist
                ? 'bg-red-600 text-white'
                : 'bg-black/60 text-white hover:bg-black/80'
              }
              disabled:opacity-50
            `}
            aria-label={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {isWatchlistLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Heart className={`w-4 h-4 ${inWatchlist ? 'fill-current' : ''}`} />
            )}
          </button>
        )}

        {/* Gradient overlay for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#242424] to-transparent" />

        {/* Service badges - positioned at bottom of poster */}
        {services.length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-wrap gap-1.5">
            {services.map((service) => (
              <span
                key={service.name}
                title={service.name}
                className="w-2.5 h-2.5 rounded-full ring-1 ring-black/20"
                style={{ backgroundColor: service.color }}
              />
            ))}
            {hasMoreServices && (
              <span className="text-[10px] text-gray-400 leading-none flex items-center">
                +{card.sources.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 space-y-1">
        {/* Title */}
        <h3 className="font-medium text-white text-sm leading-tight line-clamp-2 group-hover:text-purple-300 transition-colors">
          {card.title}
        </h3>

        {/* Year and Runtime */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>{card.year}</span>
          {runtime && (
            <>
              <span className="text-gray-600">•</span>
              <span>{runtime}</span>
            </>
          )}
        </div>

        {/* Rating badge (if available) */}
        {card.imdb_rating > 0 && (
          <div className="flex items-center gap-1 pt-1">
            <span className="text-yellow-500 text-xs">★</span>
            <span className="text-xs text-gray-300">{card.imdb_rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Genre highlight indicator glow effect */}
      {card.is_genre_highlight && (
        <div className="absolute inset-0 pointer-events-none rounded-lg ring-1 ring-inset ring-purple-500/20" />
      )}
    </div>
  )
}

export default TitleCard

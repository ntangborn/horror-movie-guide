'use client'

import { useRef, useState, useEffect } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, Star, Film } from 'lucide-react'
import type { AvailabilityCard } from '@/types'

interface StaffPicksCarouselProps {
  picks: AvailabilityCard[]
  loading?: boolean
  onSelect?: (card: AvailabilityCard) => void
}

/**
 * Format runtime to hours and minutes
 */
function formatRuntime(minutes: number): string {
  if (!minutes) return ''
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
 * Skeleton card for loading state
 */
function SkeletonCard() {
  return (
    <div className="flex-shrink-0 w-[300px] md:w-[350px] animate-pulse">
      <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a]">
        <div className="aspect-[16/9] bg-[#252525]" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="h-6 bg-[#333] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#333] rounded w-1/2" />
        </div>
      </div>
    </div>
  )
}

/**
 * Staff Pick Card Component
 */
function StaffPickCard({
  card,
  onSelect,
}: {
  card: AvailabilityCard
  onSelect?: (card: AvailabilityCard) => void
}) {
  const service = getPrimaryService(card)

  return (
    <div
      onClick={() => onSelect?.(card)}
      className="flex-shrink-0 w-[300px] md:w-[350px] cursor-pointer group"
    >
      <div className="relative rounded-xl overflow-hidden bg-[#1a1a1a] transition-all duration-300 group-hover:ring-2 group-hover:ring-purple-500 group-hover:shadow-xl group-hover:shadow-purple-900/30">
        {/* Backdrop/Poster Image */}
        <div className="relative aspect-[16/9]">
          {card.poster_url ? (
            <Image
              src={card.poster_url}
              alt={card.title}
              fill
              sizes="350px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center">
              <Film className="w-12 h-12 text-gray-600" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Staff Pick badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 fill-current" />
              STAFF PICK
            </div>
          </div>

          {/* Service badge */}
          {service && (
            <div className="absolute top-3 right-3">
              <div className="bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
                {service}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-lg font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">
              {card.title}
            </h3>

            <div className="flex items-center gap-3 text-sm text-gray-300">
              <span>{card.year}</span>
              {card.runtime_minutes > 0 && (
                <>
                  <span className="text-gray-600">•</span>
                  <span>{formatRuntime(card.runtime_minutes)}</span>
                </>
              )}
              {card.imdb_rating > 0 && (
                <>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    {card.imdb_rating.toFixed(1)}
                  </span>
                </>
              )}
            </div>

            {/* Genres */}
            <div className="flex gap-2 mt-2">
              {card.genres.slice(0, 2).map((genre) => (
                <span
                  key={genre}
                  className="text-xs bg-white/10 text-gray-300 px-2 py-0.5 rounded"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Staff Picks Carousel Component
 */
export function StaffPicksCarousel({
  picks,
  loading = false,
  onSelect,
}: StaffPicksCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1)
    }
  }

  useEffect(() => {
    updateScrollState()
    const ref = scrollRef.current
    if (ref) {
      ref.addEventListener('scroll', updateScrollState)
      window.addEventListener('resize', updateScrollState)
      return () => {
        ref.removeEventListener('scroll', updateScrollState)
        window.removeEventListener('resize', updateScrollState)
      }
    }
  }, [picks])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 370 // Card width + gap
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    }
  }

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Staff Picks</h2>
            <p className="text-gray-500 text-sm mt-1">Curated by our horror experts</p>
          </div>
        </div>

        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (!picks || picks.length === 0) {
    return null
  }

  return (
    <section className="py-8 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Staff Picks</h2>
          <p className="text-gray-500 text-sm mt-1">Curated by our horror experts</p>
        </div>

        {/* Navigation buttons - desktop */}
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-colors ${
              canScrollLeft
                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white'
                : 'bg-[#1a1a1a]/50 text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-colors ${
              canScrollRight
                ? 'bg-[#1a1a1a] hover:bg-[#252525] text-white'
                : 'bg-[#1a1a1a]/50 text-gray-600 cursor-not-allowed'
            }`}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Gradient fades */}
        {canScrollLeft && (
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}
        {canScrollRight && (
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
        )}

        {/* Scrollable container */}
        <div
          ref={scrollRef}
          className="flex gap-5 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {picks.map((card) => (
            <StaffPickCard key={card.id} card={card} onSelect={onSelect} />
          ))}

          {/* End spacer */}
          <div className="flex-shrink-0 w-4" />
        </div>
      </div>
    </section>
  )
}

export default StaffPicksCarousel

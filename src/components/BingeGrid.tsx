'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import {
  ChevronLeft,
  ChevronRight,
  Check,
  Play,
  Film,
  Tv,
  List,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useTitleModal } from '@/contexts/TitleModalContext'
import type { AvailabilityCard, CuratedList } from '@/types'

interface BingeRow {
  list: CuratedList
  cards: AvailabilityCard[]
}

interface BingeGridProps {
  rows: BingeRow[]
  onCardSelect?: (card: AvailabilityCard, list: CuratedList) => void
  onListSelect?: (list: CuratedList) => void
  watchedItems?: Set<string>
  onToggleWatched?: (cardId: string) => void
}

// Constants
const ROW_HEADER_WIDTH = 200
const CARD_WIDTH = 140
const CARD_GAP = 12

/**
 * Get primary streaming service from card sources
 */
function getPrimaryService(card: AvailabilityCard): { name: string; color: string } | null {
  if (!card.sources || card.sources.length === 0) return null

  const source = card.sources[0]
  const colors: Record<string, string> = {
    shudder: '#E50914',
    netflix: '#E50914',
    'amazon prime': '#00A8E1',
    'prime video': '#00A8E1',
    hulu: '#1CE783',
    tubi: '#FA5C28',
    'hbo max': '#B026FF',
    max: '#B026FF',
    peacock: '#000000',
    'paramount+': '#0064FF',
    'disney+': '#113CCF',
    'apple tv+': '#000000',
  }

  const normalized = source.service.toLowerCase().trim()
  return {
    name: source.service,
    color: colors[normalized] || '#6B7280',
  }
}

/**
 * Get list type icon
 */
function getListIcon(type: CuratedList['type']) {
  switch (type) {
    case 'editorial':
      return <List className="w-4 h-4" />
    case 'user-watchlist':
      return <Tv className="w-4 h-4" />
    default:
      return <Film className="w-4 h-4" />
  }
}

/**
 * Individual binge card component
 */
function BingeCard({
  card,
  index,
  isWatched,
  isContinuePoint,
  onSelect,
  onToggleWatched,
}: {
  card: AvailabilityCard
  index: number
  isWatched: boolean
  isContinuePoint: boolean
  onSelect?: () => void
  onToggleWatched?: () => void
}) {
  const { openModal } = useTitleModal()
  const service = getPrimaryService(card)

  const handleCardClick = () => {
    openModal(card)
    onSelect?.()
  }

  const handleWatchedClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleWatched?.()
  }

  return (
    <div
      className={`
        relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-300 ease-out group
        ${isWatched ? 'opacity-60' : 'opacity-100'}
        ${isContinuePoint ? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0a0a0a]' : ''}
        hover:scale-105 hover:z-10 hover:shadow-xl hover:shadow-purple-900/30
      `}
      style={{ width: `${CARD_WIDTH}px` }}
      onClick={handleCardClick}
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] bg-[#1a1a1a]">
        {card.poster_url ? (
          <Image
            src={card.poster_url}
            alt={card.title}
            fill
            sizes="140px"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-600" />
          </div>
        )}

        {/* Watched overlay */}
        {isWatched && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-green-500/90 flex items-center justify-center">
              <Check className="w-6 h-6 text-white" />
            </div>
          </div>
        )}

        {/* Continue from here badge */}
        {isContinuePoint && !isWatched && (
          <div className="absolute top-2 left-2 right-2">
            <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-full text-center flex items-center justify-center gap-1">
              <Play className="w-3 h-3" />
              CONTINUE
            </div>
          </div>
        )}

        {/* Episode number badge */}
        <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs font-medium px-2 py-0.5 rounded">
          #{index + 1}
        </div>

        {/* Service badge */}
        {service && (
          <div
            className="absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
            style={{ backgroundColor: service.color }}
            title={service.name}
          >
            {service.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Hover controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-0 left-0 right-0 p-2">
            <button
              onClick={handleWatchedClick}
              className={`
                w-full py-1.5 rounded text-xs font-medium transition-colors
                ${
                  isWatched
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-green-600 text-white hover:bg-green-500'
                }
              `}
            >
              {isWatched ? 'Unmark' : 'Mark Watched'}
            </button>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="p-2 bg-[#1a1a1a]">
        <h4 className="text-xs font-medium text-white truncate leading-tight">
          {card.title}
        </h4>
        <p className="text-[10px] text-gray-500 mt-0.5">{card.year}</p>
      </div>
    </div>
  )
}

/**
 * Binge row component with horizontal scrolling
 */
function BingeRow({
  row,
  watchedItems,
  onCardSelect,
  onListSelect,
  onToggleWatched,
}: {
  row: BingeRow
  watchedItems: Set<string>
  onCardSelect?: (card: AvailabilityCard, list: CuratedList) => void
  onListSelect?: (list: CuratedList) => void
  onToggleWatched?: (cardId: string) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate progress
  const watchedCount = row.cards.filter((c) => watchedItems.has(c.id)).length
  const totalCount = row.cards.length
  const progressPercent = totalCount > 0 ? (watchedCount / totalCount) * 100 : 0

  // Find continue point (first unwatched item)
  const continueIndex = row.cards.findIndex((c) => !watchedItems.has(c.id))

  // Check scroll state
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
  }, [row.cards])

  // Scroll handlers
  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = (CARD_WIDTH + CARD_GAP) * 3
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -amount : amount,
        behavior: 'smooth',
      })
    }
  }

  // Scroll to continue point
  const scrollToContinue = () => {
    if (scrollRef.current && continueIndex >= 0) {
      const scrollTo = continueIndex * (CARD_WIDTH + CARD_GAP)
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' })
    }
  }

  return (
    <div className="border-b border-gray-800/50 last:border-b-0">
      <div className="flex">
        {/* Row Header */}
        <div
          className="flex-shrink-0 bg-[#0f0f0f] border-r border-gray-800/50 p-4"
          style={{ width: `${ROW_HEADER_WIDTH}px` }}
        >
          {/* Cover Image */}
          <div
            className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 cursor-pointer group"
            onClick={() => onListSelect?.(row.list)}
          >
            {row.list.cover_image ? (
              <Image
                src={row.list.cover_image}
                alt={row.list.title}
                fill
                sizes="180px"
                className="object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-purple-600 flex items-center justify-center">
                {getListIcon(row.list.type)}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
          </div>

          {/* Title */}
          <h3
            className="font-semibold text-white text-sm leading-tight mb-1 cursor-pointer hover:text-purple-300 transition-colors"
            onClick={() => onListSelect?.(row.list)}
          >
            {row.list.title}
          </h3>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-2">
            <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 whitespace-nowrap">
              {watchedCount}/{totalCount}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-1">
            {continueIndex >= 0 && continueIndex < totalCount && (
              <button
                onClick={scrollToContinue}
                className="flex-1 flex items-center justify-center gap-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-medium py-1.5 rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                Continue
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gray-400 rounded transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Cards Area */}
        <div className="flex-1 relative">
          {/* Scroll buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center shadow-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Gradient fades */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
          )}

          {/* Cards container */}
          <div
            ref={scrollRef}
            className="flex gap-3 p-4 overflow-x-auto scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {row.cards.map((card, index) => (
              <BingeCard
                key={card.id}
                card={card}
                index={index}
                isWatched={watchedItems.has(card.id)}
                isContinuePoint={index === continueIndex}
                onSelect={() => onCardSelect?.(card, row.list)}
                onToggleWatched={() => onToggleWatched?.(card.id)}
              />
            ))}

            {/* End spacer */}
            <div className="flex-shrink-0 w-4" />
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="bg-[#0f0f0f] border-t border-gray-800/50 px-4 py-3">
          <p className="text-sm text-gray-400 max-w-2xl">
            {row.list.description || 'No description available.'}
          </p>
          {row.list.author && (
            <p className="text-xs text-gray-600 mt-2">
              Curated by <span className="text-purple-400">{row.list.author}</span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * BingeGrid - Premium binge watching interface
 *
 * Displays multiple curated lists/series in a horizontally scrollable grid
 * with progress tracking and continue watching functionality.
 *
 * @example
 * ```tsx
 * <BingeGrid
 *   rows={[
 *     { list: fridayThe13thList, cards: fridayMovies },
 *     { list: nightmareList, cards: nightmareMovies },
 *   ]}
 *   watchedItems={userWatched}
 *   onCardSelect={(card, list) => openDetail(card)}
 *   onToggleWatched={(id) => toggleWatched(id)}
 * />
 * ```
 */
export function BingeGrid({
  rows,
  onCardSelect,
  onListSelect,
  watchedItems = new Set(),
  onToggleWatched,
}: BingeGridProps) {
  if (rows.length === 0) {
    return (
      <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#1a1a1a] flex items-center justify-center">
          <Tv className="w-8 h-8 text-gray-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-400 mb-2">No binge lists yet</h3>
        <p className="text-sm text-gray-600">
          Create a watchlist or explore curated collections to start binging!
        </p>
      </div>
    )
  }

  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0f0f0f] border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Play className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Binge Now</h2>
            <p className="text-xs text-gray-500">{rows.length} collections ready</p>
          </div>
        </div>

        <div className="text-xs text-gray-600">
          Track your progress &bull; Pick up where you left off
        </div>
      </div>

      {/* Rows */}
      <div>
        {rows.map((row) => (
          <BingeRow
            key={row.list.id}
            row={row}
            watchedItems={watchedItems}
            onCardSelect={onCardSelect}
            onListSelect={onListSelect}
            onToggleWatched={onToggleWatched}
          />
        ))}
      </div>
    </div>
  )
}

export default BingeGrid

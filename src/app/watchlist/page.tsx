'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd'
import {
  Ghost,
  Heart,
  GripVertical,
  Trash2,
  Film,
  Star,
  Clock,
  ExternalLink,
  Loader2,
  ArrowLeft,
  ListX,
} from 'lucide-react'
import { useWatchlist, type WatchlistItem } from '@/hooks/useWatchlist'
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
 * Empty state when user has no watchlist items
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <Heart className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        Your watchlist is empty
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        Start building your collection! Browse movies and click the heart icon to add them to your watchlist.
      </p>
      <Link
        href="/browse"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Browse Movies
      </Link>
    </div>
  )
}

/**
 * Not signed in state
 */
function NotSignedIn() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <ListX className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        Sign in to view your watchlist
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        Create an account or sign in to save movies to your personal watchlist.
      </p>
      <Link
        href="/login?redirect=/watchlist"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Sign In
      </Link>
    </div>
  )
}

/**
 * Watchlist item card with drag handle
 */
function WatchlistItemCard({
  item,
  index,
  onRemove,
  onClick,
}: {
  item: WatchlistItem
  index: number
  onRemove: (cardId: string) => void
  onClick: (card: AvailabilityCard) => void
}) {
  const card = item.card
  const runtime = formatRuntime(card.runtime_minutes)

  if (!card?.id) {
    // Placeholder item while loading
    return (
      <div className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse">
        <div className="flex gap-4">
          <div className="w-16 aspect-[2/3] bg-[#252525] rounded" />
          <div className="flex-1">
            <div className="h-5 bg-[#252525] rounded w-3/4 mb-2" />
            <div className="h-4 bg-[#252525] rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <Draggable draggableId={item.cardId} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            bg-[#1a1a1a] rounded-lg border border-gray-800 overflow-hidden
            transition-all duration-200
            ${snapshot.isDragging ? 'shadow-xl shadow-purple-900/30 border-purple-500' : ''}
          `}
        >
          <div className="flex items-stretch">
            {/* Drag handle */}
            <div
              {...provided.dragHandleProps}
              className="flex items-center justify-center px-3 bg-[#151515] border-r border-gray-800 cursor-grab active:cursor-grabbing hover:bg-[#1a1a1a] transition-colors"
            >
              <GripVertical className="w-5 h-5 text-gray-600" />
            </div>

            {/* Poster */}
            <div
              className="relative w-20 aspect-[2/3] flex-shrink-0 cursor-pointer"
              onClick={() => onClick(card)}
            >
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
            <div
              className="flex-1 p-4 cursor-pointer hover:bg-[#252525] transition-colors"
              onClick={() => onClick(card)}
            >
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

            {/* Actions */}
            <div className="flex items-center gap-2 px-4 border-l border-gray-800">
              {card.sources && card.sources.length > 0 && (
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
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove(item.cardId)
                }}
                className="p-2 rounded-lg bg-gray-800 hover:bg-red-600/20 hover:text-red-400 text-gray-400 transition-colors"
                title="Remove from watchlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}

/**
 * My Watchlist Page
 *
 * Displays user's watchlist with drag-and-drop reordering
 */
export default function WatchlistPage() {
  const {
    watchlist,
    isLoading,
    error,
    isNotAuthenticated,
    removeFromWatchlist,
    reorderWatchlist,
    isRemoving,
  } = useWatchlist()
  const { openModal } = useTitleModal()
  const [isReordering, setIsReordering] = useState(false)

  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const sourceIndex = result.source.index
      const destIndex = result.destination.index

      if (sourceIndex === destIndex) return

      // Create new order
      const reorderedItems = Array.from(watchlist)
      const [removed] = reorderedItems.splice(sourceIndex, 1)
      reorderedItems.splice(destIndex, 0, removed)

      // Update positions
      const updates = reorderedItems.map((item, index) => ({
        cardId: item.cardId,
        position: index,
      }))

      setIsReordering(true)
      reorderWatchlist(updates)
      setTimeout(() => setIsReordering(false), 500)
    },
    [watchlist, reorderWatchlist]
  )

  const handleCardClick = useCallback(
    (card: AvailabilityCard) => {
      openModal(card, false)
    },
    [openModal]
  )

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-pink-600 flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white fill-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">My Watchlist</h1>
                  <p className="text-sm text-gray-500">
                    {watchlist.length} {watchlist.length === 1 ? 'title' : 'titles'}
                  </p>
                </div>
              </div>
            </div>

            <Link href="/" className="flex items-center gap-2 group">
              <Ghost className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden sm:block">
                Ghosts in the Machine
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
            <p className="text-red-400">Failed to load watchlist</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        )}

        {/* Not signed in state */}
        {!isLoading && isNotAuthenticated && (
          <NotSignedIn />
        )}

        {/* Empty watchlist (user is signed in but has no items) */}
        {!isLoading && !error && !isNotAuthenticated && watchlist.length === 0 && (
          <EmptyState />
        )}

        {/* Watchlist items */}
        {!isLoading && !error && watchlist.length > 0 && (
          <>
            {/* Instructions */}
            <p className="text-sm text-gray-500 mb-4">
              Drag items to reorder your watchlist
            </p>

            {/* Reordering indicator */}
            {isReordering && (
              <div className="flex items-center gap-2 text-sm text-purple-400 mb-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving order...
              </div>
            )}

            {/* Draggable list */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="watchlist">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-3"
                  >
                    {watchlist.map((item, index) => (
                      <WatchlistItemCard
                        key={item.cardId}
                        item={item}
                        index={index}
                        onRemove={removeFromWatchlist}
                        onClick={handleCardClick}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </>
        )}
      </div>
    </main>
  )
}

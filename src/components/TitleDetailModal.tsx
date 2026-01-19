'use client'

import { useEffect, useCallback, useState } from 'react'
import Image from 'next/image'
import {
  X,
  Heart,
  Check,
  Plus,
  Bell,
  Film,
  Star,
  Clock,
  Calendar,
  Globe,
  User,
  ExternalLink,
  Loader2,
} from 'lucide-react'
import { useWatchlist } from '@/hooks/useWatchlist'
import { POSTER_BLUR_DATA_URL, IMAGE_SIZES } from '@/lib/image-utils'
import type { AvailabilityCard, StreamingSource } from '@/types'

/**
 * Service color and logo mapping
 */
const SERVICE_BRANDING: Record<string, { color: string; textColor: string }> = {
  shudder: { color: '#E50914', textColor: 'white' },
  netflix: { color: '#E50914', textColor: 'white' },
  'amazon prime': { color: '#00A8E1', textColor: 'white' },
  'prime video': { color: '#00A8E1', textColor: 'white' },
  hulu: { color: '#1CE783', textColor: 'black' },
  tubi: { color: '#FA5C28', textColor: 'white' },
  max: { color: '#B026FF', textColor: 'white' },
  hbo: { color: '#B026FF', textColor: 'white' },
  peacock: { color: '#000000', textColor: 'white' },
  'paramount+': { color: '#0064FF', textColor: 'white' },
  paramount: { color: '#0064FF', textColor: 'white' },
  disney: { color: '#113CCF', textColor: 'white' },
  'disney+': { color: '#113CCF', textColor: 'white' },
  apple: { color: '#000000', textColor: 'white' },
  'apple tv': { color: '#000000', textColor: 'white' },
  'apple tv+': { color: '#000000', textColor: 'white' },
  vudu: { color: '#3399FF', textColor: 'white' },
  'google play': { color: '#4285F4', textColor: 'white' },
  youtube: { color: '#FF0000', textColor: 'white' },
  amc: { color: '#000000', textColor: 'white' },
  'amc+': { color: '#000000', textColor: 'white' },
}

function getServiceBranding(service: string): { color: string; textColor: string } {
  const key = service.toLowerCase()
  return SERVICE_BRANDING[key] || { color: '#6B7280', textColor: 'white' }
}

/**
 * Format source type label
 */
function formatSourceType(source: StreamingSource): string {
  switch (source.type) {
    case 'subscription':
      return 'Subscription'
    case 'free':
      return 'Free'
    case 'rent':
      return source.price ? `Rent $${source.price.toFixed(2)}` : 'Rent'
    case 'buy':
      return source.price ? `Buy $${source.price.toFixed(2)}` : 'Buy'
    default:
      return 'Watch'
  }
}

/**
 * Format runtime
 */
function formatRuntime(minutes: number): string {
  if (!minutes || minutes <= 0) return ''
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins} min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

/**
 * Generate or retrieve session ID for anonymous tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('click_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    sessionStorage.setItem('click_session_id', sessionId)
  }
  return sessionId
}

/**
 * Track click-out event
 */
async function trackClickOut(
  cardId: string,
  service: string,
  serviceType: string,
  deepLink: string | null
): Promise<void> {
  try {
    const sessionId = getSessionId()

    // Fire and forget - don't block the user
    fetch('/api/track/click-out', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cardId,
        service,
        serviceType,
        deepLink,
        sessionId,
      }),
    }).catch((err) => {
      console.warn('Click tracking failed:', err)
    })
  } catch (error) {
    console.warn('Click tracking error:', error)
  }
}

/**
 * Streaming Source Button
 */
function StreamingSourceButton({ source, cardId }: { source: StreamingSource; cardId: string }) {
  const branding = getServiceBranding(source.service)
  const link = source.url || source.deep_link

  const handleClick = () => {
    // Track the click (fire and forget)
    trackClickOut(cardId, source.service, source.type, link || null)

    // Open the link
    if (link) {
      window.open(link, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <button
      onClick={handleClick}
      className="
        flex items-center justify-between gap-3 w-full p-4 rounded-lg
        transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
        border border-gray-700 hover:border-gray-600 active:border-gray-500
        min-h-[60px]
      "
      style={{ backgroundColor: `${branding.color}20` }}
    >
      <div className="flex items-center gap-3">
        {/* Service indicator */}
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center font-bold text-sm"
          style={{ backgroundColor: branding.color, color: branding.textColor }}
        >
          {source.service.charAt(0).toUpperCase()}
        </div>
        <div className="text-left">
          <p className="font-medium text-white">{source.service}</p>
          <p className="text-sm text-gray-400">{formatSourceType(source)}</p>
        </div>
      </div>
      <ExternalLink className="w-5 h-5 text-gray-400" />
    </button>
  )
}

/**
 * List Picker Modal
 */
function ListPicker({
  isOpen,
  onClose,
  cardTitle,
}: {
  isOpen: boolean
  onClose: () => void
  cardTitle: string
}) {
  const [selectedList, setSelectedList] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)

  // Mock lists - in production, fetch from user's lists
  const userLists = [
    { id: '1', name: 'My Favorites', count: 12 },
    { id: '2', name: 'Watch Later', count: 8 },
    { id: '3', name: 'Halloween Marathon', count: 5 },
  ]

  const handleAdd = async () => {
    if (!selectedList) return
    setIsAdding(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Added to list:', selectedList, cardTitle)
    setIsAdding(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl p-6 w-full max-w-sm border border-gray-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Add to List</h3>

        <div className="space-y-2 mb-6">
          {userLists.map((list) => (
            <button
              key={list.id}
              onClick={() => setSelectedList(list.id)}
              className={`
                w-full p-3 rounded-lg text-left transition-colors
                ${selectedList === list.id
                  ? 'bg-purple-600/20 border-purple-500'
                  : 'bg-[#252525] border-gray-700 hover:border-gray-600'
                }
                border
              `}
            >
              <p className="font-medium text-white">{list.name}</p>
              <p className="text-sm text-gray-400">{list.count} titles</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selectedList || isAdding}
            className="
              flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white
              hover:bg-purple-500 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
            "
          >
            {isAdding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              'Add'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Reminder Picker for EPG items
 */
function ReminderPicker({
  isOpen,
  onClose,
  cardTitle,
}: {
  isOpen: boolean
  onClose: () => void
  cardTitle: string
}) {
  const [selectedTime, setSelectedTime] = useState<string>('15')
  const [isSettting, setIsSetting] = useState(false)

  const reminderOptions = [
    { value: '5', label: '5 minutes before' },
    { value: '15', label: '15 minutes before' },
    { value: '30', label: '30 minutes before' },
    { value: '60', label: '1 hour before' },
  ]

  const handleSet = async () => {
    setIsSetting(true)
    await new Promise((resolve) => setTimeout(resolve, 500))
    console.log('Reminder set:', selectedTime, 'minutes before', cardTitle)
    setIsSetting(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-[#1a1a1a] rounded-xl p-6 w-full max-w-sm border border-gray-800 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">Set Reminder</h3>
        <p className="text-sm text-gray-400 mb-4">Get notified before &quot;{cardTitle}&quot; starts</p>

        <div className="space-y-2 mb-6">
          {reminderOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedTime(option.value)}
              className={`
                w-full p-3 rounded-lg text-left transition-colors
                ${selectedTime === option.value
                  ? 'bg-purple-600/20 border-purple-500'
                  : 'bg-[#252525] border-gray-700 hover:border-gray-600'
                }
                border
              `}
            >
              <p className="font-medium text-white">{option.label}</p>
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSet}
            disabled={isSettting}
            className="
              flex-1 px-4 py-2 rounded-lg bg-purple-600 text-white
              hover:bg-purple-500 transition-colors
              disabled:opacity-50
              flex items-center justify-center gap-2
            "
          >
            {isSettting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4" />
                Set Reminder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

interface TitleDetailModalProps {
  card: AvailabilityCard | null
  isOpen: boolean
  onClose: () => void
  isEPGItem?: boolean
}

/**
 * Title Detail Modal / Slide-over Panel
 *
 * Opens as a slide-over panel from the right on desktop,
 * or as a bottom sheet / modal on mobile.
 */
export function TitleDetailModal({ card, isOpen, onClose, isEPGItem = false }: TitleDetailModalProps) {
  const { isInWatchlist, addToWatchlist, removeFromWatchlist, isAdding, isRemoving } = useWatchlist()
  const [isWatched, setIsWatched] = useState(false)
  const [showListPicker, setShowListPicker] = useState(false)
  const [showReminderPicker, setShowReminderPicker] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Check if current card is in watchlist
  const inWatchlist = card ? isInWatchlist(card.id) : false
  const isWatchlistLoading = isAdding || isRemoving

  // Handle escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (showListPicker) {
        setShowListPicker(false)
      } else if (showReminderPicker) {
        setShowReminderPicker(false)
      } else {
        onClose()
      }
    }
  }, [onClose, showListPicker, showReminderPicker])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleEscape])

  // Reset watched state when card changes
  useEffect(() => {
    if (card) {
      setIsWatched(false)
    }
  }, [card?.id])

  const handleWatchlistToggle = () => {
    if (!card) return
    if (inWatchlist) {
      removeFromWatchlist(card.id)
    } else {
      addToWatchlist(card.id)
    }
  }

  const handleWatchedToggle = async () => {
    setActionLoading('watched')
    await new Promise((resolve) => setTimeout(resolve, 300))
    setIsWatched(!isWatched)
    setActionLoading(null)
    console.log(isWatched ? 'Unmarked as watched:' : 'Marked as watched:', card?.title)
  }

  if (!card) return null

  const runtime = formatRuntime(card.runtime_minutes)

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-50 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel - Slide from right on desktop, full screen on mobile */}
      <div
        className={`
          fixed z-50 bg-[#0f0f0f] overflow-hidden
          transition-transform duration-300 ease-out

          /* Small mobile: full screen */
          inset-0

          /* Larger mobile: bottom sheet with top margin */
          sm:inset-x-0 sm:bottom-0 sm:top-[5%] sm:rounded-t-2xl

          /* Desktop: right slide-over */
          md:inset-y-0 md:right-0 md:left-auto md:top-0 md:bottom-0
          md:w-[480px] md:rounded-none md:rounded-l-2xl

          ${isOpen
            ? 'translate-y-0 md:translate-x-0'
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
        `}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Close button - larger tap target on mobile */}
        <button
          onClick={onClose}
          className="
            absolute top-4 right-4 z-10 rounded-full
            bg-black/50 hover:bg-black/70 active:bg-black/90 text-white
            transition-colors
            min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center
          "
          aria-label="Close"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto custom-scrollbar">
          {/* Poster section */}
          <div className="relative aspect-[2/3] max-h-[50vh] md:max-h-[60vh]">
            {card.poster_url ? (
              <Image
                src={card.poster_url}
                alt={`${card.title} poster`}
                fill
                sizes={IMAGE_SIZES.posterModal}
                className="object-cover"
                priority
                placeholder="blur"
                blurDataURL={POSTER_BLUR_DATA_URL}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-gray-900 flex items-center justify-center">
                <Film className="w-24 h-24 text-gray-600" />
              </div>
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="px-6 pb-8 -mt-16 relative">
            {/* Title and year */}
            <h2 id="modal-title" className="text-2xl md:text-3xl font-bold text-white mb-2">
              {card.title}
            </h2>

            {/* Meta info row */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-4">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {card.year}
              </span>
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {runtime}
                </span>
              )}
              {card.mpaa_rating && (
                <span className="px-2 py-0.5 bg-gray-800 rounded text-xs font-medium">
                  {card.mpaa_rating}
                </span>
              )}
              {card.imdb_rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-white font-medium">{card.imdb_rating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {/* Director and country */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400 mb-6">
              {card.director && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {card.director}
                </span>
              )}
              {card.country && (
                <span className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  {card.country}
                </span>
              )}
            </div>

            {/* Actions - larger tap targets for mobile */}
            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={handleWatchlistToggle}
                disabled={isWatchlistLoading}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium
                  transition-all duration-200 min-h-[44px] active:scale-95
                  ${inWatchlist
                    ? 'bg-red-600/20 text-red-400 border border-red-500/50'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 active:bg-gray-700'
                  }
                `}
              >
                {isWatchlistLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Heart className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
                )}
                {inWatchlist ? 'In Watchlist' : 'Watchlist'}
              </button>

              <button
                onClick={handleWatchedToggle}
                disabled={actionLoading === 'watched'}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium
                  transition-all duration-200 min-h-[44px] active:scale-95
                  ${isWatched
                    ? 'bg-green-600/20 text-green-400 border border-green-500/50'
                    : 'bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600 active:bg-gray-700'
                  }
                `}
              >
                {actionLoading === 'watched' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Check className={`w-5 h-5 ${isWatched ? 'stroke-[3]' : ''}`} />
                )}
                {isWatched ? 'Watched' : 'Mark Watched'}
              </button>

              <button
                onClick={() => setShowListPicker(true)}
                className="
                  flex items-center gap-2 px-4 py-3 rounded-lg font-medium
                  bg-gray-800 text-gray-300 border border-gray-700 hover:border-gray-600
                  transition-colors min-h-[44px] active:scale-95 active:bg-gray-700
                "
              >
                <Plus className="w-5 h-5" />
                Add to List
              </button>

              {isEPGItem && (
                <button
                  onClick={() => setShowReminderPicker(true)}
                  className="
                    flex items-center gap-2 px-4 py-3 rounded-lg font-medium
                    bg-purple-600/20 text-purple-400 border border-purple-500/50
                    hover:bg-purple-600/30 transition-colors min-h-[44px] active:scale-95
                  "
                >
                  <Bell className="w-5 h-5" />
                  Remind Me
                </button>
              )}
            </div>

            {/* Synopsis */}
            {card.synopsis && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Synopsis
                </h3>
                <p className="text-gray-300 leading-relaxed">{card.synopsis}</p>
              </div>
            )}

            {/* Genres */}
            {card.genres && card.genres.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">
                  Genres
                </h3>
                <div className="flex flex-wrap gap-2">
                  {card.genres.map((genre) => (
                    <span
                      key={genre}
                      className="px-3 py-1 rounded-full bg-gray-800 text-gray-300 text-sm"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Streaming Sources */}
            {card.sources && card.sources.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                  Where to Watch
                </h3>
                <div className="space-y-2">
                  {card.sources.map((source, index) => (
                    <StreamingSourceButton
                      key={`${source.service}-${source.type}-${index}`}
                      source={source}
                      cardId={card.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* No streaming sources message */}
            {(!card.sources || card.sources.length === 0) && (
              <div className="text-center py-6 text-gray-500">
                <Film className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No streaming sources available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <ListPicker
        isOpen={showListPicker}
        onClose={() => setShowListPicker(false)}
        cardTitle={card.title}
      />
      <ReminderPicker
        isOpen={showReminderPicker}
        onClose={() => setShowReminderPicker(false)}
        cardTitle={card.title}
      />
    </>
  )
}

export default TitleDetailModal

'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Clock, Bell, BellOff } from 'lucide-react'
import { format, addMinutes, differenceInMinutes, startOfHour } from 'date-fns'
import { useTitleModal } from '@/contexts/TitleModalContext'
import type { EPGScheduleItem, AvailabilityCard } from '@/types'

/**
 * Convert EPGScheduleItem to AvailabilityCard for modal display
 */
function epgToCard(schedule: EPGScheduleItem): AvailabilityCard {
  return {
    id: schedule.id,
    imdb_id: '',
    tmdb_id: '',
    watchmode_id: '',
    title: schedule.title,
    year: new Date().getFullYear(),
    type: 'movie',
    genres: [],
    subgenres: [],
    is_genre_highlight: schedule.is_genre_highlight,
    sources: [],
    poster_url: '',
    backdrop_url: '',
    synopsis: schedule.synopsis || '',
    runtime_minutes: schedule.duration_minutes,
    mpaa_rating: '',
    director: '',
    country: '',
    imdb_rating: 0,
    rt_score: 0,
    letterboxd_rating: 0,
    editorial_tags: [],
    featured: false,
    created_at: '',
    updated_at: '',
    availability_checked_at: '',
  }
}

interface EPGGridProps {
  schedules: EPGScheduleItem[]
  channels: string[]
  startTime?: Date
  hoursToShow?: number
  onSetReminder?: (schedule: EPGScheduleItem) => void
  reminders?: Set<string>
}

// Constants
const CHANNEL_WIDTH = 150
const PIXELS_PER_MINUTE = 3
const MOBILE_PIXELS_PER_MINUTE = 2
const TIME_SLOT_MINUTES = 30

/**
 * Format time for display in header
 */
function formatTimeSlot(date: Date): string {
  return format(date, 'h:mm a')
}

/**
 * Format time for mobile (shorter)
 */
function formatTimeSlotShort(date: Date): string {
  return format(date, 'h:mm')
}

/**
 * Calculate position and width for a program block
 */
function calculateBlockStyle(
  schedule: EPGScheduleItem,
  gridStart: Date,
  pixelsPerMinute: number
): { left: number; width: number; visible: boolean } {
  const programStart = new Date(schedule.start_time)
  const programEnd = new Date(schedule.end_time)

  const offsetMinutes = differenceInMinutes(programStart, gridStart)
  const durationMinutes = differenceInMinutes(programEnd, programStart)

  const left = offsetMinutes * pixelsPerMinute
  const width = durationMinutes * pixelsPerMinute

  // Check if visible in current view
  const visible = left + width > 0

  return { left, width: Math.max(width, 30), visible }
}

/**
 * Program block component with tooltip
 */
function ProgramBlock({
  schedule,
  style,
  onSetReminder,
  hasReminder,
  isFuture,
}: {
  schedule: EPGScheduleItem
  style: { left: number; width: number }
  onSetReminder?: (schedule: EPGScheduleItem) => void
  hasReminder: boolean
  isFuture: boolean
}) {
  const { openModal } = useTitleModal()
  const [showTooltip, setShowTooltip] = useState(false)
  const blockRef = useRef<HTMLDivElement>(null)

  const isHighlight = schedule.is_genre_highlight

  const handleReminderClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onSetReminder && isFuture) {
      onSetReminder(schedule)
    }
  }

  const handleBlockClick = () => {
    // Convert EPG schedule to card and open modal with EPG flag
    const card = epgToCard(schedule)
    openModal(card, true) // true = isEPGItem, enables reminder feature
  }

  return (
    <div
      ref={blockRef}
      className={`
        absolute top-1 bottom-1 rounded px-2 py-1 overflow-hidden cursor-pointer
        transition-all duration-200 border border-transparent
        ${
          isHighlight
            ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-400/30'
            : 'bg-[#1a1a1a] hover:bg-[#252525] text-gray-200 border-gray-700/50'
        }
        ${style.width < 60 ? 'text-xs' : 'text-sm'}
      `}
      style={{
        left: `${style.left}px`,
        width: `${style.width - 4}px`,
      }}
      onClick={handleBlockClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Title */}
      <div className="font-medium truncate leading-tight">{schedule.title}</div>

      {/* Time (if block is wide enough) */}
      {style.width >= 100 && (
        <div className={`text-xs truncate ${isHighlight ? 'text-purple-200' : 'text-gray-500'}`}>
          {format(new Date(schedule.start_time), 'h:mm a')}
        </div>
      )}

      {/* Reminder indicator */}
      {isFuture && hasReminder && (
        <Bell className="absolute top-1 right-1 w-3 h-3 text-yellow-400" />
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="
            absolute z-50 bottom-full left-0 mb-2 p-3 rounded-lg
            bg-[#2a2a2a] border border-gray-700 shadow-xl
            min-w-[250px] max-w-[350px]
          "
          onClick={(e) => e.stopPropagation()}
        >
          <div className="font-semibold text-white mb-1">{schedule.title}</div>
          <div className="text-xs text-gray-400 mb-2">
            {format(new Date(schedule.start_time), 'h:mm a')} -{' '}
            {format(new Date(schedule.end_time), 'h:mm a')} ({schedule.duration_minutes} min)
          </div>
          {schedule.synopsis && (
            <p className="text-sm text-gray-300 line-clamp-3">{schedule.synopsis}</p>
          )}

          {/* Reminder button for future shows */}
          {isFuture && onSetReminder && (
            <button
              onClick={handleReminderClick}
              className={`
                mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded
                ${
                  hasReminder
                    ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }
              `}
            >
              {hasReminder ? (
                <>
                  <BellOff className="w-3 h-3" />
                  Remove Reminder
                </>
              ) : (
                <>
                  <Bell className="w-3 h-3" />
                  Set Reminder
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Current time indicator line
 */
function CurrentTimeIndicator({
  gridStart,
  pixelsPerMinute,
}: {
  gridStart: Date
  pixelsPerMinute: number
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const offsetMinutes = differenceInMinutes(now, gridStart)
  const left = offsetMinutes * pixelsPerMinute

  if (left < 0) return null

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
      style={{ left: `${left}px` }}
    >
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-red-500" />
    </div>
  )
}

/**
 * EPG Grid Component
 *
 * Displays a TV guide style grid with channels on Y-axis and time on X-axis
 */
export function EPGGrid({
  schedules,
  channels,
  startTime,
  hoursToShow = 3,
  onSetReminder,
  reminders = new Set(),
}: EPGGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [gridStart, setGridStart] = useState(() => {
    if (startTime) return startOfHour(startTime)
    // Round to nearest 30 minutes
    const now = new Date()
    const minutes = now.getMinutes()
    now.setMinutes(minutes < 30 ? 0 : 30, 0, 0)
    return now
  })

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const pixelsPerMinute = isMobile ? MOBILE_PIXELS_PER_MINUTE : PIXELS_PER_MINUTE
  const effectiveHours = isMobile ? 2 : hoursToShow

  // Generate time slots
  const timeSlots = useMemo(() => {
    const slots: Date[] = []
    const totalSlots = (effectiveHours * 60) / TIME_SLOT_MINUTES
    for (let i = 0; i <= totalSlots; i++) {
      slots.push(addMinutes(gridStart, i * TIME_SLOT_MINUTES))
    }
    return slots
  }, [gridStart, effectiveHours])

  // Grid width
  const gridWidth = effectiveHours * 60 * pixelsPerMinute

  // Group schedules by channel
  const schedulesByChannel = useMemo(() => {
    const grouped: Record<string, EPGScheduleItem[]> = {}
    channels.forEach((ch) => (grouped[ch] = []))

    schedules.forEach((schedule) => {
      if (grouped[schedule.channel_name]) {
        grouped[schedule.channel_name].push(schedule)
      }
    })

    return grouped
  }, [schedules, channels])

  // Navigation handlers
  const shiftTime = useCallback((minutes: number) => {
    setGridStart((prev) => addMinutes(prev, minutes))
  }, [])

  const goToNow = useCallback(() => {
    const now = new Date()
    const minutes = now.getMinutes()
    now.setMinutes(minutes < 30 ? 0 : 30, 0, 0)
    setGridStart(now)
  }, [])

  // Current time for checking if show is future
  const now = new Date()

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-gray-800 overflow-hidden">
      {/* Navigation Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#141414] border-b border-gray-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftTime(-60)}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 transition-colors"
            aria-label="Previous hour"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={goToNow}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <Clock className="w-4 h-4" />
            Now
          </button>

          <button
            onClick={() => shiftTime(60)}
            className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-300 transition-colors"
            aria-label="Next hour"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="text-sm text-gray-400">
          {format(gridStart, 'EEEE, MMM d')} &middot;{' '}
          {format(gridStart, 'h:mm a')} - {format(addMinutes(gridStart, effectiveHours * 60), 'h:mm a')}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex">
        {/* Fixed Channel Column */}
        <div className="flex-shrink-0 bg-[#0a0a0a] z-20 border-r border-gray-800">
          {/* Empty corner cell */}
          <div
            className="h-10 border-b border-gray-800 bg-[#141414]"
            style={{ width: `${CHANNEL_WIDTH}px` }}
          />

          {/* Channel names */}
          {channels.map((channel) => (
            <div
              key={channel}
              className="h-16 flex items-center px-3 border-b border-gray-800 bg-[#0a0a0a]"
              style={{ width: `${CHANNEL_WIDTH}px` }}
            >
              <span className="text-sm font-medium text-white truncate">{channel}</span>
            </div>
          ))}
        </div>

        {/* Scrollable Grid Area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent"
        >
          <div style={{ width: `${gridWidth}px`, minWidth: '100%' }}>
            {/* Time Header */}
            <div className="h-10 flex border-b border-gray-800 bg-[#141414] relative">
              {timeSlots.map((slot, index) => (
                <div
                  key={index}
                  className="flex-shrink-0 border-l border-gray-800 px-2 flex items-center"
                  style={{ width: `${TIME_SLOT_MINUTES * pixelsPerMinute}px` }}
                >
                  <span className="text-xs text-gray-500">
                    {isMobile ? formatTimeSlotShort(slot) : formatTimeSlot(slot)}
                  </span>
                </div>
              ))}
            </div>

            {/* Channel Rows */}
            <div className="relative">
              {channels.map((channel) => (
                <div
                  key={channel}
                  className="h-16 relative border-b border-gray-800"
                  style={{ width: `${gridWidth}px` }}
                >
                  {/* Time grid lines */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {timeSlots.map((_, index) => (
                      <div
                        key={index}
                        className="flex-shrink-0 border-l border-gray-800/50"
                        style={{ width: `${TIME_SLOT_MINUTES * pixelsPerMinute}px` }}
                      />
                    ))}
                  </div>

                  {/* Program blocks */}
                  {schedulesByChannel[channel]?.map((schedule) => {
                    const blockStyle = calculateBlockStyle(schedule, gridStart, pixelsPerMinute)
                    if (!blockStyle.visible) return null

                    const isFuture = new Date(schedule.start_time) > now

                    return (
                      <ProgramBlock
                        key={schedule.id}
                        schedule={schedule}
                        style={blockStyle}
                        onSetReminder={onSetReminder}
                        hasReminder={reminders.has(schedule.id)}
                        isFuture={isFuture}
                      />
                    )
                  })}
                </div>
              ))}

              {/* Current time indicator */}
              <CurrentTimeIndicator gridStart={gridStart} pixelsPerMinute={pixelsPerMinute} />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile swipe hint */}
      {isMobile && (
        <div className="text-center py-2 text-xs text-gray-600 bg-[#0a0a0a]">
          Swipe to see more &rarr;
        </div>
      )}
    </div>
  )
}

export default EPGGrid

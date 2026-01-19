'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Radio,
  Clock,
  ChevronLeft,
  ChevronRight,
  Tv,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { format, differenceInMinutes, addHours, startOfHour } from 'date-fns'

interface EPGProgram {
  id: string
  channel: string
  channelSlug: string
  channelLogo?: string
  title: string
  description?: string
  startTime: string
  endTime: string
  duration: number
  rating?: string
  genre?: string
  subGenre?: string
  poster?: string
  thumbnail?: string
  isHorrorOrSciFi: boolean
}

interface ChannelGroup {
  name: string
  slug: string
  logo?: string
  programs: EPGProgram[]
}

/**
 * Fetch EPG data from API
 */
async function fetchEPG(): Promise<EPGProgram[]> {
  const response = await fetch('/api/epg?filter=all')
  if (!response.ok) throw new Error('Failed to fetch EPG')
  const data = await response.json()
  return data.programs || []
}

/**
 * Calculate progress percentage for a program
 */
function getProgress(startTime: string, endTime: string): number {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)

  const total = differenceInMinutes(end, start)
  const elapsed = differenceInMinutes(now, start)

  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

/**
 * Check if program is currently airing
 */
function isCurrentlyAiring(startTime: string, endTime: string): boolean {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  return now >= start && now < end
}

/**
 * Time slot header component
 */
function TimeSlotHeader({ startHour, hoursToShow }: { startHour: Date; hoursToShow: number }) {
  const slots = []
  for (let i = 0; i < hoursToShow; i++) {
    const time = addHours(startHour, i)
    slots.push(
      <div
        key={i}
        className="flex-shrink-0 w-48 px-2 py-2 text-xs text-gray-400 border-l border-gray-800/50 first:border-l-0"
      >
        {format(time, 'h:mm a')}
      </div>
    )
  }
  return <div className="flex">{slots}</div>
}

/**
 * Program block component
 */
function ProgramBlock({
  program,
  startHour,
  pixelsPerMinute,
}: {
  program: EPGProgram
  startHour: Date
  pixelsPerMinute: number
}) {
  const programStart = new Date(program.startTime)
  const programEnd = new Date(program.endTime)
  const now = new Date()

  // Calculate position and width
  const startOffset = Math.max(0, differenceInMinutes(programStart, startHour))
  const endOffset = differenceInMinutes(programEnd, startHour)
  const duration = endOffset - startOffset

  const left = startOffset * pixelsPerMinute
  const width = Math.max(duration * pixelsPerMinute, 60) // Minimum 60px width

  const isAiring = isCurrentlyAiring(program.startTime, program.endTime)
  const progress = getProgress(program.startTime, program.endTime)
  const isPast = programEnd < now

  return (
    <div
      className={`
        absolute top-1 bottom-1 rounded-lg overflow-hidden cursor-pointer
        transition-all duration-200 group
        ${program.isHorrorOrSciFi
          ? 'bg-purple-900/40 border border-purple-500/40 hover:bg-purple-900/60'
          : 'bg-gray-800/60 border border-gray-700/40 hover:bg-gray-800/80'
        }
        ${isPast ? 'opacity-50' : ''}
        ${isAiring ? 'ring-2 ring-purple-500/50' : ''}
      `}
      style={{
        left: `${left}px`,
        width: `${width}px`,
      }}
      title={`${program.title}\n${format(programStart, 'h:mm a')} - ${format(programEnd, 'h:mm a')}`}
    >
      <div className="p-2 h-full flex flex-col">
        <div className="flex items-start justify-between gap-1">
          <p className="text-xs font-medium text-white truncate flex-1">
            {program.title}
          </p>
          {program.isHorrorOrSciFi && (
            <span className="flex-shrink-0 text-[8px] font-bold text-purple-300 bg-purple-500/30 px-1 rounded">
              {program.genre?.toUpperCase().slice(0, 6) || 'HORROR'}
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          {format(programStart, 'h:mm')} - {format(programEnd, 'h:mm a')}
        </p>

        {/* Progress bar for currently airing */}
        {isAiring && (
          <div className="mt-auto pt-1">
            <div className="h-0.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Hover tooltip */}
      <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
        <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg p-3 shadow-xl min-w-[200px] max-w-[300px]">
          <p className="font-medium text-white text-sm">{program.title}</p>
          <p className="text-xs text-gray-400 mt-1">
            {format(programStart, 'h:mm a')} - {format(programEnd, 'h:mm a')}
          </p>
          {program.description && (
            <p className="text-xs text-gray-500 mt-2 line-clamp-3">{program.description}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {program.rating && (
              <span className="text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">
                {program.rating}
              </span>
            )}
            {program.genre && (
              <span className="text-[10px] text-purple-400 bg-purple-900/30 px-1.5 py-0.5 rounded">
                {program.genre}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Channel row component
 */
function ChannelRow({
  channel,
  startHour,
  hoursToShow,
  pixelsPerMinute,
}: {
  channel: ChannelGroup
  startHour: Date
  hoursToShow: number
  pixelsPerMinute: number
}) {
  const [imgError, setImgError] = useState(false)
  const totalWidth = hoursToShow * 60 * pixelsPerMinute

  return (
    <div className="flex border-b border-gray-800/50 min-h-[70px]">
      {/* Channel info */}
      <div className="w-32 flex-shrink-0 p-2 bg-[#0a0a0a] flex items-center gap-2 border-r border-gray-800">
        <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
          {channel.logo && !imgError ? (
            <img
              src={channel.logo}
              alt={channel.name}
              className="w-full h-full object-contain"
              onError={() => setImgError(true)}
            />
          ) : (
            <Tv className="w-4 h-4 text-gray-600" />
          )}
        </div>
        <span className="text-xs font-medium text-gray-300 truncate">{channel.name}</span>
      </div>

      {/* Programs timeline */}
      <div className="flex-1 relative overflow-hidden" style={{ minWidth: `${totalWidth}px` }}>
        {/* Hour grid lines */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: hoursToShow }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-48 border-l border-gray-800/30 first:border-l-0" />
          ))}
        </div>

        {/* Program blocks */}
        {channel.programs.map((program) => (
          <ProgramBlock
            key={program.id}
            program={program}
            startHour={startHour}
            pixelsPerMinute={pixelsPerMinute}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Current time indicator
 */
function NowIndicator({
  startHour,
  pixelsPerMinute,
  channelCount,
}: {
  startHour: Date
  pixelsPerMinute: number
  channelCount: number
}) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000) // Update every minute
    return () => clearInterval(interval)
  }, [])

  const offset = differenceInMinutes(now, startHour)
  if (offset < 0) return null

  const left = 128 + offset * pixelsPerMinute // 128px for channel column

  return (
    <div
      className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
      style={{ left: `${left}px` }}
    >
      <div className="absolute -top-1 -left-1.5 w-3 h-3 bg-red-500 rounded-full" />
      <div className="absolute top-0 left-2 bg-red-500 text-white text-[10px] px-1 rounded whitespace-nowrap">
        {format(now, 'h:mm a')}
      </div>
    </div>
  )
}

/**
 * TV Guide Page
 */
export default function TVGuidePage() {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [startHour, setStartHour] = useState(() => startOfHour(new Date()))
  const hoursToShow = 6
  const pixelsPerMinute = 3.2 // 192px per hour (w-48 = 192px)

  const { data: programs = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['epg', 'all'],
    queryFn: fetchEPG,
    refetchInterval: 24 * 60 * 60 * 1000, // Refetch every 24 hours
    staleTime: 12 * 60 * 60 * 1000, // Consider stale after 12 hours
  })

  // Group programs by channel
  const channels = useMemo(() => {
    const channelMap = new Map<string, ChannelGroup>()

    for (const program of programs) {
      if (!channelMap.has(program.channelSlug)) {
        channelMap.set(program.channelSlug, {
          name: program.channel,
          slug: program.channelSlug,
          logo: program.channelLogo,
          programs: [],
        })
      }
      channelMap.get(program.channelSlug)!.programs.push(program)
    }

    // Sort channels by name, prioritizing horror/sci-fi channels
    return Array.from(channelMap.values()).sort((a, b) => {
      const aHasHorror = a.programs.some((p) => p.isHorrorOrSciFi)
      const bHasHorror = b.programs.some((p) => p.isHorrorOrSciFi)
      if (aHasHorror && !bHasHorror) return -1
      if (!aHasHorror && bHasHorror) return 1
      return a.name.localeCompare(b.name)
    })
  }, [programs])

  // Navigation
  const goBack = () => setStartHour((h) => addHours(h, -2))
  const goForward = () => setStartHour((h) => addHours(h, 2))
  const goToNow = () => {
    setStartHour(startOfHour(new Date()))
    // Scroll to show current time
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = 0
    }
  }

  // Stats
  const nowAiring = programs.filter((p) => isCurrentlyAiring(p.startTime, p.endTime))
  const horrorNowAiring = nowAiring.filter((p) => p.isHorrorOrSciFi)

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="ml-3 text-gray-400">Loading TV Guide...</span>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] p-4 md:p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-[#141414] rounded-xl border border-gray-800 p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Failed to load TV Guide</h2>
            <p className="text-gray-500 mb-6">Unable to fetch programming data</p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="border-b border-gray-800 bg-[#0a0a0a]">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Radio className="w-8 h-8 text-red-500" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">TV Guide</h1>
                <p className="text-sm text-gray-500">
                  {horrorNowAiring.length > 0
                    ? `${horrorNowAiring.length} horror/sci-fi program${horrorNowAiring.length > 1 ? 's' : ''} on now`
                    : 'Live TV from Pluto TV'}
                </p>
              </div>
            </div>

            {/* Time navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={goBack}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                title="Go back 2 hours"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={goToNow}
                className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm hover:bg-gray-700 transition-colors"
              >
                Now
              </button>
              <button
                onClick={goForward}
                className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors"
                title="Go forward 2 hours"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="ml-4 flex items-center gap-2 text-sm text-gray-500">
                <Clock className="w-4 h-4" />
                <span>{format(startHour, 'MMM d, h:mm a')}</span>
              </div>

              <button
                onClick={() => refetch()}
                disabled={isFetching}
                className="ml-2 p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-[1600px] mx-auto px-4 py-6">
        {channels.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-gray-800 p-12 text-center">
            <Tv className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-400 mb-2">No Programs Available</h2>
            <p className="text-gray-500">Check back later for TV listings</p>
          </div>
        ) : (
          <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden relative">
            {/* Time header */}
            <div className="flex border-b border-gray-800 bg-[#0a0a0a] sticky top-0 z-10">
              <div className="w-32 flex-shrink-0 p-2 border-r border-gray-800">
                <span className="text-xs text-gray-500">Channel</span>
              </div>
              <div className="flex-1 overflow-x-auto" ref={scrollContainerRef}>
                <TimeSlotHeader startHour={startHour} hoursToShow={hoursToShow} />
              </div>
            </div>

            {/* Channel rows */}
            <div className="relative overflow-x-auto" style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 300px)' }}>
              {/* Now indicator */}
              <NowIndicator
                startHour={startHour}
                pixelsPerMinute={pixelsPerMinute}
                channelCount={channels.length}
              />

              {channels.map((channel) => (
                <ChannelRow
                  key={channel.slug}
                  channel={channel}
                  startHour={startHour}
                  hoursToShow={hoursToShow}
                  pixelsPerMinute={pixelsPerMinute}
                />
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 p-3 bg-[#0a0a0a] border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-4 h-3 rounded bg-purple-900/40 border border-purple-500/40" />
                <span>Horror/Sci-Fi</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-4 h-3 rounded bg-gray-800/60 border border-gray-700/40" />
                <span>Other Programming</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-0.5 h-3 bg-red-500" />
                <span>Current Time</span>
              </div>
            </div>
          </div>
        )}

        {/* Attribution */}
        <p className="text-xs text-gray-600 mt-4 text-center">
          Live TV data from Pluto TV
        </p>
      </div>
    </main>
  )
}

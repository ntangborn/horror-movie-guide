'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Radio, Clock, ChevronRight, Tv, ExternalLink, AlertCircle } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import Image from 'next/image'

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

/**
 * Fetch EPG data from API
 */
async function fetchEPG(filter: 'now' | 'upcoming' | 'all' = 'now'): Promise<EPGProgram[]> {
  const response = await fetch(`/api/epg?filter=${filter}`)
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
 * Get time remaining
 */
function getTimeRemaining(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const mins = differenceInMinutes(end, now)

  if (mins <= 0) return 'Ending now'
  if (mins < 60) return `${mins}m left`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return `${hours}h ${remaining}m left`
}

/**
 * Skeleton item for loading state
 */
function SkeletonItem() {
  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-24 bg-[#252525] rounded-lg flex-shrink-0" />
        <div className="flex-1">
          <div className="h-5 bg-[#252525] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#252525] rounded w-1/2 mb-3" />
          <div className="h-3 bg-[#252525] rounded w-1/3" />
        </div>
      </div>
    </div>
  )
}

/**
 * Program item component
 */
function ProgramItem({
  program,
  onSelect,
}: {
  program: EPGProgram
  onSelect?: () => void
}) {
  const progress = getProgress(program.startTime, program.endTime)
  const timeRemaining = getTimeRemaining(program.endTime)
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={onSelect}
      className={`
        group relative rounded-lg p-4 cursor-pointer transition-all duration-200
        ${
          program.isHorrorOrSciFi
            ? 'bg-purple-900/30 hover:bg-purple-900/40 border border-purple-500/30'
            : 'bg-[#1a1a1a] hover:bg-[#252525] border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Poster/Thumbnail */}
        <div className="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#252525]">
          {program.poster && !imgError ? (
            <img
              src={program.poster}
              alt={program.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : program.channelLogo && !imgError ? (
            <div className="w-full h-full flex items-center justify-center p-2">
              <img
                src={program.channelLogo}
                alt={program.channel}
                className="w-full h-auto"
                onError={() => setImgError(true)}
              />
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Tv className="w-8 h-8 text-gray-600" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {program.title}
              </h4>
              <p className="text-sm text-gray-400">{program.channel}</p>
              {program.description && (
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                  {program.description}
                </p>
              )}
            </div>

            {/* Genre highlight badge */}
            {program.isHorrorOrSciFi && (
              <span className="flex-shrink-0 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                {program.genre?.toUpperCase() || 'HORROR'}
              </span>
            )}
          </div>

          {/* Time info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(program.startTime), 'h:mm a')}
            </span>
            <span className="text-gray-600">•</span>
            <span>{timeRemaining}</span>
            {program.rating && (
              <>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">{program.rating}</span>
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                program.isHorrorOrSciFi
                  ? 'bg-gradient-to-r from-purple-600 to-purple-400'
                  : 'bg-gray-600'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Arrow */}
        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0 mt-1" />
      </div>
    </div>
  )
}

/**
 * What's On Now Component
 *
 * Fetches and displays currently airing programs from Pluto TV
 */
export function WhatsOnNow() {
  const [showAll, setShowAll] = useState(false)

  const { data: programs = [], isLoading, error, refetch } = useQuery({
    queryKey: ['epg', 'now'],
    queryFn: () => fetchEPG('now'),
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider stale after 2 minutes
  })

  // Show highlighted programs first, limit to 4 by default
  const sortedPrograms = [...programs].sort((a, b) => {
    if (a.isHorrorOrSciFi && !b.isHorrorOrSciFi) return -1
    if (!a.isHorrorOrSciFi && b.isHorrorOrSciFi) return 1
    return 0
  })
  const displayPrograms = showAll ? sortedPrograms : sortedPrograms.slice(0, 4)
  const hasMore = sortedPrograms.length > 4

  if (isLoading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">What&apos;s On Now</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">LIVE</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-white">What&apos;s On Now</h2>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-400 mb-4">Unable to load TV guide</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            Try again
          </button>
        </div>
      </section>
    )
  }

  if (!programs || programs.length === 0) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-white">What&apos;s On Now</h2>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
          <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No horror or sci-fi programs currently airing</p>
          <p className="text-xs text-gray-600 mt-2">Check back soon for live TV listings</p>
        </div>
      </section>
    )
  }

  const horrorCount = programs.filter((p) => p.isHorrorOrSciFi).length

  return (
    <section className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-white">What&apos;s On Now</h2>
              <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">LIVE</span>
            </div>
            <p className="text-sm text-gray-500">
              {horrorCount > 0
                ? `${horrorCount} horror/sci-fi program${horrorCount > 1 ? 's' : ''} airing on Pluto TV`
                : 'Live TV from Pluto TV'}
            </p>
          </div>
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showAll ? 'Show less' : `View all ${sortedPrograms.length}`}
          </button>
        )}
      </div>

      {/* Program grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {displayPrograms.map((program) => (
          <ProgramItem
            key={program.id}
            program={program}
          />
        ))}
      </div>

      {/* Attribution */}
      <p className="text-xs text-gray-600 mt-4 text-center">
        Live TV data from Pluto TV • Updates every 5 minutes
      </p>
    </section>
  )
}

export default WhatsOnNow

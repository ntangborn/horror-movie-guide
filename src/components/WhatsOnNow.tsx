'use client'

import { useState } from 'react'
import { Radio, Clock, ChevronRight, Tv } from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import type { EPGScheduleItem } from '@/types'

interface WhatsOnNowProps {
  programs: EPGScheduleItem[]
  loading?: boolean
  onProgramSelect?: (program: EPGScheduleItem) => void
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
        <div className="w-12 h-12 bg-[#252525] rounded-lg" />
        <div className="flex-1">
          <div className="h-5 bg-[#252525] rounded w-3/4 mb-2" />
          <div className="h-4 bg-[#252525] rounded w-1/2" />
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
  program: EPGScheduleItem
  onSelect?: () => void
}) {
  const progress = getProgress(program.start_time, program.end_time)
  const timeRemaining = getTimeRemaining(program.end_time)

  return (
    <div
      onClick={onSelect}
      className={`
        group relative rounded-lg p-4 cursor-pointer transition-all duration-200
        ${
          program.is_genre_highlight
            ? 'bg-purple-900/30 hover:bg-purple-900/40 border border-purple-500/30'
            : 'bg-[#1a1a1a] hover:bg-[#252525] border border-transparent'
        }
      `}
    >
      <div className="flex items-start gap-4">
        {/* Channel badge */}
        <div
          className={`
            w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0
            ${program.is_genre_highlight ? 'bg-purple-600' : 'bg-[#252525]'}
          `}
        >
          <Tv className="w-6 h-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-semibold text-white truncate group-hover:text-purple-300 transition-colors">
                {program.title}
              </h4>
              <p className="text-sm text-gray-400">{program.channel_name}</p>
            </div>

            {/* Genre highlight badge */}
            {program.is_genre_highlight && (
              <span className="flex-shrink-0 text-[10px] font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full">
                HORROR
              </span>
            )}
          </div>

          {/* Time info */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {format(new Date(program.start_time), 'h:mm a')}
            </span>
            <span className="text-gray-600">•</span>
            <span>{timeRemaining}</span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                program.is_genre_highlight
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
 * Displays currently airing programs with genre highlights first
 */
export function WhatsOnNow({ programs, loading = false, onProgramSelect }: WhatsOnNowProps) {
  const [showAll, setShowAll] = useState(false)

  // Show highlighted programs first, limit to 4 by default
  const displayPrograms = showAll ? programs : programs.slice(0, 4)
  const hasMore = programs.length > 4

  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white">What's On Now</h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonItem key={i} />
          ))}
        </div>
      </section>
    )
  }

  if (!programs || programs.length === 0) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-3 mb-6">
          <Radio className="w-6 h-6 text-gray-600" />
          <h2 className="text-2xl font-bold text-white">What's On Now</h2>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
          <Tv className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No programs currently airing</p>
        </div>
      </section>
    )
  }

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
            <h2 className="text-2xl font-bold text-white">What's On Now</h2>
            <p className="text-sm text-gray-500">
              {programs.filter((p) => p.is_genre_highlight).length} horror/sci-fi programs airing
            </p>
          </div>
        </div>

        {hasMore && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {showAll ? 'Show less' : `View all ${programs.length}`}
          </button>
        )}
      </div>

      {/* Program grid */}
      <div className="grid gap-3 md:grid-cols-2">
        {displayPrograms.map((program) => (
          <ProgramItem
            key={program.id}
            program={program}
            onSelect={() => onProgramSelect?.(program)}
          />
        ))}
      </div>
    </section>
  )
}

export default WhatsOnNow

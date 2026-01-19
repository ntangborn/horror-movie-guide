'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ghost,
  Zap,
  Radio,
  Film,
  PlayCircle,
  Heart,
  Plus,
  ChevronRight,
  Clock,
  Star,
  Tv,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react'
import { format, differenceInMinutes } from 'date-fns'
import { getRecentlyAddedCards, getFeaturedCards } from '@/lib/browse-data'
import { getFeaturedLists, getCardsByIds, type BingeRow } from '@/lib/list-data'
import { useTitleModal } from '@/contexts/TitleModalContext'
import type { AvailabilityCard, CuratedList } from '@/types'

// ============================================================================
// What's On Now Section (Compact)
// ============================================================================

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
  isHorrorOrSciFi: boolean
}

async function fetchWhatsOnNow(): Promise<EPGProgram[]> {
  const response = await fetch('/api/epg?filter=now')
  if (!response.ok) return []
  const data = await response.json()
  return (data.programs || []).slice(0, 4) // Only show top 4
}

function getProgress(startTime: string, endTime: string): number {
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  const total = differenceInMinutes(end, start)
  const elapsed = differenceInMinutes(now, start)
  return Math.min(100, Math.max(0, (elapsed / total) * 100))
}

function getTimeRemaining(endTime: string): string {
  const now = new Date()
  const end = new Date(endTime)
  const mins = differenceInMinutes(end, now)
  if (mins <= 0) return 'Ending now'
  if (mins < 60) return `${mins}m left`
  const hours = Math.floor(mins / 60)
  const remaining = mins % 60
  return `${hours}h ${remaining}m`
}

function WhatsOnNowSection() {
  const { data: programs = [], isLoading } = useQuery({
    queryKey: ['epg', 'now', 'home'],
    queryFn: fetchWhatsOnNow,
    staleTime: 5 * 60 * 1000,
  })

  const horrorPrograms = programs.filter(p => p.isHorrorOrSciFi)
  const displayPrograms = horrorPrograms.length > 0 ? horrorPrograms : programs.slice(0, 2)

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Radio className="w-6 h-6 text-red-500" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">What's On Now</h2>
            <p className="text-sm text-gray-500">Live on Pluto TV</p>
          </div>
        </div>
        <Link
          href="/tv-guide"
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View TV Guide
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-12 h-16 bg-[#252525] rounded" />
                <div className="flex-1">
                  <div className="h-4 bg-[#252525] rounded w-3/4 mb-2" />
                  <div className="h-3 bg-[#252525] rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : displayPrograms.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {displayPrograms.map(program => (
            <Link
              key={program.id}
              href="/tv-guide"
              className={`
                group rounded-lg p-4 transition-all duration-200
                ${program.isHorrorOrSciFi
                  ? 'bg-purple-900/30 hover:bg-purple-900/40 border border-purple-500/30'
                  : 'bg-[#1a1a1a] hover:bg-[#252525] border border-transparent'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-16 rounded bg-[#252525] flex items-center justify-center flex-shrink-0">
                  <Tv className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                    {program.title}
                  </h4>
                  <p className="text-sm text-gray-400">{program.channel}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{format(new Date(program.startTime), 'h:mm a')}</span>
                    <span className="text-gray-600">•</span>
                    <span>{getTimeRemaining(program.endTime)}</span>
                  </div>
                  <div className="mt-2 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${program.isHorrorOrSciFi ? 'bg-purple-500' : 'bg-gray-600'}`}
                      style={{ width: `${getProgress(program.startTime, program.endTime)}%` }}
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-[#1a1a1a] rounded-lg p-8 text-center">
          <Tv className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No live programs available right now</p>
          <Link href="/tv-guide" className="text-sm text-purple-400 hover:text-purple-300 mt-2 inline-block">
            Check the full TV Guide
          </Link>
        </div>
      )}
    </section>
  )
}

// ============================================================================
// Browse Section (New Releases)
// ============================================================================

function TitleCard({ card }: { card: AvailabilityCard }) {
  const { openModal } = useTitleModal()
  const [imgError, setImgError] = useState(false)

  return (
    <div
      onClick={() => openModal(card)}
      className="group cursor-pointer flex-shrink-0 w-[140px]"
    >
      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#1a1a1a] mb-2">
        {card.poster_url && !imgError ? (
          <Image
            src={card.poster_url}
            alt={card.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            onError={() => setImgError(true)}
            sizes="140px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-8 h-8 text-gray-700" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        {card.imdb_rating && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 rounded px-1.5 py-0.5">
            <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
            <span className="text-xs text-white font-medium">{card.imdb_rating}</span>
          </div>
        )}
      </div>
      <h3 className="text-sm font-medium text-gray-300 truncate group-hover:text-white transition-colors">
        {card.title}
      </h3>
      <p className="text-xs text-gray-500">{card.year}</p>
    </div>
  )
}

function BrowseSection() {
  const { data: cards = [], isLoading } = useQuery({
    queryKey: ['home', 'new-releases'],
    queryFn: () => getRecentlyAddedCards(8),
    staleTime: 10 * 60 * 1000,
  })

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">New Releases</h2>
            <p className="text-sm text-gray-500">Recently added to the catalog</p>
          </div>
        </div>
        <Link
          href="/browse?sort=recently_added"
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Browse All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="flex-shrink-0 w-[140px] animate-pulse">
              <div className="aspect-[2/3] bg-[#1a1a1a] rounded-lg mb-2" />
              <div className="h-4 bg-[#1a1a1a] rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {cards.map(card => (
            <TitleCard key={card.id} card={card} />
          ))}
        </div>
      )}
    </section>
  )
}

// ============================================================================
// Binge Playlists Section
// ============================================================================

function PlaylistCard({ list, cards }: { list: CuratedList; cards: AvailabilityCard[] }) {
  const [imgError, setImgError] = useState(false)
  const previewCards = cards.slice(0, 4)
  const totalRuntime = cards.reduce((acc, card) => acc + (card.runtime_minutes || 0), 0)
  const hours = Math.floor(totalRuntime / 60)
  const mins = totalRuntime % 60

  return (
    <Link
      href={`/lists/${list.slug}`}
      className="group block bg-[#141414] rounded-xl border border-gray-800 overflow-hidden hover:border-purple-500/50 transition-all"
    >
      {/* Cover image or card collage */}
      <div className="relative aspect-video bg-[#0a0a0a]">
        {list.cover_image && !imgError ? (
          <Image
            src={list.cover_image}
            alt={list.title}
            fill
            className="object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 grid grid-cols-4 gap-0.5 p-0.5">
            {previewCards.map((card, i) => (
              <div key={card.id} className="relative bg-[#1a1a1a]">
                {card.poster_url ? (
                  <Image
                    src={card.poster_url}
                    alt={card.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-4 h-4 text-gray-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
            {cards.length} titles
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
          {list.title}
        </h3>
        {list.description && (
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{list.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
          </span>
          <span className="flex items-center gap-1">
            <PlayCircle className="w-3 h-3" />
            Start Marathon
          </span>
        </div>
      </div>
    </Link>
  )
}

function BingeSection() {
  const { data: lists = [], isLoading: listsLoading } = useQuery({
    queryKey: ['home', 'featured-lists'],
    queryFn: () => getFeaturedLists(),
    staleTime: 10 * 60 * 1000,
  })

  // Fetch cards for each list
  const { data: rows = [], isLoading: rowsLoading } = useQuery({
    queryKey: ['home', 'binge-rows', lists.map(l => l.id)],
    queryFn: async () => {
      const rows: BingeRow[] = []
      for (const list of lists.slice(0, 3)) { // Only show top 3
        const cards = await getCardsByIds(list.cards as string[])
        rows.push({ list, cards })
      }
      return rows
    },
    enabled: lists.length > 0,
    staleTime: 10 * 60 * 1000,
  })

  const isLoading = listsLoading || rowsLoading

  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-600 to-orange-600 flex items-center justify-center">
            <PlayCircle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Binge Playlists</h2>
            <p className="text-sm text-gray-500">Curated marathons ready to watch</p>
          </div>
        </div>
        <Link
          href="/binge"
          className="flex items-center gap-1 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          View All Playlists
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#1a1a1a]" />
              <div className="p-4">
                <div className="h-5 bg-[#1a1a1a] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#1a1a1a] rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : rows.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-3">
          {rows.map(({ list, cards }) => (
            <PlaylistCard key={list.id} list={list} cards={cards} />
          ))}
        </div>
      ) : (
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-8 text-center">
          <PlayCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500">No playlists available yet</p>
        </div>
      )}
    </section>
  )
}

// ============================================================================
// Create Watchlist CTA Section
// ============================================================================

function WatchlistCTA() {
  return (
    <section className="py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900/40 via-[#141414] to-pink-900/40 border border-purple-500/20">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-600/20 rounded-full blur-3xl" />
        </div>

        <div className="relative px-8 py-12 md:py-16 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm mb-4">
              <Heart className="w-4 h-4" />
              Your Personal Collection
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
              Create Your Watchlist
            </h2>
            <p className="text-gray-400">
              Save your favorite horror and sci-fi titles to watch later. Track what you've seen,
              discover new films, and never lose track of that movie someone recommended.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/watchlist"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-900/30"
            >
              <Plus className="w-5 h-5" />
              Start Your Watchlist
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Browse Titles
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Hero Section
// ============================================================================

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-[#0a0a0a] to-[#0a0a0a]" />

      {/* Content */}
      <div className="relative px-4 py-16 md:py-24 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="relative">
            <Ghost className="w-16 h-16 text-purple-500" />
            <Zap className="absolute -top-1 -right-1 w-6 h-6 text-yellow-400" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Ghosts in the Machine
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
          Your ultimate guide to horror and sci-fi streaming. Discover what's on TV,
          browse thousands of titles, and build the perfect movie marathon.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/tv-guide"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors shadow-lg shadow-purple-900/30"
          >
            <Radio className="w-5 h-5" />
            TV Guide
          </Link>
          <Link
            href="/browse"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            <Film className="w-5 h-5" />
            Browse Titles
          </Link>
          <Link
            href="/binge"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
          >
            <PlayCircle className="w-5 h-5" />
            Binge Playlists
          </Link>
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Main Home Page
// ============================================================================

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <HeroSection />

      <div className="max-w-[1400px] mx-auto px-4">
        <WhatsOnNowSection />
        <BrowseSection />
        <BingeSection />
        <WatchlistCTA />
      </div>

      {/* Footer */}
      <footer className="max-w-[1400px] mx-auto px-4 py-8 mt-8 border-t border-gray-800 text-center">
        <p className="text-gray-700 text-sm">
          Ghosts in the Machine &copy; {new Date().getFullYear()} | Horror & Sci-Fi TV Guide
        </p>
      </footer>
    </main>
  )
}

'use client'

import { useState, useCallback, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { Ghost, Plus, Play, List, User, Sparkles, Loader2, Heart } from 'lucide-react'
import { BingeGrid } from '@/components/BingeGrid'
import { CreateListModal } from '@/components/CreateListModal'
import { getBingeRows, getEditorialLists, type BingeRow } from '@/lib/list-data'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { AvailabilityCard, CuratedList } from '@/types'

type FilterOption = 'all' | 'editorial' | 'my-lists'

/**
 * Filter tabs component
 */
function FilterTabs({
  active,
  onChange,
}: {
  active: FilterOption
  onChange: (filter: FilterOption) => void
}) {
  const tabs: { value: FilterOption; label: string; icon: React.ElementType }[] = [
    { value: 'all', label: 'All', icon: List },
    { value: 'editorial', label: 'Editorial', icon: Sparkles },
    { value: 'my-lists', label: 'My Lists', icon: User },
  ]

  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-colors
            ${
              active === tab.value
                ? 'bg-purple-600 text-white'
                : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#252525]'
            }
          `}
        >
          <tab.icon className="w-4 h-4" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}

/**
 * Empty state for no lists
 */
function EmptyState({
  filter,
  onCreateList,
}: {
  filter: FilterOption
  onCreateList: () => void
}) {
  const getMessage = () => {
    switch (filter) {
      case 'my-lists':
        return {
          title: 'No personal lists yet',
          description: 'Create your first list to start organizing your horror marathons.',
          showButton: true,
        }
      case 'editorial':
        return {
          title: 'No editorial lists available',
          description: 'Check back soon for curated collections from our team.',
          showButton: false,
        }
      default:
        return {
          title: 'No lists found',
          description: 'Start building your horror collection.',
          showButton: true,
        }
    }
  }

  const message = getMessage()

  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <List className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">{message.title}</h3>
      <p className="text-gray-500 max-w-md mb-6">{message.description}</p>
      {message.showButton && (
        <button
          onClick={onCreateList}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Your First List
        </button>
      )}
    </div>
  )
}

/**
 * Loading skeleton for binge grid
 */
function BingeGridSkeleton() {
  return (
    <div className="bg-[#0a0a0a] rounded-xl border border-gray-800 overflow-hidden animate-pulse">
      {/* Header */}
      <div className="px-4 py-3 bg-[#0f0f0f] border-b border-gray-800">
        <div className="h-6 bg-[#252525] rounded w-32" />
      </div>

      {/* Rows */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex border-b border-gray-800/50 last:border-b-0">
          {/* Row header */}
          <div className="w-[200px] p-4 border-r border-gray-800/50">
            <div className="aspect-video bg-[#252525] rounded-lg mb-3" />
            <div className="h-4 bg-[#252525] rounded w-3/4 mb-2" />
            <div className="h-2 bg-[#252525] rounded w-1/2" />
          </div>

          {/* Cards */}
          <div className="flex-1 p-4 flex gap-3">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="w-[140px] flex-shrink-0">
                <div className="aspect-[2/3] bg-[#252525] rounded-lg" />
                <div className="h-3 bg-[#252525] rounded w-3/4 mt-2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Binge Now Page
 *
 * Showcases the unique binge watching feature with:
 * - User watchlist
 * - Editorial curated lists
 * - Custom user lists
 */
export default function BingePage() {
  const [filter, setFilter] = useState<FilterOption>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [watchedItems, setWatchedItems] = useState<Set<string>>(new Set())

  // Fetch user's watchlist
  const { watchlistCards, isLoading: watchlistLoading } = useWatchlist()

  // Fetch binge rows based on filter
  const { data: rows, isLoading, error } = useQuery({
    queryKey: ['binge-rows', filter],
    queryFn: () => getBingeRows(filter),
    staleTime: 5 * 60 * 1000,
  })

  // Create watchlist row to show as first row
  const watchlistRow: BingeRow | null = useMemo(() => {
    if (watchlistCards.length === 0) return null
    return {
      list: {
        id: 'user-watchlist',
        title: 'My Watchlist',
        slug: 'watchlist',
        description: 'Your personal watchlist - movies you want to watch',
        cover_image: '',
        cards: watchlistCards.map(c => c.id),
        type: 'user-watchlist' as const,
        author: 'You',
        featured: false,
        published: true,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      cards: watchlistCards,
    }
  }, [watchlistCards])

  // Combine watchlist with other rows
  const allRows = useMemo(() => {
    const baseRows = rows || []
    // Show watchlist as first row when filter is 'all' or 'my-lists'
    if (watchlistRow && (filter === 'all' || filter === 'my-lists')) {
      return [watchlistRow, ...baseRows]
    }
    return baseRows
  }, [rows, watchlistRow, filter])

  // Fetch editorial lists for modal
  const { data: editorialLists = [] } = useQuery({
    queryKey: ['editorial-lists'],
    queryFn: () => getEditorialLists(),
    staleTime: 10 * 60 * 1000,
  })

  // Toggle watched state
  const handleToggleWatched = useCallback((cardId: string) => {
    setWatchedItems((prev) => {
      const next = new Set(prev)
      if (next.has(cardId)) {
        next.delete(cardId)
      } else {
        next.add(cardId)
      }
      return next
    })
  }, [])

  // Card selection handler
  const handleCardSelect = useCallback((card: AvailabilityCard, list: CuratedList) => {
    console.log('Selected card:', card.title, 'from list:', list.title)
    // TODO: Open detail modal
  }, [])

  // List selection handler
  const handleListSelect = useCallback((list: CuratedList) => {
    console.log('Selected list:', list.title)
    // TODO: Navigate to list detail page
  }, [])

  // Create list handlers
  const handleCreateEmpty = useCallback((name: string, description: string) => {
    console.log('Create empty list:', name, description)
    // TODO: Create list in Supabase
    alert(`Created list: ${name}`)
  }, [])

  const handleCreateFromList = useCallback((sourceList: CuratedList) => {
    console.log('Copy list:', sourceList.title)
    // TODO: Create copy in Supabase
    alert(`Copied list: ${sourceList.title}`)
  }, [])

  const handleCreateFromSearch = useCallback(() => {
    console.log('Create from search')
    // TODO: Navigate to search with create mode
    alert('Opening search...')
  }, [])

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Ghost className="w-8 h-8 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-xl font-bold text-white group-hover:text-purple-300 transition-colors">
                Ghosts in the Machine
              </span>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                TV Guide
              </Link>
              <Link
                href="/browse"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Browse
              </Link>
              <Link href="/binge" className="text-sm text-purple-400 font-medium">
                Binge Now
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-purple-900/20 to-transparent">
        <div className="max-w-[1600px] mx-auto px-4 py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <Play className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Binge Now
                  </h1>
                  <p className="text-gray-400 mt-1">
                    Organize your horror marathons
                  </p>
                </div>
              </div>

              <p className="text-gray-500 max-w-xl">
                Track your progress through classic franchises, curated collections,
                and your personal watchlists. Pick up right where you left off.
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="
                flex items-center gap-2 px-5 py-3 rounded-xl
                bg-purple-600 hover:bg-purple-500 text-white font-medium
                transition-colors shadow-lg shadow-purple-900/30
              "
            >
              <Plus className="w-5 h-5" />
              New List
            </button>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <FilterTabs active={filter} onChange={setFilter} />

            <div className="text-sm text-gray-500">
              {isLoading || watchlistLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading...
                </span>
              ) : allRows ? (
                <span>{allRows.length} collection{allRows.length !== 1 ? 's' : ''}</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-center mb-8">
            <p className="text-red-400">Failed to load lists</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        )}

        {/* Loading State */}
        {(isLoading || watchlistLoading) && <BingeGridSkeleton />}

        {/* Content */}
        {!isLoading && !watchlistLoading && !error && (
          <>
            {allRows.length === 0 ? (
              <EmptyState filter={filter} onCreateList={() => setIsModalOpen(true)} />
            ) : (
              <BingeGrid
                rows={allRows}
                watchedItems={watchedItems}
                onCardSelect={handleCardSelect}
                onListSelect={handleListSelect}
                onToggleWatched={handleToggleWatched}
              />
            )}
          </>
        )}

        {/* Tips Section */}
        {!isLoading && !watchlistLoading && allRows.length > 0 && (
          <section className="mt-12 p-6 rounded-xl bg-[#0f0f0f] border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">
              Tips for the Perfect Marathon
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Track Your Progress</h4>
                  <p className="text-sm text-gray-500">
                    Click "Mark Watched" on each title to track where you are in a series.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Continue Watching</h4>
                  <p className="text-sm text-gray-500">
                    The "Continue" button jumps to your first unwatched title.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-purple-400 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Create Custom Lists</h4>
                  <p className="text-sm text-gray-500">
                    Mix and match titles from any franchise into your own playlists.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto px-4 py-8 mt-8 border-t border-gray-800 text-center">
        <p className="text-gray-700 text-sm">
          Ghosts in the Machine &copy; {new Date().getFullYear()} | Horror & Sci-Fi TV Guide
        </p>
      </footer>

      {/* Create List Modal */}
      <CreateListModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateEmpty={handleCreateEmpty}
        onCreateFromList={handleCreateFromList}
        onCreateFromSearch={handleCreateFromSearch}
        availableLists={editorialLists}
      />
    </main>
  )
}

'use client'

import Link from 'next/link'
import { Users, Ghost, Loader2, ListX } from 'lucide-react'
import { useCommunityLists } from '@/hooks/useCommunityLists'
import { CommunityListCard } from '@/components/community/CommunityListCard'

/**
 * Empty state when no community lists exist
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-24 h-24 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
        <ListX className="w-12 h-12 text-gray-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-300 mb-2">
        No shared lists yet
      </h3>
      <p className="text-gray-500 max-w-md mb-6">
        Be the first to share your watchlist with the community! Go to your watchlist and click the Share button.
      </p>
      <Link
        href="/watchlist"
        className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg transition-colors"
      >
        Go to Watchlist
      </Link>
    </div>
  )
}

/**
 * Community Lists Page
 *
 * Displays all public shared watchlists from the community
 */
export default function CommunityPage() {
  const { lists, isLoading, error } = useCommunityLists()

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Community Lists</h1>
                <p className="text-gray-500">
                  Discover watchlists shared by Ghost Guide members
                </p>
              </div>
            </div>

            <Link href="/" className="flex items-center gap-2 group">
              <Ghost className="w-6 h-6 text-purple-500 group-hover:text-purple-400 transition-colors" />
              <span className="text-sm font-medium text-gray-400 group-hover:text-white transition-colors hidden sm:block">
                Ghost Guide
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-center">
            <p className="text-red-400">Failed to load community lists</p>
            <p className="text-sm text-gray-500 mt-2">Please try again later</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && lists.length === 0 && (
          <EmptyState />
        )}

        {/* List grid */}
        {!isLoading && !error && lists.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <CommunityListCard key={list.id} list={list} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

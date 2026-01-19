'use client'

import { Film, Search, Calendar, Heart, List, Tv, RefreshCw, Ghost } from 'lucide-react'
import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

/**
 * Base empty state component
 */
export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-20 h-20 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-6">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-300 mb-2">{title}</h3>

      {description && (
        <p className="text-sm text-gray-500 max-w-md mb-6">{description}</p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

/**
 * No search results empty state
 */
export function NoSearchResults({
  query,
  onClear,
}: {
  query?: string
  onClear?: () => void
}) {
  return (
    <EmptyState
      icon={<Search className="w-10 h-10 text-gray-600" />}
      title="No results found"
      description={
        query
          ? `We couldn't find any titles matching "${query}". Try different keywords or check the spelling.`
          : "Try adjusting your search terms or filters to find what you're looking for."
      }
      action={onClear ? { label: 'Clear search', onClick: onClear } : undefined}
    />
  )
}

/**
 * No titles in list empty state
 */
export function NoTitlesInList({
  listName,
  onBrowse,
}: {
  listName?: string
  onBrowse?: () => void
}) {
  return (
    <EmptyState
      icon={<List className="w-10 h-10 text-gray-600" />}
      title={listName ? `"${listName}" is empty` : 'No titles in this list'}
      description="Start building your collection by adding some titles. Browse our catalog to find movies and shows you love."
      action={onBrowse ? { label: 'Browse titles', onClick: onBrowse } : undefined}
    />
  )
}

/**
 * Empty watchlist state
 */
export function EmptyWatchlist({ onBrowse }: { onBrowse?: () => void }) {
  return (
    <EmptyState
      icon={<Heart className="w-10 h-10 text-gray-600" />}
      title="Your watchlist is empty"
      description="Keep track of movies and shows you want to watch. Click the heart icon on any title to add it here."
      action={onBrowse ? { label: 'Discover titles', onClick: onBrowse } : undefined}
    />
  )
}

/**
 * No schedule data empty state
 */
export function NoScheduleData({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={<Calendar className="w-10 h-10 text-gray-600" />}
      title="No schedule available"
      description="TV schedule data is temporarily unavailable. Please check back later."
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  )
}

/**
 * No streaming sources empty state
 */
export function NoStreamingSources() {
  return (
    <EmptyState
      icon={<Tv className="w-10 h-10 text-gray-600" />}
      title="No streaming options"
      description="This title isn't currently available on any streaming platforms we track. Check back later as availability changes frequently."
    />
  )
}

/**
 * No titles matching filters
 */
export function NoFilterResults({
  onClearFilters,
}: {
  onClearFilters?: () => void
}) {
  return (
    <EmptyState
      icon={<Film className="w-10 h-10 text-gray-600" />}
      title="No titles match your filters"
      description="Try adjusting your filters or selecting different genres to see more results."
      action={onClearFilters ? { label: 'Clear all filters', onClick: onClearFilters } : undefined}
    />
  )
}

/**
 * Generic loading failed state with retry
 */
export function LoadingFailed({
  message = 'Failed to load content',
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <EmptyState
      icon={<RefreshCw className="w-10 h-10 text-gray-600" />}
      title="Oops! Something went wrong"
      description={message}
      action={onRetry ? { label: 'Try again', onClick: onRetry } : undefined}
    />
  )
}

/**
 * No curated lists empty state
 */
export function NoLists({ onCreateList }: { onCreateList?: () => void }) {
  return (
    <EmptyState
      icon={<List className="w-10 h-10 text-gray-600" />}
      title="No lists yet"
      description="Create your first curated list to organize and share your favorite horror and sci-fi picks."
      action={onCreateList ? { label: 'Create a list', onClick: onCreateList } : undefined}
    />
  )
}

/**
 * Coming soon placeholder
 */
export function ComingSoon({ feature }: { feature?: string }) {
  return (
    <EmptyState
      icon={<Ghost className="w-10 h-10 text-purple-500" />}
      title="Coming Soon"
      description={
        feature
          ? `${feature} is currently under development. Stay tuned for updates!`
          : "This feature is currently under development. Stay tuned for updates!"
      }
    />
  )
}

export default EmptyState

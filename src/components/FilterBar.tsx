'use client'

import { useCallback, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, SlidersHorizontal, ChevronDown, Filter } from 'lucide-react'

// Filter options
export const GENRE_OPTIONS = [
  { value: 'horror', label: 'Horror' },
  { value: 'sci-fi', label: 'Sci-Fi' },
  { value: 'thriller', label: 'Thriller' },
  { value: 'mystery', label: 'Mystery' },
  { value: 'fantasy', label: 'Fantasy' },
  { value: 'action', label: 'Action' },
] as const

export const DECADE_OPTIONS = [
  { value: '2020s', label: '2020s', min: 2020, max: 2029 },
  { value: '2010s', label: '2010s', min: 2010, max: 2019 },
  { value: '2000s', label: '2000s', min: 2000, max: 2009 },
  { value: '1990s', label: '1990s', min: 1990, max: 1999 },
  { value: '1980s', label: '1980s', min: 1980, max: 1989 },
  { value: '1970s', label: '1970s', min: 1970, max: 1979 },
  { value: 'classic', label: 'Pre-1970', min: 1900, max: 1969 },
] as const

export const SERVICE_OPTIONS = [
  { value: 'shudder', label: 'Shudder' },
  { value: 'netflix', label: 'Netflix' },
  { value: 'prime', label: 'Prime Video' },
  { value: 'hulu', label: 'Hulu' },
  { value: 'max', label: 'Max' },
  { value: 'peacock', label: 'Peacock' },
  { value: 'tubi', label: 'Tubi' },
  { value: 'paramount', label: 'Paramount+' },
] as const

export const RUNTIME_OPTIONS = [
  { value: 'short', label: 'Under 90 min', max: 89 },
  { value: 'medium', label: '90-120 min', min: 90, max: 120 },
  { value: 'long', label: 'Over 2 hours', min: 121 },
] as const

export const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest Rated' },
  { value: 'year_desc', label: 'Newest First' },
  { value: 'year_asc', label: 'Oldest First' },
  { value: 'title', label: 'A-Z' },
  { value: 'recently_added', label: 'Recently Added' },
] as const

export interface FilterState {
  q?: string  // Search query
  genre?: string
  decade?: string
  service?: string
  runtime?: string
  sort?: string
}

interface FilterBarProps {
  loading?: boolean
  resultCount?: number
}

/**
 * Dropdown select component
 */
function FilterSelect({
  label,
  value,
  options,
  onChange,
  placeholder,
}: {
  label: string
  value: string | undefined
  options: readonly { value: string; label: string }[]
  onChange: (value: string | undefined) => void
  placeholder?: string
}) {
  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="
          appearance-none bg-[#1a1a1a] border border-gray-800 rounded-lg
          px-4 py-2.5 pr-10 text-sm text-white
          hover:border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500
          transition-colors cursor-pointer
          min-w-[140px]
        "
      >
        <option value="">{placeholder || label}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  )
}

/**
 * Active filter chip
 */
function FilterChip({
  label,
  onRemove,
}: {
  label: string
  onRemove: () => void
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-purple-600/20 text-purple-300 text-xs px-2 py-1 rounded-full">
      {label}
      <button
        onClick={onRemove}
        className="hover:text-white transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  )
}

/**
 * Mobile Filter Panel
 */
function MobileFilterPanel({
  isOpen,
  onClose,
  filters,
  updateFilters,
  clearAllFilters,
}: {
  isOpen: boolean
  onClose: () => void
  filters: FilterState
  updateFilters: (updates: Partial<FilterState>) => void
  clearAllFilters: () => void
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - slides up from bottom */}
      <div
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 z-50 bg-[#141414] rounded-t-2xl max-h-[85vh] overflow-y-auto"
      >
        {/* Handle */}
        <div className="sticky top-0 bg-[#141414] pt-3 pb-2 px-4 border-b border-gray-800">
          <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Filters</h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-400 hover:text-white active:bg-gray-800 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter sections */}
        <div className="p-4 space-y-6">
          {/* Genre */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Genre</label>
            <div className="grid grid-cols-2 gap-2">
              {GENRE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ genre: filters.genre === option.value ? undefined : option.value })}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                    ${filters.genre === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300 active:bg-[#252525]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Decade */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Decade</label>
            <div className="grid grid-cols-2 gap-2">
              {DECADE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ decade: filters.decade === option.value ? undefined : option.value })}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                    ${filters.decade === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300 active:bg-[#252525]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Service */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Streaming Service</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ service: filters.service === option.value ? undefined : option.value })}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                    ${filters.service === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300 active:bg-[#252525]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Runtime */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Runtime</label>
            <div className="grid grid-cols-1 gap-2">
              {RUNTIME_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ runtime: filters.runtime === option.value ? undefined : option.value })}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                    ${filters.runtime === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300 active:bg-[#252525]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Sort By</label>
            <div className="grid grid-cols-1 gap-2">
              {SORT_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => updateFilters({ sort: filters.sort === option.value ? undefined : option.value })}
                  className={`
                    px-4 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]
                    ${filters.sort === option.value
                      ? 'bg-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-gray-300 active:bg-[#252525]'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-[#141414] border-t border-gray-800 p-4 flex gap-3">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-4 py-3 rounded-lg bg-gray-800 text-gray-300 font-medium active:bg-gray-700 min-h-[44px]"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-lg bg-purple-600 text-white font-medium active:bg-purple-500 min-h-[44px]"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  )
}

/**
 * FilterBar Component
 *
 * Sticky filter bar for the browse page with dropdowns
 * and active filter chips. Collapses to single button on mobile.
 */
export function FilterBar({ loading, resultCount }: FilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  // Get current filter values from URL
  const filters: FilterState = {
    q: searchParams.get('q') || undefined,
    genre: searchParams.get('genre') || undefined,
    decade: searchParams.get('decade') || undefined,
    service: searchParams.get('service') || undefined,
    runtime: searchParams.get('runtime') || undefined,
    sort: searchParams.get('sort') || undefined,
  }

  // Count active filters (excluding sort from count, but including search)
  const activeFilterCount = Object.entries(filters)
    .filter(([key, value]) => value && key !== 'sort')
    .length

  // Update URL with new filter values
  const updateFilters = useCallback(
    (updates: Partial<FilterState>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      })

      // Reset to page 1 when filters change
      params.delete('page')

      router.push(`/browse?${params.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    router.push('/browse', { scroll: false })
    setMobileFiltersOpen(false)
  }, [router])

  // Get label for active filter
  const getFilterLabel = (type: keyof FilterState, value: string): string => {
    switch (type) {
      case 'q':
        return `"${value}"`
      case 'genre':
        return GENRE_OPTIONS.find((o) => o.value === value)?.label || value
      case 'decade':
        return DECADE_OPTIONS.find((o) => o.value === value)?.label || value
      case 'service':
        return SERVICE_OPTIONS.find((o) => o.value === value)?.label || value
      case 'runtime':
        return RUNTIME_OPTIONS.find((o) => o.value === value)?.label || value
      case 'sort':
        return SORT_OPTIONS.find((o) => o.value === value)?.label || value
      default:
        return value
    }
  }

  return (
    <>
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-[1600px] mx-auto px-4">
          {/* Mobile: Single filter button */}
          <div className="py-3 flex md:hidden items-center justify-between gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white font-medium active:bg-[#252525] min-h-[44px]"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-600 text-xs">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Mobile sort quick access */}
            <div className="relative flex-1 max-w-[140px]">
              <select
                value={filters.sort || ''}
                onChange={(e) => updateFilters({ sort: e.target.value || undefined })}
                className="w-full appearance-none bg-[#1a1a1a] border border-gray-800 rounded-lg px-3 py-2.5 pr-8 text-sm text-white min-h-[44px]"
              >
                <option value="">Sort by</option>
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            {/* Result count */}
            <div className="text-sm text-gray-500 whitespace-nowrap">
              {loading ? (
                <span className="animate-pulse">...</span>
              ) : resultCount !== undefined ? (
                <span>{resultCount.toLocaleString()}</span>
              ) : null}
            </div>
          </div>

          {/* Desktop: Full filter row */}
          <div className="py-4 hidden md:flex flex-wrap items-center gap-3">
            {/* Filter icon */}
            <div className="flex items-center gap-2 text-gray-400 mr-2">
              <SlidersHorizontal className="w-5 h-5" />
              <span className="text-sm font-medium">Filters</span>
            </div>

            {/* Filter dropdowns */}
            <FilterSelect
              label="Genre"
              value={filters.genre}
              options={GENRE_OPTIONS}
              onChange={(value) => updateFilters({ genre: value })}
              placeholder="Genre"
            />

            <FilterSelect
              label="Decade"
              value={filters.decade}
              options={DECADE_OPTIONS}
              onChange={(value) => updateFilters({ decade: value })}
              placeholder="Decade"
            />

            <FilterSelect
              label="Service"
              value={filters.service}
              options={SERVICE_OPTIONS}
              onChange={(value) => updateFilters({ service: value })}
              placeholder="Service"
            />

            <FilterSelect
              label="Runtime"
              value={filters.runtime}
              options={RUNTIME_OPTIONS}
              onChange={(value) => updateFilters({ runtime: value })}
              placeholder="Runtime"
            />

            {/* Divider */}
            <div className="w-px h-8 bg-gray-800 mx-2" />

            {/* Sort dropdown */}
            <FilterSelect
              label="Sort"
              value={filters.sort}
              options={SORT_OPTIONS}
              onChange={(value) => updateFilters({ sort: value })}
              placeholder="Sort by"
            />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Result count */}
            <div className="text-sm text-gray-500">
              {loading ? (
                <span className="animate-pulse">Loading...</span>
              ) : resultCount !== undefined ? (
                <span>
                  {resultCount.toLocaleString()} title{resultCount !== 1 ? 's' : ''}
                </span>
              ) : null}
            </div>
          </div>

          {/* Active filters row - desktop only */}
          {activeFilterCount > 0 && (
            <div className="pb-3 hidden md:flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-500">Active:</span>

              {Object.entries(filters).map(([key, value]) =>
                value && key !== 'sort' ? (
                  <FilterChip
                    key={key}
                    label={getFilterLabel(key as keyof FilterState, value)}
                    onRemove={() => updateFilters({ [key]: undefined })}
                  />
                ) : null
              )}

              <button
                onClick={clearAllFilters}
                className="text-xs text-gray-500 hover:text-white transition-colors ml-2"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Mobile active filters - horizontal scroll */}
          {activeFilterCount > 0 && (
            <div className="pb-3 flex md:hidden items-center gap-2 overflow-x-auto scrollbar-hide">
              {Object.entries(filters).map(([key, value]) =>
                value && key !== 'sort' ? (
                  <FilterChip
                    key={key}
                    label={getFilterLabel(key as keyof FilterState, value)}
                    onRemove={() => updateFilters({ [key]: undefined })}
                  />
                ) : null
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter panel */}
      <MobileFilterPanel
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        filters={filters}
        updateFilters={updateFilters}
        clearAllFilters={clearAllFilters}
      />
    </>
  )
}

export default FilterBar

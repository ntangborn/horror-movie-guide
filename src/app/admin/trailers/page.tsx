'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
  Youtube,
  Check,
  X,
  RefreshCw,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { TrailerStatus } from '@/types'

interface TrailerItem {
  id: string
  title: string
  year: number
  poster_url: string | null
  trailer_youtube_id: string | null
  trailer_video_title: string | null
  trailer_channel: string | null
  trailer_status: TrailerStatus | null
  trailer_scraped_at: string | null
  trailer_reviewed_at: string | null
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected'

const ITEMS_PER_PAGE = 20

export default function TrailersPage() {
  const [trailers, setTrailers] = useState<TrailerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('pending')
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  })
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  // Fetch stats
  const fetchStats = useCallback(async () => {
    const { data, error } = await supabase
      .from('availability_cards')
      .select('trailer_status')
      .not('trailer_youtube_id', 'is', null)

    if (error) {
      console.error('Error fetching stats:', error)
      return
    }

    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: data.length,
    }

    data.forEach((item) => {
      const status = item.trailer_status as TrailerStatus
      if (status === 'pending') counts.pending++
      else if (status === 'approved') counts.approved++
      else if (status === 'rejected') counts.rejected++
    })

    setStats(counts)
  }, [supabase])

  // Fetch trailers
  const fetchTrailers = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('availability_cards')
      .select('id, title, year, poster_url, trailer_youtube_id, trailer_video_title, trailer_channel, trailer_status, trailer_scraped_at, trailer_reviewed_at', { count: 'exact' })
      .not('trailer_youtube_id', 'is', null)
      .order('trailer_scraped_at', { ascending: false, nullsFirst: false })

    if (filterStatus !== 'all') {
      query = query.eq('trailer_status', filterStatus)
    }

    const from = (page - 1) * ITEMS_PER_PAGE
    const to = from + ITEMS_PER_PAGE - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching trailers:', error)
      setLoading(false)
      return
    }

    setTrailers(data || [])
    setTotalCount(count || 0)
    setLoading(false)
  }, [supabase, filterStatus, page])

  useEffect(() => {
    fetchTrailers()
    fetchStats()
  }, [fetchTrailers, fetchStats])

  // Update trailer status via API
  const updateStatus = async (id: string, newStatus: 'approved' | 'rejected') => {
    setProcessingIds(prev => new Set(prev).add(id))

    try {
      const response = await fetch('/api/admin/trailers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      return
    }

    setProcessingIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    // Optimistic update
    setTrailers(prev =>
      prev.map(t =>
        t.id === id ? { ...t, trailer_status: newStatus } : t
      )
    )
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })

    // Update stats
    setStats(prev => {
      const current = trailers.find(t => t.id === id)?.trailer_status
      const updates = { ...prev }
      if (current === 'pending') updates.pending--
      else if (current === 'approved') updates.approved--
      else if (current === 'rejected') updates.rejected--

      if (newStatus === 'approved') updates.approved++
      else if (newStatus === 'rejected') updates.rejected++
      return updates
    })
  }

  // Bulk approve via API
  const bulkApprove = async () => {
    const ids = Array.from(selectedIds)
    if (ids.length === 0) return

    // Mark all as processing
    setProcessingIds(new Set(ids))

    try {
      const response = await fetch('/api/admin/trailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status: 'approved' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to bulk update')
      }

      // Update local state
      setTrailers(prev =>
        prev.map(t =>
          ids.includes(t.id) ? { ...t, trailer_status: 'approved' as const } : t
        )
      )
      setSelectedIds(new Set())

      // Update stats
      setStats(prev => ({
        ...prev,
        pending: prev.pending - ids.length,
        approved: prev.approved + ids.length,
      }))
    } catch (error) {
      console.error('Error bulk approving:', error)
    } finally {
      setProcessingIds(new Set())
    }
  }

  // Toggle selection
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Select all on current page
  const selectAll = () => {
    if (selectedIds.size === trailers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(trailers.map(t => t.id)))
    }
  }

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Youtube className="w-7 h-7 text-red-500" />
            Trailer Review
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and approve YouTube trailers for movies
          </p>
        </div>

        <button
          onClick={() => {
            fetchTrailers()
            fetchStats()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Pending</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.pending}</p>
        </div>
        <div className="bg-[#141414] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-green-500 mb-1">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm">Approved</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.approved}</p>
        </div>
        <div className="bg-[#141414] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-red-500 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm">Rejected</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.rejected}</p>
        </div>
        <div className="bg-[#141414] rounded-lg p-4 border border-gray-800">
          <div className="flex items-center gap-2 text-purple-500 mb-1">
            <Youtube className="w-4 h-4" />
            <span className="text-sm">Total</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-[#141414] rounded-lg p-4 border border-gray-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-400">Filter:</span>
          <div className="flex gap-1">
            {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilterStatus(status)
                  setPage(1)
                  setSelectedIds(new Set())
                }}
                className={`px-3 py-1.5 rounded-lg text-sm capitalize transition-colors ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {selectedIds.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">{selectedIds.size} selected</span>
            <button
              onClick={bulkApprove}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Approve All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Trailer List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : trailers.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <AlertCircle className="w-12 h-12 mb-4" />
          <p>No trailers found matching the current filter.</p>
        </div>
      ) : (
        <>
          {/* Select All */}
          {filterStatus === 'pending' && trailers.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={selectAll}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {selectedIds.size === trailers.length ? 'Deselect all' : 'Select all on page'}
              </button>
            </div>
          )}

          {/* Trailer Grid */}
          <div className="space-y-4">
            {trailers.map((trailer) => (
              <TrailerCard
                key={trailer.id}
                trailer={trailer}
                isSelected={selectedIds.has(trailer.id)}
                isProcessing={processingIds.has(trailer.id)}
                onToggleSelect={() => toggleSelection(trailer.id)}
                onApprove={() => updateStatus(trailer.id, 'approved')}
                onReject={() => updateStatus(trailer.id, 'rejected')}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Showing {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, totalCount)} of {totalCount}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-400">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

interface TrailerCardProps {
  trailer: TrailerItem
  isSelected: boolean
  isProcessing: boolean
  onToggleSelect: () => void
  onApprove: () => void
  onReject: () => void
}

function TrailerCard({
  trailer,
  isSelected,
  isProcessing,
  onToggleSelect,
  onApprove,
  onReject,
}: TrailerCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)

  const statusColors = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    approved: 'bg-green-500/20 text-green-400 border-green-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    none: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  }

  return (
    <div className={`bg-[#141414] rounded-lg border ${isSelected ? 'border-purple-500' : 'border-gray-800'} overflow-hidden`}>
      <div className="flex flex-col lg:flex-row">
        {/* Movie Info */}
        <div className="flex gap-4 p-4 lg:w-1/3">
          {trailer.trailer_status === 'pending' && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-500 bg-gray-800 mt-1 shrink-0"
            />
          )}
          <div className="relative w-16 h-24 shrink-0 rounded overflow-hidden bg-gray-800">
            {trailer.poster_url ? (
              <Image
                src={trailer.poster_url}
                alt={trailer.title}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-600">
                <Youtube className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-white truncate">{trailer.title}</h3>
            <p className="text-sm text-gray-400">{trailer.year}</p>
            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded border capitalize ${statusColors[trailer.trailer_status || 'none']}`}>
              {trailer.trailer_status || 'none'}
            </span>
          </div>
        </div>

        {/* Trailer Info & Preview */}
        <div className="flex-1 p-4 border-t lg:border-t-0 lg:border-l border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm text-gray-300 truncate" title={trailer.trailer_video_title || ''}>
                {trailer.trailer_video_title || 'No title'}
              </p>
              <p className="text-xs text-gray-500">
                Channel: {trailer.trailer_channel || 'Unknown'}
              </p>
            </div>
            <button
              onClick={() => setShowEmbed(!showEmbed)}
              className="shrink-0 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg transition-colors flex items-center gap-1"
            >
              <Youtube className="w-4 h-4" />
              {showEmbed ? 'Hide' : 'Preview'}
            </button>
          </div>

          {/* Embedded Preview */}
          {showEmbed && trailer.trailer_youtube_id && (
            <div className="mt-4 aspect-video w-full max-w-md rounded-lg overflow-hidden bg-black">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailer.trailer_youtube_id}`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex lg:flex-col gap-2 p-4 border-t lg:border-t-0 lg:border-l border-gray-800 lg:w-32">
          {trailer.trailer_status === 'pending' ? (
            <>
              <button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Approve
              </button>
              <button
                onClick={onReject}
                disabled={isProcessing}
                className="flex-1 lg:flex-none flex items-center justify-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg transition-colors"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                Reject
              </button>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <span className={`text-sm ${trailer.trailer_status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                {trailer.trailer_status === 'approved' ? 'Approved' : 'Rejected'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Eye,
  Clock,
  Filter,
  MousePointer,
  TrendingUp,
  Loader2,
  AlertCircle,
} from 'lucide-react'

interface SessionData {
  sessionsToday: number
  sessionsWeek: number
  pageViewsToday: number
  avgSessionDuration: number
  popularPages: { path: string; count: number }[]
  popularFilters: { filter: string; count: number }[]
  popularCards: { cardId: string; title: string; count: number }[]
  sessionsByDay: { date: string; sessions: number }[]
}

function StatCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center text-blue-400">
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subtext && <p className="text-xs text-gray-600 mt-1">{subtext}</p>}
    </div>
  )
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

export default function AdminSessionsPage() {
  const [data, setData] = useState<SessionData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/sessions')
        if (!response.ok) {
          throw new Error('Failed to fetch session data')
        }
        const json = await response.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="ml-3 text-gray-400">Loading session data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-600/10 border border-red-600/30 rounded-lg">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (!data) return null

  const maxSessions = Math.max(...data.sessionsByDay.map((d) => d.sessions), 1)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Session Analytics</h1>
        <p className="text-gray-500">Track user sessions and engagement</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Sessions Today"
          value={data.sessionsToday}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Sessions This Week"
          value={data.sessionsWeek}
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Page Views Today"
          value={data.pageViewsToday}
          icon={<Eye className="w-5 h-5" />}
        />
        <StatCard
          label="Avg Session Duration"
          value={formatDuration(data.avgSessionDuration)}
          subtext="Based on activity heartbeat"
          icon={<Clock className="w-5 h-5" />}
        />
      </div>

      {/* Sessions chart */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
        <h2 className="font-semibold text-white mb-4">Sessions (Last 7 Days)</h2>
        <div className="flex items-end gap-2 h-32">
          {data.sessionsByDay.map((day) => (
            <div key={day.date} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t"
                style={{
                  height: `${(day.sessions / maxSessions) * 100}%`,
                  minHeight: day.sessions > 0 ? '4px' : '0',
                }}
              />
              <p className="text-xs text-gray-500 mt-2">
                {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
              </p>
              <p className="text-xs text-gray-600">{day.sessions}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular pages */}
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-white">Popular Pages</h2>
          </div>
          {data.popularPages.length === 0 ? (
            <p className="text-gray-500 text-sm">No page view data yet</p>
          ) : (
            <div className="space-y-2">
              {data.popularPages.map((page, i) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm w-5">{i + 1}.</span>
                    <span className="text-gray-300 text-sm font-mono truncate max-w-[200px]">
                      {page.path}
                    </span>
                  </div>
                  <span className="text-gray-500 text-sm">{page.count} views</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Popular filters */}
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <h2 className="font-semibold text-white">Popular Filters</h2>
          </div>
          {data.popularFilters.length === 0 ? (
            <p className="text-gray-500 text-sm">No filter data yet</p>
          ) : (
            <div className="space-y-2">
              {data.popularFilters.map((filter, i) => (
                <div
                  key={filter.filter}
                  className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 text-sm w-5">{i + 1}.</span>
                    <span className="text-gray-300 text-sm">{filter.filter}</span>
                  </div>
                  <span className="text-gray-500 text-sm">{filter.count}x</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Popular cards */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
        <div className="flex items-center gap-2 mb-4">
          <MousePointer className="w-5 h-5 text-gray-500" />
          <h2 className="font-semibold text-white">Most Clicked Titles</h2>
        </div>
        {data.popularCards.length === 0 ? (
          <p className="text-gray-500 text-sm">No click data yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {data.popularCards.map((card, i) => (
              <div
                key={card.cardId}
                className="flex items-center justify-between py-2 px-3 bg-[#1a1a1a] rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-gray-600 text-sm w-5">{i + 1}.</span>
                  <span className="text-gray-300 text-sm truncate max-w-[200px]">
                    {card.title}
                  </span>
                </div>
                <span className="text-gray-500 text-sm">{card.count} clicks</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

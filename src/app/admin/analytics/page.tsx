'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import Image from 'next/image'
import {
  Ghost,
  ArrowLeft,
  MousePointerClick,
  Users,
  TrendingUp,
  Film,
  ExternalLink,
  Loader2,
  BarChart3,
} from 'lucide-react'

interface AnalyticsData {
  totalClicks: number
  uniqueUsers: number
  uniqueSessions: number
  byService: { service: string; count: number }[]
  topTitles: {
    card_id: string
    title: string
    year: number
    poster_url: string
    count: number
  }[]
  clicksOverTime: { date: string; count: number }[]
}

/**
 * Fetch analytics data
 */
async function fetchAnalytics(): Promise<AnalyticsData> {
  const response = await fetch('/api/admin/analytics')

  if (response.status === 401) {
    throw new Error('Please sign in to view analytics')
  }

  if (response.status === 403) {
    throw new Error('You do not have permission to view analytics')
  }

  if (!response.ok) {
    throw new Error('Failed to fetch analytics')
  }

  return response.json()
}

/**
 * Simple line chart component
 */
function SimpleLineChart({ data }: { data: { date: string; count: number }[] }) {
  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500">
        No data available
      </div>
    )
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1)
  const chartHeight = 180
  const chartWidth = 100 // percentage

  // Create points for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = chartHeight - (d.count / maxCount) * chartHeight
    return `${x},${y}`
  })

  const polylinePoints = points.join(' ')

  // Create area fill path
  const areaPath = `M 0,${chartHeight} L ${points.join(' L ')} L 100,${chartHeight} Z`

  return (
    <div className="relative h-48">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between text-xs text-gray-500">
        <span>{maxCount}</span>
        <span>{Math.round(maxCount / 2)}</span>
        <span>0</span>
      </div>

      {/* Chart area */}
      <div className="ml-10 h-full">
        <svg
          viewBox={`0 0 100 ${chartHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Grid lines */}
          <line
            x1="0"
            y1={chartHeight / 2}
            x2="100"
            y2={chartHeight / 2}
            stroke="#333"
            strokeDasharray="2,2"
          />

          {/* Area fill */}
          <path d={areaPath} fill="url(#gradient)" opacity="0.3" />

          {/* Line */}
          <polyline
            points={polylinePoints}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>{data[0]?.date.slice(5)}</span>
          <span>{data[Math.floor(data.length / 2)]?.date.slice(5)}</span>
          <span>{data[data.length - 1]?.date.slice(5)}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Stat card component
 */
function StatCard({
  title,
  value,
  icon: Icon,
  subtext,
}: {
  title: string
  value: number | string
  icon: React.ElementType
  subtext?: string
}) {
  return (
    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-400">{title}</span>
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-purple-400" />
        </div>
      </div>
      <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      {subtext && <p className="text-sm text-gray-500 mt-1">{subtext}</p>}
    </div>
  )
}

/**
 * Service bar component
 */
function ServiceBar({
  service,
  count,
  maxCount,
}: {
  service: string
  count: number
  maxCount: number
}) {
  const percentage = (count / maxCount) * 100

  // Service colors
  const colors: Record<string, string> = {
    shudder: '#E50914',
    netflix: '#E50914',
    'amazon prime': '#00A8E1',
    'prime video': '#00A8E1',
    hulu: '#1CE783',
    tubi: '#FA5C28',
    max: '#B026FF',
    peacock: '#000000',
    'paramount+': '#0064FF',
    'disney+': '#113CCF',
    'apple tv+': '#000000',
  }

  const color = colors[service.toLowerCase()] || '#6B7280'

  return (
    <div className="flex items-center gap-3">
      <div className="w-24 text-sm text-gray-300 truncate" title={service}>
        {service}
      </div>
      <div className="flex-1 h-6 bg-[#252525] rounded-lg overflow-hidden">
        <div
          className="h-full rounded-lg transition-all duration-500"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-12 text-sm text-gray-400 text-right">{count}</div>
    </div>
  )
}

/**
 * Admin Analytics Page
 */
export default function AdminAnalyticsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: fetchAnalytics,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  })

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 rounded-lg bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Click-out Analytics</h1>
                  <p className="text-sm text-gray-500">Track streaming link engagement</p>
                </div>
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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-6 text-center">
            <p className="text-red-400">{(error as Error).message}</p>
          </div>
        )}

        {/* Analytics Dashboard */}
        {data && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                title="Total Click-outs"
                value={data.totalClicks}
                icon={MousePointerClick}
                subtext="All time"
              />
              <StatCard
                title="Unique Users"
                value={data.uniqueUsers}
                icon={Users}
                subtext="Logged in users"
              />
              <StatCard
                title="Unique Sessions"
                value={data.uniqueSessions}
                icon={TrendingUp}
                subtext="Including anonymous"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clicks Over Time */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Clicks Over Time (Last 30 Days)
                </h2>
                <SimpleLineChart data={data.clicksOverTime} />
              </div>

              {/* Clicks by Service */}
              <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
                <h2 className="text-lg font-semibold text-white mb-6">
                  Click-outs by Service
                </h2>
                {data.byService.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No data yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.byService.slice(0, 10).map((item) => (
                      <ServiceBar
                        key={item.service}
                        service={item.service}
                        count={item.count}
                        maxCount={data.byService[0]?.count || 1}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Top Titles */}
            <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800">
              <h2 className="text-lg font-semibold text-white mb-6">
                Most Clicked Titles
              </h2>
              {data.topTitles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No data yet
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {data.topTitles.map((title, index) => (
                    <div
                      key={title.card_id}
                      className="bg-[#252525] rounded-lg overflow-hidden group"
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3]">
                        {title.poster_url ? (
                          <Image
                            src={title.poster_url}
                            alt={title.title}
                            fill
                            sizes="200px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                            <Film className="w-8 h-8 text-gray-600" />
                          </div>
                        )}

                        {/* Rank badge */}
                        <div className="absolute top-2 left-2 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          #{index + 1}
                        </div>

                        {/* Click count */}
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          {title.count}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-medium text-white text-sm truncate">
                          {title.title}
                        </h3>
                        <p className="text-xs text-gray-500">{title.year}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

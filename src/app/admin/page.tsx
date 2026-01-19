import {
  Film,
  List,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Clock,
  AlertCircle,
} from 'lucide-react'

/**
 * Stat Card Component
 */
function StatCard({
  label,
  value,
  change,
  changeType,
  icon,
}: {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ReactNode
}) {
  return (
    <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-400">
          {icon}
        </div>
        {change && (
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              changeType === 'positive'
                ? 'bg-green-600/20 text-green-400'
                : changeType === 'negative'
                ? 'bg-red-600/20 text-red-400'
                : 'bg-gray-700 text-gray-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )
}

/**
 * Activity Item Component
 */
function ActivityItem({
  action,
  target,
  time,
  type,
}: {
  action: string
  target: string
  time: string
  type: 'create' | 'update' | 'delete' | 'view'
}) {
  const colors = {
    create: 'bg-green-600',
    update: 'bg-blue-600',
    delete: 'bg-red-600',
    view: 'bg-gray-600',
  }

  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-800 last:border-0">
      <div className={`w-2 h-2 rounded-full ${colors[type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300">
          <span className="font-medium text-white">{action}</span> {target}
        </p>
        <p className="text-xs text-gray-600">{time}</p>
      </div>
    </div>
  )
}

/**
 * Quick Action Button
 */
function QuickAction({
  label,
  icon,
  href,
}: {
  label: string
  icon: React.ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      className="
        flex items-center gap-3 p-4 rounded-lg
        bg-[#1a1a1a] hover:bg-[#252525] border border-gray-800 hover:border-gray-700
        transition-colors group
      "
    >
      <div className="w-10 h-10 rounded-lg bg-gray-800 group-hover:bg-purple-600/20 flex items-center justify-center text-gray-400 group-hover:text-purple-400 transition-colors">
        {icon}
      </div>
      <span className="font-medium text-gray-300 group-hover:text-white transition-colors">
        {label}
      </span>
    </a>
  )
}

/**
 * Admin Dashboard Page
 */
export default function AdminDashboard() {
  // Mock stats - in production, fetch from database
  const stats = {
    totalTitles: 156,
    totalLists: 12,
    scheduledItems: 48,
    totalUsers: 2847,
  }

  // Mock recent activity
  const recentActivity = [
    { action: 'Added', target: '"A Nightmare on Elm Street (2010)"', time: '2 minutes ago', type: 'create' as const },
    { action: 'Updated', target: 'Halloween Marathon list', time: '15 minutes ago', type: 'update' as const },
    { action: 'Scheduled', target: '5 EPG items for Shudder', time: '1 hour ago', type: 'create' as const },
    { action: 'Removed', target: '"Expired Movie Title"', time: '3 hours ago', type: 'delete' as const },
    { action: 'Updated', target: 'streaming sources for 12 titles', time: '5 hours ago', type: 'update' as const },
  ]

  // Mock alerts
  const alerts = [
    { message: '3 titles have expired streaming sources', type: 'warning' },
    { message: 'EPG schedule ends in 2 days', type: 'info' },
  ]

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-gray-500">Welcome back! Here&apos;s what&apos;s happening with your content.</p>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg
                ${alert.type === 'warning'
                  ? 'bg-yellow-600/10 border border-yellow-600/30'
                  : 'bg-blue-600/10 border border-blue-600/30'
                }
              `}
            >
              <AlertCircle
                className={`w-5 h-5 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`}
              />
              <p className={`text-sm ${
                alert.type === 'warning' ? 'text-yellow-200' : 'text-blue-200'
              }`}>
                {alert.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Titles"
          value={stats.totalTitles}
          change="+12 this week"
          changeType="positive"
          icon={<Film className="w-5 h-5" />}
        />
        <StatCard
          label="Curated Lists"
          value={stats.totalLists}
          change="+2 this month"
          changeType="positive"
          icon={<List className="w-5 h-5" />}
        />
        <StatCard
          label="EPG Items"
          value={stats.scheduledItems}
          change="Next 7 days"
          changeType="neutral"
          icon={<Calendar className="w-5 h-5" />}
        />
        <StatCard
          label="Total Users"
          value={stats.totalUsers.toLocaleString()}
          change="+148 this week"
          changeType="positive"
          icon={<Users className="w-5 h-5" />}
        />
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Recent Activity</h2>
            <button className="text-sm text-purple-400 hover:text-purple-300">
              View all
            </button>
          </div>
          <div>
            {recentActivity.map((item, index) => (
              <ActivityItem key={index} {...item} />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="space-y-2">
            <QuickAction
              label="Manage Titles"
              icon={<Film className="w-5 h-5" />}
              href="/admin/titles"
            />
            <QuickAction
              label="Create List"
              icon={<List className="w-5 h-5" />}
              href="/admin/lists/new"
            />
            <QuickAction
              label="Import EPG"
              icon={<Calendar className="w-5 h-5" />}
              href="/admin/epg/import"
            />
            <QuickAction
              label="View Analytics"
              icon={<TrendingUp className="w-5 h-5" />}
              href="/admin/analytics"
            />
          </div>
        </div>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Eye className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-white">Page Views Today</h3>
          </div>
          <p className="text-3xl font-bold text-white">12,847</p>
          <p className="text-sm text-green-400 mt-1">+23% vs yesterday</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-white">Most Popular</h3>
          </div>
          <p className="text-lg font-semibold text-white">Nightmare on Elm Street</p>
          <p className="text-sm text-gray-500 mt-1">1,247 views this week</p>
        </div>

        <div className="bg-[#141414] rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <h3 className="font-medium text-white">Avg. Session</h3>
          </div>
          <p className="text-3xl font-bold text-white">4:32</p>
          <p className="text-sm text-gray-500 mt-1">minutes per visit</p>
        </div>
      </div>
    </div>
  )
}

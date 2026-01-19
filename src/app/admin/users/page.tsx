'use client'

import { useState } from 'react'
import {
  Search,
  Filter,
  Download,
  Users,
  UserCheck,
  UserX,
  Crown,
  Mail,
  MoreVertical,
  Eye,
  Ban,
  Shield,
  Calendar,
  TrendingUp,
} from 'lucide-react'

// Mock user data
const MOCK_USERS = [
  {
    id: '1',
    email: 'horror.fan@example.com',
    name: 'Alex Horror',
    tier: 'premium',
    status: 'active',
    watchlist_count: 45,
    watched_count: 128,
    joined: '2023-06-15',
    last_active: '2024-01-15',
  },
  {
    id: '2',
    email: 'scream.queen@example.com',
    name: 'Sarah Screamer',
    tier: 'premium',
    status: 'active',
    watchlist_count: 23,
    watched_count: 89,
    joined: '2023-08-22',
    last_active: '2024-01-14',
  },
  {
    id: '3',
    email: 'slasher.lover@example.com',
    name: 'Mike Myers Fan',
    tier: 'free',
    status: 'active',
    watchlist_count: 12,
    watched_count: 34,
    joined: '2023-11-01',
    last_active: '2024-01-13',
  },
  {
    id: '4',
    email: 'ghost.watcher@example.com',
    name: 'Ghostface',
    tier: 'premium',
    status: 'inactive',
    watchlist_count: 67,
    watched_count: 201,
    joined: '2023-03-10',
    last_active: '2023-12-01',
  },
  {
    id: '5',
    email: 'freddy.fan@example.com',
    name: 'Nancy Thompson',
    tier: 'free',
    status: 'active',
    watchlist_count: 8,
    watched_count: 15,
    joined: '2024-01-01',
    last_active: '2024-01-15',
  },
]

/**
 * User Row Component
 */
function UserRow({ user }: { user: typeof MOCK_USERS[0] }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const tierColors = {
    premium: 'bg-yellow-600/20 text-yellow-400',
    free: 'bg-gray-700 text-gray-400',
  }

  const statusColors = {
    active: 'bg-green-600/20 text-green-400',
    inactive: 'bg-gray-700 text-gray-500',
    banned: 'bg-red-600/20 text-red-400',
  }

  return (
    <tr className="border-b border-gray-800/50 hover:bg-[#1a1a1a] transition-colors">
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
            <span className="text-purple-400 font-semibold">
              {user.name.charAt(0)}
            </span>
          </div>
          <div>
            <p className="font-medium text-white">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${tierColors[user.tier as keyof typeof tierColors]}`}>
          {user.tier === 'premium' && <Crown className="w-3 h-3 inline mr-1" />}
          {user.tier.charAt(0).toUpperCase() + user.tier.slice(1)}
        </span>
      </td>
      <td className="p-4">
        <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[user.status as keyof typeof statusColors]}`}>
          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </span>
      </td>
      <td className="p-4 text-gray-400">{user.watchlist_count}</td>
      <td className="p-4 text-gray-400">{user.watched_count}</td>
      <td className="p-4 text-gray-500 text-sm">{user.joined}</td>
      <td className="p-4 text-gray-500 text-sm">{user.last_active}</td>
      <td className="p-4">
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl z-20 py-1">
                <button className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Profile
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Send Email
                </button>
                <button className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-gray-800 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Make Admin
                </button>
                <hr className="my-1 border-gray-800" />
                <button className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-600/10 flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  )
}

/**
 * Admin Users Management Page
 */
export default function AdminUsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTier, setFilterTier] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filteredUsers = MOCK_USERS.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTier = filterTier === 'all' || user.tier === filterTier
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesTier && matchesStatus
  })

  // Calculate stats
  const totalUsers = MOCK_USERS.length
  const premiumUsers = MOCK_USERS.filter((u) => u.tier === 'premium').length
  const activeUsers = MOCK_USERS.filter((u) => u.status === 'active').length
  const newThisMonth = MOCK_USERS.filter((u) => u.joined.startsWith('2024-01')).length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Users</h1>
          <p className="text-gray-500">View and manage subscriber accounts</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
          <Download className="w-4 h-4" />
          Export Users
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-gray-500">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalUsers.toLocaleString()}</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Premium</span>
          </div>
          <p className="text-2xl font-bold text-white">{premiumUsers}</p>
          <p className="text-xs text-gray-500">{Math.round((premiumUsers / totalUsers) * 100)}% of total</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <UserCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-500">Active</span>
          </div>
          <p className="text-2xl font-bold text-white">{activeUsers}</p>
          <p className="text-xs text-gray-500">in last 30 days</p>
        </div>
        <div className="bg-[#141414] rounded-lg border border-gray-800 p-4">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-gray-500">New This Month</span>
          </div>
          <p className="text-2xl font-bold text-white">{newThisMonth}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="
              w-full pl-10 pr-4 py-2.5 rounded-lg
              bg-[#1a1a1a] border border-gray-800 text-white
              placeholder:text-gray-600
              focus:outline-none focus:border-purple-500
            "
          />
        </div>

        <select
          value={filterTier}
          onChange={(e) => setFilterTier(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
        >
          <option value="all">All Tiers</option>
          <option value="premium">Premium</option>
          <option value="free">Free</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-lg bg-[#1a1a1a] border border-gray-800 text-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-[#141414] rounded-xl border border-gray-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left p-4 text-sm font-medium text-gray-500">User</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Tier</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Watchlist</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Watched</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Joined</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500">Last Active</th>
                <th className="text-left p-4 text-sm font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <UserRow key={user.id} user={user} />
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-12 text-center">
            <UserX className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No users found</h3>
            <p className="text-sm text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-800">
          <p className="text-sm text-gray-500">
            Showing {filteredUsers.length} of {MOCK_USERS.length} users
          </p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">
              Previous
            </button>
            <button className="px-3 py-1.5 rounded bg-purple-600 text-white text-sm">
              1
            </button>
            <button className="px-3 py-1.5 rounded bg-gray-800 text-gray-400 text-sm hover:bg-gray-700">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

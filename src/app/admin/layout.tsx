'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Film,
  List,
  Calendar,
  Users,
  Ghost,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Shield,
  BarChart3,
  Activity,
} from 'lucide-react'

// Admin emails - in production, this would come from a database or env
const ADMIN_EMAILS = [
  'admin@ghostsinthemachine.com',
  'demo@admin.com',
  // Add your admin email here for testing
]

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    label: 'Titles',
    href: '/admin/titles',
    icon: <Film className="w-5 h-5" />,
  },
  {
    label: 'Lists',
    href: '/admin/lists',
    icon: <List className="w-5 h-5" />,
  },
  {
    label: 'EPG',
    href: '/admin/epg',
    icon: <Calendar className="w-5 h-5" />,
  },
  {
    label: 'Sessions',
    href: '/admin/sessions',
    icon: <Activity className="w-5 h-5" />,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: <Users className="w-5 h-5" />,
  },
]

/**
 * Mock admin session check - in production, use Supabase auth
 */
function useAdminAuth() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    // Simulate checking auth session
    const checkAuth = async () => {
      // In production, this would check Supabase session
      // For now, check localStorage for demo purposes
      const storedEmail = localStorage.getItem('admin_demo_email')

      if (storedEmail && ADMIN_EMAILS.includes(storedEmail)) {
        setIsAdmin(true)
        setUserEmail(storedEmail)
      } else {
        // For demo: auto-login as admin
        const demoEmail = 'demo@admin.com'
        localStorage.setItem('admin_demo_email', demoEmail)
        setIsAdmin(true)
        setUserEmail(demoEmail)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [])

  const logout = () => {
    localStorage.removeItem('admin_demo_email')
    setIsAdmin(false)
    setUserEmail(null)
    window.location.href = '/'
  }

  return { isLoading, isAdmin, userEmail, logout }
}

/**
 * Sidebar Navigation Component
 */
function Sidebar({
  isOpen,
  onClose,
  userEmail,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  userEmail: string | null
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 bottom-0 z-50 w-64
          bg-[#0f0f0f] border-r border-gray-800
          transform transition-transform duration-300 ease-out
          lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <Link href="/admin" className="flex items-center gap-2">
            <Ghost className="w-8 h-8 text-purple-500" />
            <div>
              <span className="font-bold text-white text-sm">Ghosts Admin</span>
              <span className="block text-[10px] text-gray-500">Content Management</span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  transition-colors group
                  ${isActive
                    ? 'bg-purple-600/20 text-purple-400'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }
                `}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
          {/* User info */}
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">{userEmail}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Link
              href="/"
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 text-sm transition-colors"
            >
              View Site
            </Link>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

/**
 * Not Authorized Component
 */
function NotAuthorized() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-600/20 flex items-center justify-center">
          <Shield className="w-10 h-10 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-3">Not Authorized</h1>
        <p className="text-gray-400 mb-6">
          You don&apos;t have permission to access the admin area.
          Please sign in with an admin account.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

/**
 * Loading Component
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="text-center">
        <Ghost className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-pulse" />
        <p className="text-gray-400">Loading admin...</p>
      </div>
    </div>
  )
}

/**
 * Admin Layout
 *
 * Provides sidebar navigation and auth protection for admin pages.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isLoading, isAdmin, userEmail, logout } = useAdminAuth()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isAdmin) {
    return <NotAuthorized />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userEmail={userEmail}
        onLogout={logout}
      />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="h-16 bg-[#0f0f0f] border-b border-gray-800 flex items-center px-4 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-400 hover:text-white lg:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Breadcrumb would go here */}
          <div className="flex-1" />

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 hidden sm:block">
              Environment: Development
            </span>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  Menu,
  X,
  Tv,
  Film,
  PlayCircle,
  List,
  Heart,
  User,
  LogOut,
  LogIn,
  ChevronDown,
  Radio,
  Home,
} from 'lucide-react'
import { getCurrentUser, signOut, onAuthStateChange } from '@/lib/auth'
import type { User as SupabaseUser } from '@supabase/supabase-js'

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/tv-guide', label: 'TV Guide', icon: Radio },
  { href: '/browse', label: 'Browse', icon: Film },
  { href: '/binge', label: 'Binge', icon: PlayCircle },
  { href: '/watchlist', label: 'Watchlist', icon: Heart },
]

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user on mount and subscribe to auth changes
  useEffect(() => {
    getCurrentUser().then((user) => {
      setUser(user)
      setIsLoading(false)
    })

    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setUser(session?.user || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setUserMenuOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Don't show header on admin pages
  if (pathname.startsWith('/admin')) {
    return null
  }

  return (
    <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-sm border-b border-gray-800/50">
      <div className="max-w-[1600px] mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/ghost-icon-192.png"
              alt="Ghost Guide"
              width={36}
              height={36}
              className="group-hover:opacity-80 transition-opacity"
            />
            <span className="text-lg font-bold text-white hidden sm:block">
              Ghost Guide
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Search button */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* User menu */}
            {!isLoading && (
              user ? (
                /* Logged in - show user dropdown */
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="hidden sm:block text-sm max-w-[120px] truncate">
                      {user.email}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown menu */}
                  {userMenuOpen && (
                    <>
                      {/* Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setUserMenuOpen(false)}
                      />
                      {/* Menu */}
                      <div className="absolute right-0 top-full mt-2 w-48 bg-[#1a1a1a] border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-800">
                          <p className="text-sm text-gray-400">Signed in as</p>
                          <p className="text-sm text-white truncate">{user.email}</p>
                        </div>
                        <Link
                          href="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          Admin Dashboard
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 w-full px-4 py-3 text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors border-t border-gray-800"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                /* Not logged in - show sign in button */
                <Link
                  href="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden sm:block text-sm">Sign In</span>
                </Link>
              )
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Search bar (expandable) */}
        {searchOpen && (
          <div className="pb-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target as HTMLFormElement
                const input = form.elements.namedItem('search') as HTMLInputElement
                const query = input.value.trim()
                if (query) {
                  router.push(`/browse?q=${encodeURIComponent(query)}`)
                  setSearchOpen(false)
                }
              }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  name="search"
                  placeholder="Search movies, shows, actors..."
                  autoFocus
                  className="
                    w-full pl-10 pr-4 py-3 rounded-lg
                    bg-[#1a1a1a] border border-gray-800 text-white
                    placeholder:text-gray-600
                    focus:outline-none focus:border-purple-500
                  "
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setSearchOpen(false)
                  }}
                />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-800">
          <nav className="px-4 py-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors
                    ${isActive
                      ? 'bg-purple-600/20 text-purple-400'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}

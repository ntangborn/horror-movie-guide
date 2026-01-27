'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ghost, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check URL for error parameters first
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const urlParams = new URLSearchParams(window.location.search)

        const errorParam = hashParams.get('error') || urlParams.get('error')
        const errorDesc = hashParams.get('error_description') || urlParams.get('error_description')

        if (errorParam) {
          setError(errorDesc || errorParam)
          return
        }

        // For implicit flow, tokens are in the hash fragment
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        if (accessToken) {
          // Set the session from hash tokens
          // This will store the session in cookies via @supabase/ssr
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          })

          if (sessionError) {
            console.error('Session error:', sessionError)
            setError(sessionError.message)
            return
          }

          // Clear the hash from URL for cleaner appearance
          window.history.replaceState(null, '', window.location.pathname)

          // Success - redirect to home
          router.push('/')
          router.refresh() // Refresh to ensure server sees new cookies
          return
        }

        // Check for code param (PKCE fallback)
        const code = urlParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError(exchangeError.message)
            return
          }
          router.push('/')
          router.refresh()
          return
        }

        // Check if we have a session already
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/')
          return
        }

        // No auth params
        setError('No authentication data received. Please try logging in again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleAuth()
  }, [router])

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <Ghost className="w-10 h-10 text-purple-500 group-hover:text-purple-400 transition-colors" />
          <span className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
            Ghost Guide
          </span>
        </Link>

        <div className="bg-[#111] border border-gray-800 rounded-xl p-8">
          {error ? (
            <div className="py-4">
              <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Authentication Failed
              </h2>
              <p className="text-gray-400 mb-6 text-sm">
                {error}
              </p>
              <Link
                href="/login"
                className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Try Again
              </Link>
            </div>
          ) : (
            <div className="py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Signing you in...
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

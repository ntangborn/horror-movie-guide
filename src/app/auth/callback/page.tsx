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
        // The Supabase client with detectSessionInUrl: true will automatically
        // handle the URL hash/code and exchange it for a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session error:', sessionError)
          setError(sessionError.message)
          return
        }

        if (session) {
          // Successfully authenticated - redirect to home
          router.push('/')
          return
        }

        // Check URL for error parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const urlParams = new URLSearchParams(window.location.search)

        const errorParam = hashParams.get('error') || urlParams.get('error')
        const errorDesc = hashParams.get('error_description') || urlParams.get('error_description')

        if (errorParam) {
          setError(errorDesc || errorParam)
          return
        }

        // If we have a code but no session, try exchanging it
        const code = urlParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError(exchangeError.message)
            return
          }
          router.push('/')
          return
        }

        // No session and no auth params
        setError('No authentication data received. Please try logging in again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    // Small delay to allow Supabase client to process URL
    setTimeout(handleAuth, 100)
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

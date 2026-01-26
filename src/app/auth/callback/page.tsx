'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Ghost, Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check for error in query params
        const errorParam = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')
        if (errorParam) {
          setError(errorDescription || errorParam)
          return
        }

        // Check for code in query params (PKCE flow)
        const code = searchParams.get('code')
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setError(exchangeError.message)
            return
          }
          // Success - redirect to home
          router.push('/')
          return
        }

        // Check for tokens in hash fragment
        // Supabase sends: #access_token=xxx&refresh_token=xxx&type=magiclink&...
        const hash = window.location.hash.substring(1)
        if (hash) {
          const hashParams = new URLSearchParams(hash)
          const accessToken = hashParams.get('access_token')
          const refreshToken = hashParams.get('refresh_token')
          const type = hashParams.get('type')
          const errorInHash = hashParams.get('error')
          const errorDescInHash = hashParams.get('error_description')

          if (errorInHash) {
            setError(errorDescInHash || errorInHash)
            return
          }

          if (accessToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            })

            if (sessionError) {
              console.error('Session error:', sessionError)
              setError(sessionError.message)
              return
            }

            // Success - redirect to home
            router.push('/')
            return
          }
        }

        // No auth params found - check if already logged in
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/')
          return
        }

        // Nothing worked
        setError('No authentication data received. Please try logging in again.')
      } catch (err) {
        console.error('Auth callback error:', err)
        setError(err instanceof Error ? err.message : 'Authentication failed')
      }
    }

    handleAuth()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="py-4">
        <div className="w-16 h-16 rounded-full bg-red-600/20 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">
          Authentication Failed
        </h2>
        <p className="text-gray-400 mb-6">
          {error}
        </p>
        <Link
          href="/login"
          className="inline-block px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          Try Again
        </Link>
      </div>
    )
  }

  return (
    <div className="py-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
      <p className="text-gray-400">
        Signing you in...
      </p>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="py-8">
      <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
      <p className="text-gray-400">
        Loading...
      </p>
    </div>
  )
}

export default function AuthCallbackPage() {
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
          <Suspense fallback={<LoadingFallback />}>
            <AuthCallbackContent />
          </Suspense>
        </div>
      </div>
    </main>
  )
}

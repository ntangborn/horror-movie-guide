'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ghost, Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { updatePassword } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSessionReady, setIsSessionReady] = useState(false)

  // Handle password recovery from URL hash
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, !!session)
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setIsSessionReady(true)
      }
    })

    // Check for hash fragment and extract tokens
    // Supabase sends: #access_token=xxx&refresh_token=xxx&type=recovery&...
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const type = hashParams.get('type')

    if (accessToken && type === 'recovery') {
      // Manually set the session from the hash tokens
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      }).then(({ data, error }) => {
        if (error) {
          console.error('Error setting session from hash:', error)
          setErrorMessage('Invalid or expired reset link. Please request a new one.')
          setStatus('error')
        } else if (data.session) {
          setIsSessionReady(true)
          // Clean up the URL hash
          window.history.replaceState(null, '', window.location.pathname)
        }
      })
    } else {
      // No hash tokens - check if there's already a session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          setIsSessionReady(true)
        }
      })
    }

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      setErrorMessage('Please enter a new password')
      setStatus('error')
      return
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters')
      setStatus('error')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      await updatePassword(password)
      setStatus('success')
      // Redirect to login after a short delay
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to update password')
      setStatus('error')
    }
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <Ghost className="w-10 h-10 text-purple-500 group-hover:text-purple-400 transition-colors" />
          <span className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">
            Ghost Guide
          </span>
        </Link>

        {/* Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-8">
          {status === 'success' ? (
            /* Success State */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Password Updated
              </h2>
              <p className="text-gray-400">
                Your password has been updated successfully.<br />
                Redirecting to login...
              </p>
            </div>
          ) : !isSessionReady ? (
            /* Loading/Waiting for session */
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-4" />
              <p className="text-gray-400">
                Verifying your reset link...
              </p>
              <p className="text-sm text-gray-600 mt-4">
                If this takes too long, your link may have expired.<br />
                <Link href="/forgot-password" className="text-purple-400 hover:text-purple-300">
                  Request a new reset link
                </Link>
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">
                Set New Password
              </h1>
              <p className="text-gray-500 text-center mb-6">
                Enter your new password below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      disabled={status === 'loading'}
                      className="
                        w-full pl-10 pr-12 py-3 rounded-lg
                        bg-[#1a1a1a] border border-gray-800 text-white
                        placeholder:text-gray-600
                        focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      disabled={status === 'loading'}
                      className="
                        w-full pl-10 pr-12 py-3 rounded-lg
                        bg-[#1a1a1a] border border-gray-800 text-white
                        placeholder:text-gray-600
                        focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors
                      "
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {status === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="
                    w-full py-3 px-4 rounded-lg
                    bg-purple-600 hover:bg-purple-500 text-white font-medium
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center gap-2
                    transition-colors
                  "
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

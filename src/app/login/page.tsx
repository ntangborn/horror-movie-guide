'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Ghost, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { sendMagicLink, getCurrentUser } from '@/lib/auth'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/'
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check if already logged in
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        window.location.href = redirectTo
      }
    })
  }, [redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage('Please enter your email address')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMessage('')

    try {
      await sendMagicLink(email.trim())
      setStatus('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send magic link')
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
            Ghosts in the Machine
          </span>
        </Link>

        {/* Login Card */}
        <div className="bg-[#111] border border-gray-800 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-white text-center mb-2">
            Sign In
          </h1>
          <p className="text-gray-500 text-center mb-8">
            Enter your email to receive a magic link
          </p>

          {status === 'success' ? (
            /* Success State */
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Check your email
              </h2>
              <p className="text-gray-400 mb-6">
                We sent a magic link to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Click the link in the email to sign in.<br />
                The link will expire in 1 hour.
              </p>
              <button
                onClick={() => {
                  setStatus('idle')
                  setEmail('')
                }}
                className="mt-6 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Use a different email
              </button>
            </div>
          ) : (
            /* Form State */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={status === 'loading'}
                    className="
                      w-full pl-10 pr-4 py-3 rounded-lg
                      bg-[#1a1a1a] border border-gray-800 text-white
                      placeholder:text-gray-600
                      focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-colors
                    "
                  />
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
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Magic Link
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}

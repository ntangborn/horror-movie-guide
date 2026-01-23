'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Ghost, Mail, Lock, Loader2, CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { signUpWithPassword, getCurrentUser } from '@/lib/auth'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Check if already logged in
  useEffect(() => {
    getCurrentUser().then((user) => {
      if (user) {
        router.push('/')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      setErrorMessage('Please enter your email address')
      setStatus('error')
      return
    }

    if (!password) {
      setErrorMessage('Please enter a password')
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
      await signUpWithPassword(email.trim(), password)
      setStatus('success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create account'
      if (message.includes('already registered')) {
        setErrorMessage('An account with this email already exists. Try signing in instead.')
      } else {
        setErrorMessage(message)
      }
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
                Check your email
              </h2>
              <p className="text-gray-400 mb-6">
                We sent a confirmation link to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Click the link in the email to activate your account.
              </p>
              <Link
                href="/login"
                className="inline-block mt-6 text-purple-400 hover:text-purple-300 transition-colors"
              >
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">
                Create Account
              </h1>
              <p className="text-gray-500 text-center mb-6">
                Sign up to save your watchlists and more.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Password Input */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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
                      placeholder="Confirm your password"
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              {/* Sign in link */}
              <div className="mt-6 text-center">
                <p className="text-gray-500 text-sm">
                  Already have an account?{' '}
                  <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-600 text-sm mt-8">
          By creating an account, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </main>
  )
}

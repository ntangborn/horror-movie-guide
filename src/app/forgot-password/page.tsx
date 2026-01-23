'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Ghost, Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react'
import { sendPasswordReset } from '@/lib/auth'

type Status = 'idle' | 'loading' | 'success' | 'error'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')

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
      await sendPasswordReset(email.trim())
      setStatus('success')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send reset email')
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
                We sent a password reset link to<br />
                <span className="text-white font-medium">{email}</span>
              </p>
              <p className="text-sm text-gray-600 mb-6">
                Click the link in the email to reset your password.<br />
                The link will expire in 1 hour.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-white text-center mb-2">
                Reset Password
              </h1>
              <p className="text-gray-500 text-center mb-6">
                Enter your email and we'll send you a reset link.
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
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>

              {/* Back to login */}
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

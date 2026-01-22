'use client'

import { useState } from 'react'
import { X, Share2, Loader2 } from 'lucide-react'
import { useSharedLists } from '@/hooks/useSharedLists'

interface ShareWatchlistModalProps {
  isOpen: boolean
  onClose: () => void
  watchlistCount: number
}

export function ShareWatchlistModal({
  isOpen,
  onClose,
  watchlistCount,
}: ShareWatchlistModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { createSharedListAsync, isCreating } = useSharedLists()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Please enter a name for your list')
      return
    }

    try {
      await createSharedListAsync({ name: name.trim(), description: description.trim() })
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setName('')
        setDescription('')
        setSuccess(false)
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share watchlist')
    }
  }

  const handleClose = () => {
    if (!isCreating) {
      onClose()
      setName('')
      setDescription('')
      setError(null)
      setSuccess(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-[#1a1a1a] border border-gray-800 rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Share Watchlist</h2>
              <p className="text-sm text-gray-500">{watchlistCount} movies</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-green-600/20 flex items-center justify-center mx-auto mb-4">
                <Share2 className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">List Shared!</h3>
              <p className="text-gray-400">Your watchlist is now available in the community.</p>
            </div>
          ) : (
            <>
              {/* Name input */}
              <div>
                <label htmlFor="list-name" className="block text-sm font-medium text-gray-300 mb-2">
                  List Name
                </label>
                <input
                  id="list-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., My Favorite Slashers"
                  maxLength={100}
                  disabled={isCreating}
                  className="
                    w-full px-4 py-3 rounded-lg
                    bg-[#252525] border border-gray-800 text-white
                    placeholder:text-gray-600
                    focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                    disabled:opacity-50
                  "
                />
              </div>

              {/* Description input */}
              <div>
                <label htmlFor="list-description" className="block text-sm font-medium text-gray-300 mb-2">
                  Description <span className="text-gray-600">(optional)</span>
                </label>
                <textarea
                  id="list-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell others what makes this list special..."
                  rows={3}
                  maxLength={500}
                  disabled={isCreating}
                  className="
                    w-full px-4 py-3 rounded-lg resize-none
                    bg-[#252525] border border-gray-800 text-white
                    placeholder:text-gray-600
                    focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500
                    disabled:opacity-50
                  "
                />
              </div>

              {/* Info note */}
              <p className="text-sm text-gray-500">
                This will create a snapshot of your current watchlist. Changes you make later won't affect the shared list.
              </p>

              {/* Error message */}
              {error && (
                <div className="p-3 rounded-lg bg-red-900/20 border border-red-900/50">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                disabled={isCreating || !name.trim()}
                className="
                  w-full flex items-center justify-center gap-2
                  bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/50
                  text-white font-medium px-6 py-3 rounded-lg
                  transition-colors disabled:cursor-not-allowed
                "
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  <>
                    <Share2 className="w-5 h-5" />
                    Share with Community
                  </>
                )}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  )
}

export default ShareWatchlistModal

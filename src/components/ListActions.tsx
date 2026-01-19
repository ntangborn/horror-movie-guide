'use client'

import { useState } from 'react'
import { Share2, Plus, Check, Loader2 } from 'lucide-react'

interface ShareButtonProps {
  slug: string
  title: string
}

/**
 * Share button component
 */
export function ShareButton({ slug, title }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/lists/${slug}`

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
      } catch {
        // User cancelled or error
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="
        flex items-center gap-2 px-4 py-2.5 rounded-lg
        bg-[#1a1a1a] hover:bg-[#252525] text-gray-300
        border border-gray-800 hover:border-gray-700
        transition-colors
      "
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share
        </>
      )}
    </button>
  )
}

interface AddToBingeButtonProps {
  listId: string
  listTitle: string
}

/**
 * Add to binge button component
 */
export function AddToBingeButton({ listId, listTitle }: AddToBingeButtonProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isAdded, setIsAdded] = useState(false)

  const handleAdd = async () => {
    setIsAdding(true)

    // Simulate adding to user's binge lists
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log('Added list to binge:', listId, listTitle)

    setIsAdding(false)
    setIsAdded(true)

    // Reset after a delay
    setTimeout(() => setIsAdded(false), 3000)
  }

  return (
    <button
      onClick={handleAdd}
      disabled={isAdding || isAdded}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium
        transition-all duration-300 shadow-lg
        ${
          isAdded
            ? 'bg-green-600 text-white shadow-green-900/30'
            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
        }
        disabled:opacity-80
      `}
    >
      {isAdding ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Adding...
        </>
      ) : isAdded ? (
        <>
          <Check className="w-5 h-5" />
          Added to Binge Lists
        </>
      ) : (
        <>
          <Plus className="w-5 h-5" />
          Add to My Binge Lists
        </>
      )}
    </button>
  )
}

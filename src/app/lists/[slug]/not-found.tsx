import Link from 'next/link'
import { Ghost, Search, ArrowLeft } from 'lucide-react'

export default function ListNotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        {/* Ghost icon */}
        <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-[#1a1a1a] flex items-center justify-center">
          <Ghost className="w-12 h-12 text-gray-600" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-4">List Not Found</h1>

        {/* Description */}
        <p className="text-gray-400 mb-8">
          The collection you're looking for doesn't exist or may have been removed.
          Don't worry, there's plenty more horror to explore!
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/binge"
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-3 rounded-lg
              bg-purple-600 hover:bg-purple-500 text-white font-medium
              transition-colors
            "
          >
            <Search className="w-4 h-4" />
            Browse Collections
          </Link>

          <Link
            href="/"
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-3 rounded-lg
              bg-[#1a1a1a] hover:bg-[#252525] text-gray-300
              border border-gray-800 hover:border-gray-700
              transition-colors
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>

        {/* Suggestion */}
        <p className="text-sm text-gray-600 mt-12">
          Looking for something specific?{' '}
          <Link href="/browse" className="text-purple-400 hover:text-purple-300">
            Try the browse page
          </Link>
        </p>
      </div>
    </main>
  )
}

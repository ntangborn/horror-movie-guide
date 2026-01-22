'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Film, User } from 'lucide-react'
import type { CommunityListPreview } from '@/hooks/useCommunityLists'

interface CommunityListCardProps {
  list: CommunityListPreview
}

/**
 * Get display name from email (everything before @)
 */
function getDisplayName(email: string): string {
  if (!email || email === 'Anonymous') return 'Anonymous'
  const name = email.split('@')[0]
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export function CommunityListCard({ list }: CommunityListCardProps) {
  const displayName = getDisplayName(list.user_email)

  return (
    <Link
      href={`/community/${list.slug}`}
      className="group block bg-[#1a1a1a] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition-all hover:scale-[1.02]"
    >
      {/* Header Image */}
      <div className="relative aspect-[16/9] bg-[#252525]">
        {list.header_image_url ? (
          <Image
            src={list.header_image_url}
            alt={list.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Film className="w-12 h-12 text-gray-600" />
          </div>
        )}
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors line-clamp-1">
          {list.name}
        </h3>

        {/* Description */}
        {list.description && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {list.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
          <span>{list.card_count} {list.card_count === 1 ? 'movie' : 'movies'}</span>
          <span className="text-gray-700">•</span>
          <span className="flex items-center gap-1">
            <User className="w-3.5 h-3.5" />
            {displayName}
          </span>
        </div>
      </div>
    </Link>
  )
}

export default CommunityListCard

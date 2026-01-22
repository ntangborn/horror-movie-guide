'use client'

import { useQuery } from '@tanstack/react-query'
import type { SharedList, AvailabilityCard } from '@/types'

interface CommunityListPreview {
  id: string
  name: string
  slug: string
  description: string | null
  header_image_url: string | null
  card_count: number
  created_at: string
  user_id: string
  user_email: string
}

interface CommunityListDetail extends Omit<SharedList, 'card_ids'> {
  user_email: string
  cards: AvailabilityCard[]
}

interface CommunityListsResponse {
  lists: CommunityListPreview[]
}

interface CommunityListResponse {
  list: CommunityListDetail
}

/**
 * Fetch all public community lists
 */
async function fetchCommunityLists(): Promise<CommunityListPreview[]> {
  const response = await fetch('/api/community/lists')

  if (!response.ok) {
    throw new Error('Failed to fetch community lists')
  }

  const data: CommunityListsResponse = await response.json()
  return data.lists
}

/**
 * Fetch a single community list by slug
 */
async function fetchCommunityList(slug: string): Promise<CommunityListDetail> {
  const response = await fetch(`/api/community/lists/${slug}`)

  if (response.status === 404) {
    throw new Error('List not found')
  }

  if (!response.ok) {
    throw new Error('Failed to fetch community list')
  }

  const data: CommunityListResponse = await response.json()
  return data.list
}

/**
 * useCommunityLists Hook
 *
 * Fetches all public community lists
 */
export function useCommunityLists() {
  const {
    data: lists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['community-lists'],
    queryFn: fetchCommunityLists,
    staleTime: 60 * 1000, // 1 minute
  })

  return {
    lists,
    isLoading,
    error,
    refetch,
  }
}

/**
 * useCommunityList Hook
 *
 * Fetches a single community list by slug with full card data
 */
export function useCommunityList(slug: string | null) {
  const {
    data: list,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['community-list', slug],
    queryFn: () => fetchCommunityList(slug!),
    enabled: !!slug,
    staleTime: 60 * 1000,
  })

  return {
    list,
    isLoading,
    error,
    refetch,
  }
}

export type { CommunityListPreview, CommunityListDetail }

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { AvailabilityCard } from '@/types'

export interface WatchlistItem {
  id: string
  cardId: string
  addedAt: string
  position: number
  card: AvailabilityCard
}

interface WatchlistResponse {
  watchlist: WatchlistItem[]
}

/**
 * Fetch watchlist from API
 */
async function fetchWatchlist(): Promise<WatchlistItem[]> {
  const response = await fetch('/api/user/watchlist')

  if (response.status === 401) {
    // Not logged in - return empty
    return []
  }

  if (!response.ok) {
    throw new Error('Failed to fetch watchlist')
  }

  const data: WatchlistResponse = await response.json()
  return data.watchlist
}

/**
 * Add card to watchlist
 */
async function addToWatchlistApi(cardId: string): Promise<void> {
  const response = await fetch('/api/user/watchlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId }),
  })

  if (response.status === 401) {
    throw new Error('Please sign in to add to watchlist')
  }

  if (response.status === 409) {
    // Already in watchlist - treat as success
    return
  }

  if (!response.ok) {
    throw new Error('Failed to add to watchlist')
  }
}

/**
 * Remove card from watchlist
 */
async function removeFromWatchlistApi(cardId: string): Promise<void> {
  const response = await fetch(`/api/user/watchlist?cardId=${cardId}`, {
    method: 'DELETE',
  })

  if (response.status === 401) {
    throw new Error('Please sign in to manage watchlist')
  }

  if (!response.ok) {
    throw new Error('Failed to remove from watchlist')
  }
}

/**
 * Reorder watchlist items
 */
async function reorderWatchlistApi(items: { cardId: string; position: number }[]): Promise<void> {
  const response = await fetch('/api/user/watchlist', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })

  if (response.status === 401) {
    throw new Error('Please sign in to manage watchlist')
  }

  if (!response.ok) {
    throw new Error('Failed to reorder watchlist')
  }
}

/**
 * useWatchlist Hook
 *
 * Provides watchlist state and mutations using React Query
 */
export function useWatchlist() {
  const queryClient = useQueryClient()

  // Fetch watchlist
  const {
    data: watchlist = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['watchlist'],
    queryFn: fetchWatchlist,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  })

  // Add to watchlist mutation
  const addMutation = useMutation({
    mutationFn: addToWatchlistApi,
    onMutate: async (cardId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['watchlist'] })

      // Snapshot previous value
      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(['watchlist'])

      // Optimistically add (we don't have full card data, so just add cardId)
      // The refetch will get full data
      queryClient.setQueryData<WatchlistItem[]>(['watchlist'], (old = []) => {
        // Check if already exists
        if (old.some(item => item.cardId === cardId)) {
          return old
        }
        return [
          ...old,
          {
            id: `temp-${cardId}`,
            cardId,
            addedAt: new Date().toISOString(),
            position: old.length,
            card: {} as AvailabilityCard, // Placeholder
          },
        ]
      })

      return { previousWatchlist }
    },
    onError: (err, cardId, context) => {
      // Rollback on error
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist)
      }
    },
    onSettled: () => {
      // Refetch to get real data
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Remove from watchlist mutation
  const removeMutation = useMutation({
    mutationFn: removeFromWatchlistApi,
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist'] })

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(['watchlist'])

      // Optimistically remove
      queryClient.setQueryData<WatchlistItem[]>(['watchlist'], (old = []) =>
        old.filter(item => item.cardId !== cardId)
      )

      return { previousWatchlist }
    },
    onError: (err, cardId, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Reorder mutation
  const reorderMutation = useMutation({
    mutationFn: reorderWatchlistApi,
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['watchlist'] })

      const previousWatchlist = queryClient.getQueryData<WatchlistItem[]>(['watchlist'])

      // Optimistically reorder
      queryClient.setQueryData<WatchlistItem[]>(['watchlist'], (old = []) => {
        const positionMap = new Map(items.map(i => [i.cardId, i.position]))
        return [...old]
          .map(item => ({
            ...item,
            position: positionMap.get(item.cardId) ?? item.position,
          }))
          .sort((a, b) => a.position - b.position)
      })

      return { previousWatchlist }
    },
    onError: (err, items, context) => {
      if (context?.previousWatchlist) {
        queryClient.setQueryData(['watchlist'], context.previousWatchlist)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist'] })
    },
  })

  // Check if a card is in watchlist
  const isInWatchlist = (cardId: string): boolean => {
    return watchlist.some(item => item.cardId === cardId)
  }

  // Get watchlist as AvailabilityCard array (for display)
  const watchlistCards: AvailabilityCard[] = watchlist
    .filter(item => item.card?.id) // Filter out placeholder items
    .map(item => item.card)

  return {
    // Data
    watchlist,
    watchlistCards,
    isLoading,
    error,

    // Actions
    addToWatchlist: addMutation.mutate,
    removeFromWatchlist: removeMutation.mutate,
    reorderWatchlist: reorderMutation.mutate,
    refetch,

    // Status
    isInWatchlist,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    isReordering: reorderMutation.isPending,

    // Mutation objects for more control
    addMutation,
    removeMutation,
    reorderMutation,
  }
}

export default useWatchlist

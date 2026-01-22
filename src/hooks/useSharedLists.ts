'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { SharedList } from '@/types'

interface SharedListsResponse {
  lists: SharedList[]
}

interface CreateListParams {
  name: string
  description?: string
}

/**
 * Fetch user's shared lists from API
 */
async function fetchSharedLists(): Promise<SharedList[]> {
  const response = await fetch('/api/user/shared-lists')

  if (response.status === 401) {
    return [] // Not logged in
  }

  if (!response.ok) {
    throw new Error('Failed to fetch shared lists')
  }

  const data: SharedListsResponse = await response.json()
  return data.lists
}

/**
 * Create a new shared list
 */
async function createSharedList(params: CreateListParams): Promise<SharedList> {
  const response = await fetch('/api/user/shared-lists', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (response.status === 401) {
    throw new Error('Please sign in to share your watchlist')
  }

  if (response.status === 400) {
    const data = await response.json()
    throw new Error(data.error || 'Invalid request')
  }

  if (!response.ok) {
    throw new Error('Failed to create shared list')
  }

  const data = await response.json()
  return data.list
}

/**
 * Delete a shared list
 */
async function deleteSharedList(listId: string): Promise<void> {
  const response = await fetch(`/api/user/shared-lists?id=${listId}`, {
    method: 'DELETE',
  })

  if (response.status === 401) {
    throw new Error('Please sign in to manage your shared lists')
  }

  if (!response.ok) {
    throw new Error('Failed to delete shared list')
  }
}

/**
 * useSharedLists Hook
 *
 * Manages user's shared lists with React Query
 */
export function useSharedLists() {
  const queryClient = useQueryClient()

  // Fetch shared lists
  const {
    data: sharedLists = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['shared-lists'],
    queryFn: fetchSharedLists,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })

  // Create shared list mutation
  const createMutation = useMutation({
    mutationFn: createSharedList,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-lists'] })
      queryClient.invalidateQueries({ queryKey: ['community-lists'] })
    },
  })

  // Delete shared list mutation
  const deleteMutation = useMutation({
    mutationFn: deleteSharedList,
    onMutate: async (listId) => {
      await queryClient.cancelQueries({ queryKey: ['shared-lists'] })

      const previousLists = queryClient.getQueryData<SharedList[]>(['shared-lists'])

      // Optimistically remove
      queryClient.setQueryData<SharedList[]>(['shared-lists'], (old = []) =>
        old.filter(list => list.id !== listId)
      )

      return { previousLists }
    },
    onError: (err, listId, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(['shared-lists'], context.previousLists)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-lists'] })
      queryClient.invalidateQueries({ queryKey: ['community-lists'] })
    },
  })

  return {
    // Data
    sharedLists,
    isLoading,
    error,

    // Actions
    createSharedList: createMutation.mutate,
    createSharedListAsync: createMutation.mutateAsync,
    deleteSharedList: deleteMutation.mutate,
    refetch,

    // Status
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
    createError: createMutation.error,
    deleteError: deleteMutation.error,

    // Mutation objects
    createMutation,
    deleteMutation,
  }
}

export default useSharedLists

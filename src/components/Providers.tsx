'use client'

import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query'
import { useState, useEffect, type ReactNode } from 'react'
import { TitleModalProvider } from '@/contexts/TitleModalContext'
import { ToastProvider, useToast, setToastHandler } from '@/components/ui/Toast'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

interface ProvidersProps {
  children: ReactNode
}

/**
 * Component to connect toast handler for global access
 */
function ToastConnector() {
  const toast = useToast()
  useEffect(() => {
    setToastHandler(toast)
  }, [toast])
  return null
}

/**
 * Query key factory for consistent cache keys
 */
export const queryKeys = {
  browse: (filters: Record<string, unknown>) => ['browse', filters] as const,
  watchlist: ['watchlist'] as const,
  card: (id: string) => ['card', id] as const,
  lists: ['lists'] as const,
  list: (id: string) => ['list', id] as const,
}

/**
 * Create a query client with error handling and retry logic
 */
function createQueryClient(onError: (error: Error, context?: string) => void) {
  return new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        // Only show toast for errors that aren't from initial page load
        if (query.state.data !== undefined) {
          onError(error as Error, 'fetch')
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error) => {
        onError(error as Error, 'mutation')
      },
    }),
    defaultOptions: {
      queries: {
        // Stale time - data is fresh for 5 minutes
        staleTime: 5 * 60 * 1000,

        // Cache time - keep unused data for 30 minutes
        gcTime: 30 * 60 * 1000,

        // Retry configuration
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (error instanceof Error && error.message.includes('4')) {
            return false
          }
          return failureCount < 3
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Performance optimizations
        refetchOnWindowFocus: false,
        refetchOnReconnect: 'always',
        refetchOnMount: true,

        // Keep previous data for seamless transitions
        placeholderData: (prev: unknown) => prev,

        // Network mode - fetch only when online
        networkMode: 'offlineFirst',
      },
      mutations: {
        retry: 1,
        retryDelay: 1000,
        networkMode: 'offlineFirst',
      },
    },
  })
}

/**
 * Inner providers that have access to toast context
 */
function InnerProviders({ children }: { children: ReactNode }) {
  const toast = useToast()

  const [queryClient] = useState(() =>
    createQueryClient((error, context) => {
      console.error(`React Query ${context} error:`, error)

      // Show user-friendly error messages
      const message = getErrorMessage(error)
      toast.error('Something went wrong', message)
    })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <TitleModalProvider>
        <ToastConnector />
        {children}
      </TitleModalProvider>
    </QueryClientProvider>
  )
}

/**
 * Get user-friendly error message from error object
 */
function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase()

  if (message.includes('network') || message.includes('fetch')) {
    return 'Please check your internet connection and try again.'
  }

  if (message.includes('timeout')) {
    return 'The request took too long. Please try again.'
  }

  if (message.includes('401') || message.includes('unauthorized')) {
    return 'You need to sign in to perform this action.'
  }

  if (message.includes('403') || message.includes('forbidden')) {
    return "You don't have permission to perform this action."
  }

  if (message.includes('404')) {
    return 'The requested resource was not found.'
  }

  if (message.includes('500') || message.includes('server')) {
    return 'Our servers are having trouble. Please try again later.'
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Main Providers component wrapping the entire app
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <InnerProviders>{children}</InnerProviders>
      </ToastProvider>
    </ErrorBoundary>
  )
}

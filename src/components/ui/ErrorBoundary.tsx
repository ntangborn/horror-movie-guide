'use client'

import { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: React.ErrorInfo | null
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in child tree
 * and displays a friendly fallback UI instead of crashing
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({ errorInfo })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <ErrorFallback
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Default error fallback UI - friendly and recoverable
 */
interface ErrorFallbackProps {
  error: Error | null
  onRetry?: () => void
  onGoHome?: () => void
  title?: string
  message?: string
}

export function ErrorFallback({
  error,
  onRetry,
  onGoHome,
  title = "Something went wrong",
  message = "Don't worry, it's not you - it's us. The page ran into an unexpected error.",
}: ErrorFallbackProps) {
  const isDev = process.env.NODE_ENV === 'development'

  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-10 h-10 text-red-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-white mb-3">{title}</h2>

        {/* Message */}
        <p className="text-gray-400 mb-6">{message}</p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gray-700 text-gray-200 font-medium hover:bg-gray-600 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
          )}
        </div>

        {/* Dev error details */}
        {isDev && error && (
          <details className="mt-8 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-400 flex items-center gap-2 justify-center">
              <Bug className="w-4 h-4" />
              Show error details (dev only)
            </summary>
            <div className="mt-4 p-4 rounded-lg bg-[#1a1a1a] border border-gray-800 overflow-auto max-h-[200px]">
              <p className="text-red-400 font-mono text-sm mb-2">{error.name}: {error.message}</p>
              {error.stack && (
                <pre className="text-xs text-gray-500 whitespace-pre-wrap break-all">
                  {error.stack}
                </pre>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  )
}

/**
 * Inline error component for smaller areas (e.g., within a card or section)
 */
export function InlineError({
  message = "Failed to load",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
      <p className="text-gray-400 text-sm mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      )}
    </div>
  )
}

/**
 * Network error component
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorFallback
      error={null}
      onRetry={onRetry}
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
    />
  )
}

/**
 * Not found error component
 */
export function NotFoundError({ onGoHome }: { onGoHome?: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-8xl font-bold text-gray-800 mb-4">404</div>
        <h2 className="text-2xl font-bold text-white mb-3">Page Not Found</h2>
        <p className="text-gray-400 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        {onGoHome && (
          <button
            onClick={onGoHome}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-500 transition-colors mx-auto"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        )}
      </div>
    </div>
  )
}

export default ErrorBoundary

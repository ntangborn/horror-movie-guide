'use client'

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================
// Types
// ============================================

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

// ============================================
// Context
// ============================================

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ============================================
// Provider
// ============================================

const DEFAULT_DURATION = 5000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { ...toast, id }

    setToasts((prev) => [...prev, newToast])

    // Auto-remove after duration
    const duration = toast.duration ?? DEFAULT_DURATION
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration)
    }
  }, [removeToast])

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message })
  }, [addToast])

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 8000 }) // Errors show longer
  }, [addToast])

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message })
  }, [addToast])

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message })
  }, [addToast])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ============================================
// Toast Components
// ============================================

const TOAST_ICONS: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-green-900/90',
    border: 'border-green-700/50',
    icon: 'text-green-400',
  },
  error: {
    bg: 'bg-red-900/90',
    border: 'border-red-700/50',
    icon: 'text-red-400',
  },
  warning: {
    bg: 'bg-yellow-900/90',
    border: 'border-yellow-700/50',
    icon: 'text-yellow-400',
  },
  info: {
    bg: 'bg-blue-900/90',
    border: 'border-blue-700/50',
    icon: 'text-blue-400',
  },
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const [isLeaving, setIsLeaving] = useState(false)
  const Icon = TOAST_ICONS[toast.type]
  const styles = TOAST_STYLES[toast.type]

  const handleRemove = () => {
    setIsLeaving(true)
    setTimeout(onRemove, 200) // Allow animation to complete
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm',
        'transform transition-all duration-200 ease-out',
        isLeaving ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0',
        styles.bg,
        styles.border
      )}
      role="alert"
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', styles.icon)} />

      <div className="flex-1 min-w-0">
        <p className="font-medium text-white">{toast.title}</p>
        {toast.message && (
          <p className="text-sm text-gray-300 mt-0.5">{toast.message}</p>
        )}
      </div>

      <button
        onClick={handleRemove}
        className="flex-shrink-0 p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onRemove }: { toasts: Toast[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => onRemove(toast.id)} />
        </div>
      ))}
    </div>
  )
}

// ============================================
// Simple toast function for non-context usage
// ============================================

let toastFn: ToastContextValue | null = null

export function setToastHandler(handler: ToastContextValue) {
  toastFn = handler
}

export const toast = {
  success: (title: string, message?: string) => toastFn?.success(title, message),
  error: (title: string, message?: string) => toastFn?.error(title, message),
  warning: (title: string, message?: string) => toastFn?.warning(title, message),
  info: (title: string, message?: string) => toastFn?.info(title, message),
}

export default ToastProvider

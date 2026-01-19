'use client'

import { useEffect, useRef, useCallback } from 'react'
import { usePathname } from 'next/navigation'

const SESSION_KEY = 'gitm_session_id'
const HEARTBEAT_INTERVAL = 30000 // 30 seconds

/**
 * Generate a simple session ID
 */
function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Get or create session ID from localStorage
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return ''

  let sessionId = localStorage.getItem(SESSION_KEY)
  if (!sessionId) {
    sessionId = generateSessionId()
    localStorage.setItem(SESSION_KEY, sessionId)
  }
  return sessionId
}

/**
 * Send tracking event(s) to API
 */
async function sendEvent(
  events: {
    session_id: string
    event_type: string
    page_path?: string
    event_data?: Record<string, unknown>
  }[]
): Promise<void> {
  try {
    await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
      // Fire and forget - don't block on response
      keepalive: true,
    })
  } catch {
    // Silently fail - tracking shouldn't break the app
  }
}

/**
 * Track a single event
 */
export function trackEvent(
  eventType: string,
  pagePath?: string,
  eventData?: Record<string, unknown>
): void {
  const sessionId = getSessionId()
  if (!sessionId) return

  sendEvent([
    {
      session_id: sessionId,
      event_type: eventType,
      page_path: pagePath,
      event_data: eventData,
    },
  ])
}

/**
 * Hook for automatic page view tracking and heartbeat
 */
export function usePageTracking(): void {
  const pathname = usePathname()
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Track page view on route change
  useEffect(() => {
    const sessionId = getSessionId()
    if (!sessionId) return

    // Track page view
    sendEvent([
      {
        session_id: sessionId,
        event_type: 'page_view',
        page_path: pathname,
      },
    ])

    // Reset last activity
    lastActivityRef.current = Date.now()
  }, [pathname])

  // Heartbeat for time-on-page tracking
  useEffect(() => {
    const sessionId = getSessionId()
    if (!sessionId) return

    // Update last activity on user interaction
    const updateActivity = () => {
      lastActivityRef.current = Date.now()
    }

    // Add activity listeners
    window.addEventListener('click', updateActivity)
    window.addEventListener('scroll', updateActivity)
    window.addEventListener('keydown', updateActivity)

    // Start heartbeat
    heartbeatRef.current = setInterval(() => {
      // Only send heartbeat if user was active in last 60 seconds
      const timeSinceActivity = Date.now() - lastActivityRef.current
      if (timeSinceActivity < 60000) {
        sendEvent([
          {
            session_id: sessionId,
            event_type: 'heartbeat',
            page_path: pathname,
          },
        ])
      }
    }, HEARTBEAT_INTERVAL)

    return () => {
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('scroll', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [pathname])
}

/**
 * Hook that returns tracking functions
 */
export function useTracking() {
  const pathname = usePathname()

  const trackFilterChange = useCallback(
    (filterType: string, filterValue: string | string[]) => {
      trackEvent('filter_change', pathname, { filterType, filterValue })
    },
    [pathname]
  )

  const trackCardClick = useCallback(
    (cardId: string, cardTitle: string) => {
      trackEvent('card_click', pathname, { cardId, cardTitle })
    },
    [pathname]
  )

  const trackListView = useCallback(
    (listSlug: string, listTitle: string) => {
      trackEvent('list_view', pathname, { listSlug, listTitle })
    },
    [pathname]
  )

  return {
    trackFilterChange,
    trackCardClick,
    trackListView,
    trackEvent: (eventType: string, eventData?: Record<string, unknown>) =>
      trackEvent(eventType, pathname, eventData),
  }
}

'use client'

import { usePageTracking } from '@/hooks/useTracking'

/**
 * Tracking Provider - Add to layout to enable automatic page tracking
 */
export function TrackingProvider({ children }: { children: React.ReactNode }) {
  usePageTracking()
  return <>{children}</>
}

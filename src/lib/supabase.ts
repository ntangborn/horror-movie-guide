import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser/client components
 *
 * For server components, import from './supabase-server' instead.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// Browser client singleton for client components
export const supabase = createClient()

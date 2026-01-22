import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser/client components
 *
 * For server components, import from './supabase-server' instead.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Keep session for 30 days
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}

// Browser client singleton for client components
export const supabase = createClient()

import { createBrowserClient } from '@supabase/ssr'

/**
 * Create a Supabase client for browser/client components
 *
 * Using @supabase/ssr with cookie storage so session is available to:
 * - Client-side code (for UI state)
 * - API routes (for auth verification)
 *
 * Using implicit flow to avoid PKCE code verifier issues with magic links.
 */
export const createClient = () => {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
        detectSessionInUrl: true,
      },
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

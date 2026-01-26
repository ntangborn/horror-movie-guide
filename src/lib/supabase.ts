import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for browser/client components
 *
 * Using @supabase/supabase-js instead of @supabase/ssr for the browser client
 * because the SSR package doesn't properly handle PKCE code verifier storage
 * for magic link auth flows.
 */
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for PKCE code verifier (required for magic links)
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'ghost-guide-auth',
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )
}

// Browser client singleton for client components
export const supabase = createClient()

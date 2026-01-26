import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a Supabase client for browser/client components
 *
 * Using implicit flow instead of PKCE to avoid code verifier storage issues.
 * PKCE requires storing a verifier when requesting the magic link and retrieving
 * it when the callback happens - if the user closes the tab or uses a different
 * browser context, the verifier is lost and auth fails.
 *
 * Implicit flow sends tokens directly in the URL hash, no storage needed.
 */
export const createClient = () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'implicit',
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

/**
 * Server-side Authentication Helper
 *
 * Supabase Auth utilities for server-side operations.
 * This file uses `cookies` from `next/headers` and can only be used in Server Components.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Admin email list - users who can access /admin routes
export const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
]

/**
 * Create a Supabase client for server-side auth operations
 */
export async function createAuthClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors in Server Components
          }
        },
      },
    }
  )
}

/**
 * Get the current session (server-side)
 */
export async function getSession() {
  const supabase = await createAuthClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error.message)
    return null
  }

  return session
}

/**
 * Get the current user (server-side)
 */
export async function getUser() {
  const session = await getSession()
  return session?.user || null
}

/**
 * Check if user is authenticated (server-side)
 */
export async function isAuthenticated() {
  const session = await getSession()
  return !!session
}

/**
 * Check if user is an admin (server-side)
 */
export async function isAdmin() {
  const user = await getUser()
  if (!user?.email) return false
  return ADMIN_EMAILS.includes(user.email)
}

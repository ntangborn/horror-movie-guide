/**
 * Client-side Authentication Helper
 *
 * Supabase Auth utilities for client-side operations.
 * This file uses the browser Supabase client and can be used in Client Components.
 */

import { supabase } from './supabase'

// Admin email list - users who can access /admin routes
export const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
]

/**
 * Send magic link email (client-side)
 */
export async function sendMagicLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

/**
 * Sign in with email and password (client-side)
 */
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true, user: data.user }
}

/**
 * Sign up with email and password (client-side)
 */
export async function signUpWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true, user: data.user }
}

/**
 * Sign out (client-side)
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

/**
 * Get current user from client-side
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error.message)
    return null
  }

  return user
}

/**
 * Subscribe to auth state changes (client-side)
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Send password reset email (client-side)
 */
export async function sendPasswordReset(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/callback`,
  })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

/**
 * Update password for current user (client-side)
 */
export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })

  if (error) {
    throw new Error(error.message)
  }

  return { success: true }
}

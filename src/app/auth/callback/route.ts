import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const next = requestUrl.searchParams.get('next') || '/'
  const origin = requestUrl.origin

  const cookieStore = await cookies()

  const supabase = createServerClient(
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
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Handle PKCE flow (code exchange)
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Auth callback error (code exchange):', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // If we have a user, ensure they exist in our users table
    if (data.user) {
      await upsertUser(supabase, data.user)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // Handle magic link with token_hash (older format)
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type: type as 'email' | 'magiclink',
      token_hash,
    })

    if (error) {
      console.error('Auth callback error (verifyOtp):', error.message)
      return NextResponse.redirect(`${origin}/login?error=auth_failed`)
    }

    // If we have a user, ensure they exist in our users table
    if (data.user) {
      await upsertUser(supabase, data.user)
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  // No valid auth parameters - redirect to login
  console.error('Auth callback: No code or token_hash provided')
  return NextResponse.redirect(`${origin}/login?error=no_code`)
}

/**
 * Upsert user in our users table
 */
async function upsertUser(supabase: any, user: any) {
  const { error: upsertError } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        email: user.email,
        last_active: new Date().toISOString(),
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false,
      }
    )

  if (upsertError) {
    console.error('Error upserting user:', upsertError.message)
    // Don't fail auth if user table insert fails
  }
}

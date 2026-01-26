import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Admin email list - must match the one in auth.ts
const ADMIN_EMAILS = [
  'ntangborn@gmail.com',
  'admin@example.com',
  'estrogenerator@icloud.com',
  'pepper.rosemary@gmail.com',
]

// Cookie options for persistent sessions (30 days)
const COOKIE_OPTIONS = {
  maxAge: 60 * 60 * 24 * 30,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              ...COOKIE_OPTIONS,
            })
          )
        },
      },
    }
  )

  // IMPORTANT: DO NOT REMOVE THIS LINE
  // Calling getUser() refreshes the session if expired and sets cookies
  // This must run on every request to maintain auth state
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check if the path starts with /admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Not logged in - redirect to login
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Check if user is admin
    const userEmail = user.email
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      // Not an admin - redirect to homepage with error
      const homeUrl = new URL('/', request.url)
      homeUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(homeUrl)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

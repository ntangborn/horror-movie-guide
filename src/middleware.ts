import { NextResponse, type NextRequest } from 'next/server'

/**
 * Middleware
 *
 * Note: Auth is handled client-side because we use localStorage for session
 * storage (required for magic link auth). Middleware can only access cookies,
 * so we can't check auth state here.
 *
 * Admin auth is checked in the admin layout component.
 */
export async function middleware(request: NextRequest) {
  return NextResponse.next()
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

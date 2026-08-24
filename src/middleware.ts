import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const role = req.auth?.user?.role

  // Public paths that don't require auth
  const publicPaths = ['/login', '/register', '/api/auth']
  const isPublicPath = publicPaths.some((path) => nextUrl.pathname.startsWith(path))

  if (isPublicPath) {
    // If logged in and trying to access public auth pages, redirect to dashboard
    if (isLoggedIn && (nextUrl.pathname === '/login' || nextUrl.pathname === '/register')) {
      if (role === 'ADMIN') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // Not logged in — redirect to login
  if (!isLoggedIn) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin-only routes
  if (nextUrl.pathname.startsWith('/admin') || nextUrl.pathname.startsWith('/api/admin')) {
    if (role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // Resident routes — block admins from resident dashboard
  if (nextUrl.pathname === '/dashboard') {
    if (role === 'ADMIN') {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}

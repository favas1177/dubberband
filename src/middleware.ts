import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { pathname } = request.nextUrl
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'https'
  const origin = `${forwardedProto}://${forwardedHost}`
  
  console.log(`[Middleware] Path: ${pathname} | nextUrl: ${request.nextUrl.href} | host: ${forwardedHost} | proto: ${forwardedProto}`)
  console.log(`[Middleware] Cookies present: ${request.cookies.getAll().map(c => c.name).join(', ') || 'NONE'}`)

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.log(`[Middleware] getUser error:`, authError.message)
  }
  console.log(`[Middleware] User:`, user?.email || 'unauthenticated')

  // Protect specific routes
  const isProtectedRoute = 
    pathname === '/' || 
    pathname.startsWith('/projects') || 
    pathname.startsWith('/settings') || 
    pathname.startsWith('/translate')
    
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/login', origin)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c)
    })
    return redirectResponse
  }

  // Redirect authenticated users away from auth pages
  if (pathname === '/login' && user) {
    const redirectUrl = new URL('/', origin)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c)
    })
    return redirectResponse
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

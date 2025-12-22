import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isE2E } from './lib/e2e'

function base64Encode(bytes: Uint8Array): string {
  // Edge runtime: btoa; Node fallback: Buffer.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let binary = ''
  for (const byte of bytes) binary += String.fromCodePoint(byte)
  return btoa(binary)
}

function createCspNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return base64Encode(bytes)
}

function safeOrigin(value: string | undefined | null): string | null {
  if (!value) return null
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

function websocketOriginFor(origin: string | null): string | null {
  if (!origin) return null
  try {
    const url = new URL(origin)
    let nextProtocol: 'wss:' | 'ws:' | null = null
    if (url.protocol === 'https:') {
      nextProtocol = 'wss:'
    } else if (url.protocol === 'http:') {
      nextProtocol = 'ws:'
    }
    return nextProtocol ? `${nextProtocol}//${url.host}` : null
  } catch {
    return null
  }
}

function buildContentSecurityPolicy({
  nonce,
  requestOrigin,
  supabaseUrl,
}: {
  nonce: string
  requestOrigin: string
  supabaseUrl: string
}): string {
  const vercelEnv = process.env.VERCEL_ENV
  const isVercelPreview = vercelEnv === 'preview'
  const isStrictProduction =
    process.env.NODE_ENV === 'production' && !isVercelPreview && !isE2E
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    ...(isStrictProduction
      ? ["'wasm-unsafe-eval'"]
      : ["'unsafe-eval'", "'wasm-unsafe-eval'"]),
    ...(isE2E ? ["'unsafe-inline'"] : []),
    // Vercel preview feedback widget
    ...(isVercelPreview ? ['https://vercel.live'] : []),
    // PostHog analytics
    'https://us-assets.i.posthog.com',
  ].join(' ')

  // CSS is trickier than scripts: React + animation/diagram libs rely on
  // `style=""` attributes. We keep scripts strict (nonce-based) and allow only
  // style *attributes* to be inline. For `<style>` tags we require a nonce in
  // production (CodeMirror supports this via `EditorView.cspNonce`), while
  // allowing inline stylesheets in development to keep HMR/dev tooling working.
  const styleSrc = ["'self'"].join(' ')
  const styleSrcElem = isStrictProduction
    ? ["'self'", `'nonce-${nonce}'`].join(' ')
    : ["'self'", "'unsafe-inline'"].join(' ')
  const styleSrcAttr = ["'unsafe-inline'"].join(' ')

  const posthogOrigin = safeOrigin(process.env.NEXT_PUBLIC_POSTHOG_HOST)
  const sentryOrigin = safeOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN)
  const supabaseOrigin = safeOrigin(supabaseUrl)

  const connectOrigins = new Set<string>()
  for (const origin of [supabaseOrigin, posthogOrigin, sentryOrigin]) {
    if (origin) connectOrigins.add(origin)
  }
  // Vercel Analytics and Speed Insights
  connectOrigins.add('https://vitals.vercel-insights.com')
  connectOrigins.add('https://va.vercel-scripts.com')
  // PostHog assets CDN
  connectOrigins.add('https://us-assets.i.posthog.com')
  // Draco decoder (gstatic)
  connectOrigins.add('https://www.gstatic.com')
  if (isVercelPreview) {
    connectOrigins.add('https://vercel.live')
  }

  const connectWsOrigins = new Set<string>()
  for (const origin of [requestOrigin, supabaseOrigin, posthogOrigin]) {
    const wsOrigin = websocketOriginFor(origin)
    if (wsOrigin) connectWsOrigins.add(wsOrigin)
  }
  if (isVercelPreview) {
    connectWsOrigins.add('wss://vercel.live')
  }

  const connectSrc = [
    "'self'",
    ...Array.from(connectOrigins),
    ...Array.from(connectWsOrigins),
  ].join(' ')

  const frameSrc = [
    "'self'",
    // Video embeds supported by the learning platform.
    'https://www.youtube.com',
    'https://www.youtube-nocookie.com',
    'https://player.vimeo.com',
  ].join(' ')

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "img-src 'self' https: data: blob:",
    "font-src 'self' https: data:",
    `style-src ${styleSrc}`,
    `style-src-elem ${styleSrcElem}`,
    `style-src-attr ${styleSrcAttr}`,
    `script-src ${scriptSrc}`,
    // Explicitly disallow inline event handlers.
    "script-src-attr 'none'",
    `connect-src ${connectSrc}`,
    `frame-src ${frameSrc}`,
    "media-src 'self' https: blob:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    ...(isStrictProduction ? ['upgrade-insecure-requests'] : []),
  ].join('; ')
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error('Missing SUPABASE_URL')
  }
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  }

  const nonce = createCspNonce()
  const csp = buildContentSecurityPolicy({
    nonce,
    requestOrigin: request.nextUrl.origin,
    supabaseUrl,
  })

  const buildRequestHeaders = () => {
    const headers = new Headers(request.headers)
    // Next.js App Router reads CSP from request headers to derive the nonce for
    // its own inline/required scripts.
    headers.set('Content-Security-Policy', csp)
    // Convenience header for userland components (e.g. JSON-LD scripts).
    headers.set('x-nonce', nonce)
    return headers
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: buildRequestHeaders(),
    },
  })
  supabaseResponse.headers.set('Content-Security-Policy', csp)

  // Helper to create redirects that preserve Supabase auth cookies.
  // When supabase.auth.getUser() refreshes an expired session, setAll() updates
  // supabaseResponse with new cookies. We must copy these to any redirect response,
  // otherwise the refreshed tokens are lost.
  // See: https://supabase.com/docs/guides/auth/server-side/nextjs
  const createRedirect = (url: URL) => {
    const res = NextResponse.redirect(url)
    // Copy all cookies from supabaseResponse (may include refreshed auth tokens)
    for (const cookie of supabaseResponse.cookies.getAll()) {
      const { name, value, ...options } = cookie
      res.cookies.set(name, value, options)
    }
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  const createErrorResponse = (status: number, message: string) => {
    const res = new NextResponse(message, { status })
    for (const cookie of supabaseResponse.cookies.getAll()) {
      const { name, value, ...options } = cookie
      res.cookies.set(name, value, options)
    }
    res.headers.set('Content-Security-Policy', csp)
    return res
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // This is Next.js RequestCookies API, not Koa. SameSite is handled by Supabase auth options.
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value) // nosemgrep: cookies-default-koa
          
          supabaseResponse = NextResponse.next({
            request: {
              headers: buildRequestHeaders(),
            },
          })
          supabaseResponse.headers.set('Content-Security-Policy', csp)
          for (const { name, value, options } of cookiesToSet) supabaseResponse.cookies.set(name, value, options)
          
        },
      },
    }
  )

  // Refresh session if expired (skip in E2E to avoid external dependencies)
  let user: { id: string } | null = null
  if (!isE2E) {
    try {
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser()
      user = fetchedUser ?? null
    } catch (error) {
      console.error('[proxy] failed to fetch user session:', error)
      user = null
    }
  }

  // Route classification
  const pathname = request.nextUrl.pathname
  const pathnameWithSearch = `${pathname}${request.nextUrl.search}`
  const isAdminRoute = pathname.startsWith('/admin')
  const isWorkshopSubroute = pathname.startsWith('/workshop/') // e.g., /workshop/kit/123
  const isWorkshopMainPage = pathname === '/workshop'
  const isProtectedRoute = isWorkshopSubroute && !isWorkshopMainPage
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/register')

  // Admin route protection - requires admin or staff role
  if (isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', pathnameWithSearch)
      return createRedirect(url)
    }

    // Check user role
    let profile: { role: string | null } | null = null
    let profileError: Error | null = null
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      profile = data ?? null
      if (error) profileError = error
    } catch (error) {
      profileError = error instanceof Error ? error : new Error('Profile lookup failed')
    }

    if (profileError) {
      console.error('[proxy] failed to verify admin role:', profileError)
      return createErrorResponse(500, 'Unable to verify admin access')
    }

    if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('error', 'unauthorized')
      return createRedirect(url)
    }
  }

  // Workshop subroute protection
  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathnameWithSearch)
    return createRedirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/workshop'
    return createRedirect(url)
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
     * - api routes (no CSP nonce needed)
     * - sentry tunnel (monitoring)
     */
    "/((?!api|monitoring|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|glb|gltf)$).*)",
  ],
}

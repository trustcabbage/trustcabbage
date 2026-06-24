import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// ── Layer 2: Bot blocklist ────────────────────────────────────────────────────
const BLOCKED_BOTS = [
  'serpstatbot', 'ahrefsbot', 'semrushbot', 'mj12bot', 'dotbot',
  'blexbot', 'petalbot', 'baiduspider', 'yandexbot', 'majestic',
  'rogerbot', 'exabot', 'uptimerobot', 'pingdom', 'statuscake',
]
const SEARCH_ENGINE_BOTS = [
  // Google — all official crawlers (crawl from US, must pass geo-block)
  'googlebot', 'google-inspectiontool', 'googlebot-image', 'googlebot-news',
  'adsbot-google', 'mediapartners-google', 'apis-google', 'feedfetcher-google',
  // Other search engines
  'bingbot', 'duckduckbot', 'slurp',
]

const isBlockedBot   = (ua: string) => BLOCKED_BOTS.some(b => ua.toLowerCase().includes(b))
const isSearchEngine = (ua: string) => SEARCH_ENGINE_BOTS.some(b => ua.toLowerCase().includes(b))

// ── Layer 4: Rate limiter (module-level — reused across warm instances) ───────
const ratelimit =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url:   process.env.UPSTASH_REDIS_REST_URL,
          token: process.env.UPSTASH_REDIS_REST_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(120, '1 m'),
        prefix: 'tc:rl',
      })
    : null

export async function proxy(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? ''

  // Layer 2 — block known scrapers before anything runs
  if (isBlockedBot(ua)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Layer 3 — India-only geo-block (x-vercel-ip-country is null in local dev → skipped)
  const country = request.headers.get('x-vercel-ip-country')
  if (country && country !== 'IN' && !isSearchEngine(ua)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  // Layer 4 — rate limiting (skip Next.js prefetches to avoid false positives)
  if (ratelimit && request.headers.get('Next-Router-Prefetch') !== '1') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    try {
      const { success, reset } = await ratelimit.limit(ip)
      if (!success) {
        return new NextResponse('Too Many Requests', {
          status: 429,
          headers: { 'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)) },
        })
      }
    } catch {
      // Fail open — Redis unavailable, let request through
    }
  }

  // Supabase session refresh + auth redirects
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    if (pathname.startsWith('/dashboard') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    if (pathname.startsWith('/admin') && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
  } catch {
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

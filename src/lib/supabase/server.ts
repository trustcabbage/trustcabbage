import { createServerClient } from '@supabase/ssr'
import { createClient as createBareClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createClient() {
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
            // Server Component, cookies set by middleware
          }
        },
      },
    }
  )
}

// True service-role client: no cookie binding, so requests always run as the
// service role regardless of who is browsing. This used to have a sibling,
// createServiceClient, that looked equivalent but attached the visitor's
// session cookies anyway, so despite the service key, Postgres still applied
// RLS as the logged-in caller. That silently dropped writes on tables with
// narrow RLS policies (no error, zero rows affected) in three different
// places before the pattern was found and removed for good. Always use this
// one to bypass RLS, never recreate a cookie-bound "service" client.
export function createAdminClient() {
  return createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}

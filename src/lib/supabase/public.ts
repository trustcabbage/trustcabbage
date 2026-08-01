import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cookie-free client for public, anon-readable data fetched inside
// unstable_cache(). The cookie-based clients in server.ts call cookies()
// internally, which unstable_cache's wrapped function is not allowed to do.
// Only use this for queries that don't depend on the viewer (no per-user
// data, no RLS rules gated on auth.uid()).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

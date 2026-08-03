import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'

type Company = {
  id: string
  name: string
  slug: string
  invite_token: string
  plan: 'free' | 'starter' | 'growth'
  claimed_by: string | null
}

type AuthResult =
  | { ok: false; error: string }
  | { ok: true; company: Company; supabase: ReturnType<typeof createAdminClient> }

// Shared Bearer tc_live_ auth for all /api/* endpoints that accept a company's API key.
// Uses the cookie-free admin client so writes always run as the service role,
// even if the call arrives from a browser session with auth cookies attached.
export async function authenticateApiKey(req: Request): Promise<AuthResult> {
  const auth = req.headers.get('authorization') ?? ''
  const key = auth.startsWith('Bearer ') ? auth.slice(7).trim() : ''
  if (!key || !key.startsWith('tc_live_')) {
    return { ok: false, error: 'Missing or invalid API key. Pass it as: Authorization: Bearer tc_live_...' }
  }

  const keyHash = createHash('sha256').update(key).digest('hex')
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('companies')
    .select('id, name, slug, invite_token, plan, claimed_by')
    .eq('api_key_hash', keyHash)
    .maybeSingle()

  if (!data) return { ok: false, error: 'Invalid API key.' }
  return { ok: true, company: data as unknown as Company, supabase }
}

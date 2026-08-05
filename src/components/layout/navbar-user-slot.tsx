import { createClient } from '@/lib/supabase/server'
import { Navbar } from './navbar'

// Isolated so its auth + profile lookups can stream inside their own
// Suspense boundary instead of blocking the shared (public) layout. A layout
// that awaits before returning JSX blocks the whole response, including the
// destination page's own loading.tsx, so this must never move back into
// layout.tsx's top-level render.
export async function NavbarUserSlot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <Navbar user={null} />

  const { data } = await supabase
    .from('users')
    .select('display_name, role, company_id')
    .eq('id', user.id)
    .single()

  const profile = data as any

  // Two flat queries, not one embedded select: users and companies have FKs
  // in both directions (users.company_id -> companies.id AND
  // companies.claimed_by -> users.id), which makes `companies(slug)` an
  // ambiguous embed for PostgREST. That silently broke role/company lookups
  // (and hid the dashboard link for every company admin) the one time this
  // was combined into a single query, keep it split.
  let companySlug: string | null = null
  if (profile?.company_id) {
    const { data: co } = await supabase.from('companies').select('slug').eq('id', profile.company_id).single()
    companySlug = (co as any)?.slug ?? null
  }

  return (
    <Navbar
      user={{
        email: user.email ?? '',
        displayName: profile?.display_name ?? user.email?.split('@')[0] ?? null,
        role: profile?.role ?? null,
        companySlug,
      }}
    />
  )
}

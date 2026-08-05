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
    .select('display_name, role, company_id, companies(slug)')
    .eq('id', user.id)
    .single()

  const profile = data as any

  return (
    <Navbar
      user={{
        email: user.email ?? '',
        displayName: profile?.display_name ?? user.email?.split('@')[0] ?? null,
        role: profile?.role ?? null,
        companySlug: profile?.companies?.slug ?? null,
      }}
    />
  )
}

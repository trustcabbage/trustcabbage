import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@/lib/supabase/server'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let navUser: { email: string; displayName: string | null; role: string | null; companySlug: string | null } | null = null

  if (user) {
    const { data } = await supabase
      .from('users')
      .select('display_name, role, company_id')
      .eq('id', user.id)
      .single()

    let companySlug: string | null = null
    if (data?.company_id) {
      const { data: co } = await supabase.from('companies').select('slug').eq('id', data.company_id).single()
      companySlug = (co as any)?.slug ?? null
    }

    navUser = {
      email: user.email ?? '',
      displayName: (data as any)?.display_name ?? user.email?.split('@')[0] ?? null,
      role: (data as any)?.role ?? null,
      companySlug,
    }
  }

  return (
    <>
      <Navbar user={navUser} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  )
}

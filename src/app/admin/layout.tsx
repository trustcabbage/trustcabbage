import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/admin/claims')

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') redirect('/')

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-[#1e1b4b] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-6">
          <Link href="/" className="text-sm font-black text-white">
            Trust<span className="text-[#a78bfa]">Cabbage</span>
          </Link>
          <span className="text-xs text-slate-500 font-black uppercase tracking-widest">Admin</span>
          <nav className="flex items-center gap-1 ml-4">
            {[
              { href: '/admin/companies', label: 'Companies' },
              { href: '/admin/claims', label: 'Claims' },
              { href: '/admin/reviews', label: 'Reviews' },
              { href: '/admin/categories', label: 'Categories' },
              { href: '/admin/business-models', label: 'Models' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-1.5 text-sm font-black text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {children}
      </main>
    </div>
  )
}

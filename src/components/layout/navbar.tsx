'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, PenLine, ChevronDown, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'

interface NavUser { email: string; displayName: string | null; role: string | null; companySlug: string | null }

export function Navbar({ user }: { user: NavUser | null }) {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isCompanyAdmin = user?.role === 'company_admin'
  const dashboardHref = user?.companySlug ? `/dashboard` : '/dashboard'

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#1e1b4b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-14 items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="text-lg font-black text-white tracking-tight">Trust</span>
          <span className="text-lg font-black text-[#a78bfa] tracking-tight">Cabbage</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm font-bold">
          <Link href="/categories" className="text-violet-200 hover:text-white transition-colors">
            Browse
          </Link>
          <Link href="/search" className="text-violet-200 hover:text-white transition-colors">
            Search
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {isCompanyAdmin ? (
                <Link
                  href={dashboardHref}
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-violet-400/50 text-violet-200 font-black px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" />
                  My Company
                </Link>
              ) : (
                <Link
                  href="/write-review"
                  className="hidden sm:flex items-center gap-1.5 rounded-xl border border-violet-400/50 text-violet-200 font-black px-4 py-2 text-sm hover:bg-white/10 transition-colors"
                >
                  <PenLine className="h-3.5 w-3.5" />
                  Write a review
                </Link>
              )}

              <div className="relative">
                <button
                  onClick={() => setMenuOpen(o => !o)}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-sm font-black text-violet-200 hover:bg-white/10 transition-colors"
                >
                  <span className="max-w-[100px] truncate">{user.displayName ?? user.email.split('@')[0]}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-violet-400" />
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 z-20 w-52 rounded-xl border border-slate-200 bg-white shadow-lg py-1">
                      {isCompanyAdmin ? (
                        <Link
                          href={dashboardHref}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-violet-50"
                          onClick={() => setMenuOpen(false)}
                        >
                          <LayoutDashboard className="h-4 w-4 text-[#6d28d9]" /> My Company Dashboard
                        </Link>
                      ) : (
                        <Link
                          href="/write-review"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-violet-50 sm:hidden"
                          onClick={() => setMenuOpen(false)}
                        >
                          <PenLine className="h-4 w-4 text-[#6d28d9]" /> Write a review
                        </Link>
                      )}
                      <button
                        onClick={() => { setMenuOpen(false); signOut() }}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      >
                        <LogOut className="h-4 w-4 text-slate-400" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full font-black text-violet-200 hover:text-white px-3 py-1.5 text-sm transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2 text-sm transition-colors"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

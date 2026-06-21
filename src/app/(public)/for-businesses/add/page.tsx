import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { AddCompanyForm } from './_components/add-company-form'

export const metadata: Metadata = { title: 'Add your company — Trust Cabbage' }

type Props = { searchParams: Promise<{ name?: string }> }
type Category = { id: string; name: string; slug: string; icon: string | null }

export default async function AddCompanyPage({ searchParams }: Props) {
  const { name = '' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?next=/for-businesses/add${name ? `?name=${encodeURIComponent(name)}` : ''}`)

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, icon')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')

  const categories = (categoriesData as unknown as Category[]) ?? []

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-violet-300/70 mb-3">
            <Link href="/for-businesses" className="hover:text-violet-200 transition-colors">For businesses</Link>
            <span className="mx-2">/</span>
            <span className="text-violet-200">Add company</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Add your company</h1>
          <p className="mt-2 text-violet-200/70 text-sm max-w-lg">
            Create your public company page. You&apos;ll claim it in the next step to get admin access.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <AddCompanyForm initialName={name} categories={categories} />
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          Already listed?{' '}
          <Link href="/search" className="text-[#6d28d9] font-bold hover:underline">Search and claim your page</Link>
        </p>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { NewCompanyReviewForm } from './_components/new-company-review-form'

export const metadata: Metadata = { title: 'Add a company & write a review' }

type Props = { searchParams: Promise<{ name?: string }> }

type Category = { id: string; name: string; slug: string; icon: string | null; parent_id: string | null; platform_type: 'b2b' | 'b2c' | 'both' }

export default async function WriteReviewNewPage({ searchParams }: Props) {
  const { name = '' } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect(`/login?next=/write-review/new${name ? `?name=${encodeURIComponent(name)}` : ''}`)
  }

  const { data: categoriesData } = await supabase
    .from('categories')
    .select('id, name, slug, icon, platform_type')
    .eq('is_active', true)
    .order('sort_order')

  const categories = (categoriesData as unknown as Category[]) ?? []

  return (
    <div>
      <section className="bg-[#1e1b4b] pt-10 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-slate-500 mb-3">
            <Link href="/write-review" className="hover:text-[#6d28d9] transition-colors">Write a review</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-300">New company</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Add a company & write a review
          </h1>
          <p className="mt-2 text-slate-400 text-sm max-w-lg">
            The company page will be publicly visible and Google-searchable. The business can claim it later.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <NewCompanyReviewForm
          initialName={name}
          categories={categories}
          userId={user.id}
        />
      </div>
    </div>
  )
}

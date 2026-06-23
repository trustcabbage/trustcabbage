import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { ProfileEditForm } from './_components/profile-edit-form'
import { ProductsManager } from './_components/products-manager'
import { ChevronLeft } from 'lucide-react'

export const metadata: Metadata = { title: 'Edit profile — Dashboard' }

export default async function DashboardEditPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/edit')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const [{ data: coRaw }, { data: productsRaw }, { data: companyCatsRaw }, { data: allCatsRaw }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', companyId).single(),
    supabase.from('products_services').select('id, name, type, description, price_range').eq('company_id', companyId).eq('is_active', true).order('sort_order'),
    supabase.from('company_categories').select('category_id').eq('company_id', companyId),
    supabase.from('categories').select('id, name, slug, parent_id').order('name'),
  ])

  const co = coRaw as any
  const products = (productsRaw ?? []) as any[]
  const currentCategoryIds = ((companyCatsRaw ?? []) as any[]).map(r => r.category_id as string)
  const allCategories = (allCatsRaw ?? []) as { id: string; name: string; slug: string; parent_id: string | null }[]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">Edit profile</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Profile section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h1 className="font-black text-slate-950">Company profile</h1>
            <p className="text-xs text-slate-400 mt-0.5">This information appears on your public company page.</p>
          </div>
          <div className="px-6 py-6">
            <ProfileEditForm company={co} allCategories={allCategories} currentCategoryIds={currentCategoryIds} />
          </div>
        </div>

        {/* Products section */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-black text-slate-950">Products &amp; services</h2>
            <p className="text-xs text-slate-400 mt-0.5">Reviewers can tag their review to a specific product or service you offer.</p>
          </div>
          <div className="px-6 py-6">
            <ProductsManager products={products} />
          </div>
        </div>

      </div>
    </div>
  )
}

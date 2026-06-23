import { createClient } from '@/lib/supabase/server'
import { CompanyForm } from './_components/company-form'

type Category = { id: string; name: string; slug: string; icon: string | null; parent_id: string | null; platform_type: 'b2b' | 'b2c' | 'both' }
type BusinessModel = { id: string; name: string; slug: string; description: string | null }

export default async function AdminCompanyNewPage() {
  const supabase = await createClient()
  const [{ data: categoriesData }, { data: modelsData }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, icon, parent_id, platform_type').eq('is_active', true).order('sort_order'),
    supabase.from('business_models').select('id, name, slug, description').order('sort_order'),
  ])

  const categories = (categoriesData as unknown as Category[]) ?? []
  const businessModels = (modelsData as unknown as BusinessModel[]) ?? []

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Add a company</h1>
        <p className="text-sm text-slate-500 mt-1">
          Admin-seeded companies are created as <span className="font-bold">unclaimed</span> and immediately live for SEO indexing.
        </p>
      </div>
      <CompanyForm categories={categories} businessModels={businessModels} mode="create" />
    </div>
  )
}

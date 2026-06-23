import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CompanyForm } from '../../new/_components/company-form'
import { CompanyFeaturesSection } from './_components/company-features-section'

type Props = { params: Promise<{ id: string }> }
type Category = { id: string; name: string; slug: string; icon: string | null; parent_id: string | null; platform_type: 'b2b' | 'b2c' | 'both' }

export default async function AdminCompanyEditPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: companyData }, { data: categoriesData }, { data: companyCategories }, { data: productsData }, { data: modelsData }] = await Promise.all([
    supabase.from('companies').select('*').eq('id', id).single(),
    supabase.from('categories').select('id, name, slug, icon, parent_id, platform_type').eq('is_active', true).order('sort_order'),
    supabase.from('company_categories').select('category_id').eq('company_id', id),
    supabase.from('products_services').select('*').eq('company_id', id).eq('is_active', true).order('sort_order'),
    supabase.from('business_models').select('id, name, slug, description').order('sort_order'),
  ])

  if (!companyData) notFound()

  const categories = (categoriesData as unknown as Category[]) ?? []
  const businessModels = (modelsData as unknown as Array<{ id: string; name: string; slug: string; description: string | null }>) ?? []
  const categoryIds = ((companyCategories ?? []) as any[]).map((cc: any) => cc.category_id)

  // Only subcategories (those with a parent) can have features
  const subcategoryIds = categories
    .filter(c => c.parent_id !== null && categoryIds.includes(c.id))
    .map(c => c.id)

  const products = ((productsData ?? []) as any[]).map((p: any) => ({
    name: p.name,
    type: p.type,
    description: p.description ?? '',
    price_range: p.price_range ?? '',
  }))

  const initialData = {
    ...(companyData as any),
    category_ids: categoryIds,
    products: products.length > 0 ? products : [{ name: '', type: 'service', description: '', price_range: '' }],
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-950">Edit: {(companyData as any).name}</h1>
        <p className="text-sm text-slate-500 mt-1 font-mono">/company/{(companyData as any).slug}</p>
      </div>
      <CompanyForm categories={categories} businessModels={businessModels} mode="edit" initialData={initialData} />
      <CompanyFeaturesSection companyId={id} subcategoryIds={subcategoryIds} />
    </div>
  )
}

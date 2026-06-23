'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type State = { error?: string; success?: string } | undefined

async function getCompanyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/edit')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) {
    redirect('/')
  }

  return { supabase, companyId: (profile as any).company_id as string }
}

export async function updateProfile(_prev: State, formData: FormData): Promise<State> {
  const { supabase, companyId } = await getCompanyAdmin()

  const name = formData.get('name') as string
  if (!name?.trim()) return { error: 'Company name is required' }

  const updates: Record<string, unknown> = {
    name: name.trim(),
    description: (formData.get('description') as string)?.trim() || null,
    website: (formData.get('website') as string)?.trim() || null,
    city: (formData.get('city') as string)?.trim() || null,
    state: (formData.get('state') as string)?.trim() || null,
    founded_year: formData.get('founded_year') ? parseInt(formData.get('founded_year') as string) : null,
    employee_count: (formData.get('employee_count') as string)?.trim() || null,
    gst_number: (formData.get('gst_number') as string)?.trim() || null,
    cin_number: (formData.get('cin_number') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  // Logo upload
  const logoFile = formData.get('logo') as File | null
  if (logoFile && logoFile.size > 0) {
    if (logoFile.size > 5 * 1024 * 1024) return { error: 'Logo must be under 5 MB' }
    const ext = logoFile.name.split('.').pop() ?? 'png'
    const path = `${companyId}/logo.${ext}`
    const bytes = await logoFile.arrayBuffer()
    const { error: uploadErr } = await supabase.storage
      .from('company-logos')
      .upload(path, bytes, { contentType: logoFile.type, upsert: true })
    if (uploadErr) return { error: `Logo upload failed: ${uploadErr.message}` }
    const { data: { publicUrl } } = supabase.storage.from('company-logos').getPublicUrl(path)
    updates.logo_url = publicUrl
  }

  const { error } = await supabase.from('companies').update(updates).eq('id', companyId)
  if (error) return { error: error.message }

  // Update categories if submitted
  if (formData.get('categories_updated') === '1') {
    const categoryIds = formData.getAll('category_ids') as string[]
    await supabase.from('company_categories').delete().eq('company_id', companyId)
    if (categoryIds.length > 0) {
      await supabase.from('company_categories').insert(
        categoryIds.map(catId => ({ company_id: companyId, category_id: catId }))
      )
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/edit')
  return { success: 'Profile updated successfully' }
}

export async function addProduct(_prev: State, formData: FormData): Promise<State> {
  const { supabase, companyId } = await getCompanyAdmin()

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Product name is required' }

  const type = formData.get('type') as string
  if (!['product', 'service'].includes(type)) return { error: 'Invalid type' }

  const { error } = await supabase.from('products_services').insert({
    company_id: companyId,
    name,
    type,
    description: (formData.get('description') as string)?.trim() || null,
    price_range: (formData.get('price_range') as string)?.trim() || null,
    is_active: true,
  })

  if (error) return { error: error.message }
  revalidatePath('/dashboard/edit')
  return { success: 'Added successfully' }
}

export async function deleteProduct(_prev: State, formData: FormData): Promise<State> {
  const { supabase, companyId } = await getCompanyAdmin()

  const productId = formData.get('product_id') as string
  if (!productId) return { error: 'Missing product ID' }

  // Verify the product belongs to this company before deleting
  const { data: product } = await supabase
    .from('products_services')
    .select('id')
    .eq('id', productId)
    .eq('company_id', companyId)
    .single()

  if (!product) return { error: 'Product not found' }

  const { error } = await supabase.from('products_services').delete().eq('id', productId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/edit')
  return { success: 'Deleted' }
}

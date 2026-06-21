'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')
}

export async function createCategory(formData: FormData) {
  const supabase = await createClient()
  await verifyAdmin(supabase)

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const icon = (formData.get('icon') as string)?.trim() || null
  const image_url = (formData.get('image_url') as string)?.trim() || null
  const parent_id = (formData.get('parent_id') as string)?.trim() || null
  const is_featured = formData.get('is_featured') === '1'

  if (!name || !slug) return

  await supabase.from('categories').insert({ name, slug, description, icon, image_url, is_active: true, parent_id, is_featured })
  revalidatePath('/admin/categories')
}

export async function toggleCategory(id: string, isActive: boolean) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  await supabase.from('categories').update({ is_active: !isActive }).eq('id', id)
  revalidatePath('/admin/categories')
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function createFeature(subcategoryId: string, name: string) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  const slug = toSlug(name)
  if (!slug) return
  await supabase.from('features').insert({ subcategory_id: subcategoryId, name: name.trim(), slug })
  revalidatePath('/admin/categories')
}

export async function deleteFeature(id: string) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  await supabase.from('features').delete().eq('id', id)
  revalidatePath('/admin/categories')
}

export async function toggleCompanyFeature(companyId: string, featureId: string, isAdding: boolean) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  if (isAdding) {
    await supabase.from('company_features').insert({ company_id: companyId, feature_id: featureId })
  } else {
    await supabase.from('company_features').delete().eq('company_id', companyId).eq('feature_id', featureId)
  }
  revalidatePath('/admin/companies')
}

export async function updateCategory(id: string, formData: FormData) {
  const supabase = await createClient()
  await verifyAdmin(supabase)

  const name = (formData.get('name') as string)?.trim()
  const slug = (formData.get('slug') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  const icon = (formData.get('icon') as string)?.trim() || null
  const image_url = (formData.get('image_url') as string)?.trim() || null
  const parent_id = (formData.get('parent_id') as string)?.trim() || null
  const is_featured = formData.get('is_featured') === '1'

  if (!name || !slug) return

  await supabase.from('categories').update({ name, slug, description, icon, image_url, parent_id, is_featured }).eq('id', id)
  revalidatePath('/admin/categories')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-')
}

export async function createBusinessModel(formData: FormData) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return
  const slug = toSlug(name)
  await supabase.from('business_models').insert({ name, slug, description })
  revalidatePath('/admin/business-models')
}

export async function updateBusinessModel(id: string, formData: FormData) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  const name = (formData.get('name') as string)?.trim()
  const description = (formData.get('description') as string)?.trim() || null
  if (!name) return
  const slug = toSlug(name)
  await supabase.from('business_models').update({ name, slug, description }).eq('id', id)
  revalidatePath('/admin/business-models')
}

export async function deleteBusinessModel(id: string) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  // Sets business_model_id = null on companies (ON DELETE SET NULL handles this)
  await supabase.from('business_models').delete().eq('id', id)
  revalidatePath('/admin/business-models')
}

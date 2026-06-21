'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function toSlug(name: string): string {
  return name.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function addCompany(_prev: { error: string } | void | undefined, formData: FormData): Promise<{ error: string } | void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/for-businesses/add')

  const name = (formData.get('name') as string ?? '').trim()
  const website = (formData.get('website') as string ?? '').trim() || null
  const categoryId = (formData.get('category_id') as string ?? '') || null
  const city = (formData.get('city') as string ?? '').trim() || null
  const state = (formData.get('state') as string ?? '') || null
  const description = (formData.get('description') as string ?? '').trim() || null

  if (!name) return { error: 'Company name is required' }

  const baseSlug = toSlug(name)
  let slug = baseSlug

  const { data: existing } = await supabase.from('companies').select('id').eq('slug', slug).maybeSingle()
  if (existing) slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  const { data: company, error } = await supabase
    .from('companies')
    .insert({ name, slug, website_url: website, city, state, description, status: 'unclaimed', created_by: user.id })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }

  if (categoryId) {
    await supabase.from('company_categories').insert({ company_id: (company as any).id, category_id: categoryId })
  }

  redirect(`/company/${(company as any).slug}/claim?listed=1`)
}

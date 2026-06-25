'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markHelpful(formData: FormData) {
  const reviewId = formData.get('review_id') as string
  const companySlug = formData.get('company_slug') as string
  if (!reviewId || !companySlug) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: row } = await supabase
    .from('reviews').select('helpful_votes').eq('id', reviewId).single()
  const current = (row as any)?.helpful_votes ?? 0
  await supabase.from('reviews').update({ helpful_votes: current + 1 }).eq('id', reviewId)

  revalidatePath(`/company/${companySlug}`)
}

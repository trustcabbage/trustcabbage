'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type State = { error?: string; success?: boolean } | undefined

export async function replyToReview(_prev: State, formData: FormData): Promise<State> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) {
    return { error: 'Unauthorized' }
  }

  const reviewId = formData.get('review_id') as string
  const content = (formData.get('content') as string)?.trim()

  if (!reviewId) return { error: 'Missing review ID' }
  if (!content || content.length < 10) return { error: 'Reply must be at least 10 characters' }
  if (content.length > 2000) return { error: 'Reply must be under 2000 characters' }

  const companyId = (profile as any).company_id as string

  // Verify the review belongs to the company admin's company
  const { data: review } = await supabase
    .from('reviews')
    .select('id, company_id')
    .eq('id', reviewId)
    .eq('company_id', companyId)
    .single()

  if (!review) return { error: 'Review not found' }

  // Upsert: one reply per review, company admin can update it
  const { error } = await supabase.from('review_responses').upsert(
    { review_id: reviewId, company_id: companyId, content, replied_by: user.id },
    { onConflict: 'review_id' }
  )

  if (error) return { error: error.message }

  const { data: companySlug } = await supabase
    .from('companies').select('slug').eq('id', companyId).single()

  if (companySlug) revalidatePath(`/company/${(companySlug as any).slug}`)
  return { success: true }
}

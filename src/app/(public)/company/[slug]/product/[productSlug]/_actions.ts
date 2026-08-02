'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type QaState = { error?: string; success?: boolean } | undefined

export async function askQuestion(_prev: QaState, formData: FormData): Promise<QaState> {
  const productId = formData.get('product_id') as string
  const companySlug = formData.get('company_slug') as string
  const productSlug = formData.get('product_slug') as string
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!body || body.length < 5) return { error: 'Question must be at least 5 characters.' }
  if (body.length > 500) return { error: 'Question must be under 500 characters.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to ask a question.' }

  const { error } = await supabase.from('product_questions').insert({
    product_id: productId,
    asker_id: user.id,
    body,
  })
  if (error) return { error: 'Could not post your question. Please try again.' }

  revalidatePath(`/company/${companySlug}/product/${productSlug}`)
  return { success: true }
}

export async function answerQuestion(_prev: QaState, formData: FormData): Promise<QaState> {
  const questionId = formData.get('question_id') as string
  const productId = formData.get('product_id') as string
  const companySlug = formData.get('company_slug') as string
  const productSlug = formData.get('product_slug') as string
  const body = ((formData.get('body') as string) ?? '').trim()

  if (!body || body.length < 2) return { error: 'Answer is too short.' }
  if (body.length > 1000) return { error: 'Answer must be under 1000 characters.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be signed in to answer.' }

  const { data: product } = await supabase
    .from('products_services')
    .select('company_id')
    .eq('id', productId)
    .single()

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  // Computed server-side, never trusted from the client.
  const isCompanyAnswer = !!product
    && (profile as any)?.role === 'company_admin'
    && (profile as any)?.company_id === (product as any).company_id

  const { data: ownReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_service_id', productId)
    .eq('reviewer_id', user.id)
    .eq('status', 'published')
    .maybeSingle()

  const { error } = await supabase.from('product_answers').insert({
    question_id: questionId,
    answerer_id: user.id,
    body,
    is_company_answer: isCompanyAnswer,
    is_verified_buyer: !!ownReview,
  })
  if (error) return { error: 'Could not post your answer. Please try again.' }

  revalidatePath(`/company/${companySlug}/product/${productSlug}`)
  // Also invalidate the dashboard Q&A inbox, this action is reused there too.
  revalidatePath('/dashboard/qa')
  return { success: true }
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')
  return user.id
}

export async function approveReview(reviewId: string) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  await supabase.from('reviews').update({ status: 'published' }).eq('id', reviewId)
  revalidatePath('/admin/reviews')
}

export async function removeReview(reviewId: string) {
  const supabase = await createClient()
  await verifyAdmin(supabase)
  await supabase.from('reviews').update({ status: 'removed' }).eq('id', reviewId)
  revalidatePath('/admin/reviews')
}

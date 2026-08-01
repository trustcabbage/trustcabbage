'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createServiceClient } from '@/lib/supabase/server'

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'admin') throw new Error('Forbidden')
  return user.id
}

export async function approveClaim(claimId: string, companyId: string) {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)

  // Writes below touch rows the admin doesn't own (the claimant's user row,
  // the company row). RLS evaluates auth.uid() as the admin's own id, so a
  // "users can only update their own row" policy silently blocks the role
  // change, no error, zero rows updated. Use the service client to bypass
  // RLS for this trusted, already-authorized admin action.
  const service = await createServiceClient()

  await service
    .from('company_claims')
    .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)

  const { data: claim } = await service
    .from('company_claims')
    .select('claimant_id')
    .eq('id', claimId)
    .single()

  if (claim) {
    await service
      .from('companies')
      .update({ status: 'claimed', claimed_by: claim.claimant_id })
      .eq('id', companyId)

    await service
      .from('users')
      .update({ role: 'company_admin', company_id: companyId })
      .eq('id', claim.claimant_id)
  }

  revalidatePath('/admin/claims')
}

export async function rejectClaim(claimId: string) {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)
  const service = await createServiceClient()

  await service
    .from('company_claims')
    .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)

  revalidatePath('/admin/claims')
}

'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

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
  // change, no error, zero rows updated. createAdminClient() is a bare
  // service-role client with no cookies attached, so it genuinely bypasses
  // RLS (see the comment on it in lib/supabase/server.ts, this function used
  // to call a cookie-bound lookalike by mistake, which silently dropped a
  // company_members insert since that table has no insert policy for a
  // plain authenticated user).
  const service = createAdminClient()

  const { data: claim } = await service
    .from('company_claims')
    .select('claimant_id')
    .eq('id', claimId)
    .single()
  if (!claim) return

  await service
    .from('company_claims')
    .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)

  await service
    .from('companies')
    .update({ status: 'claimed', claimed_by: claim.claimant_id })
    .eq('id', companyId)

  // Grants access without touching any OTHER company this person already
  // manages: company_members is additive (upsert, never a delete elsewhere),
  // so approving this claim can only ever gain them a company, never cost
  // them one. company_id is switched to make this newly claimed company the
  // active dashboard, same "claiming takes you there" behavior as before,
  // membership in whatever was active previously is untouched and still
  // reachable via the company switcher.
  //
  // Checked and thrown on failure deliberately: this insert silently no-op'd
  // once already (RLS rejected it under the old cookie-bound client, see
  // above), leaving the claimant's company_id switched with no
  // company_members row to back it up, invisible until they went looking for
  // the switcher and it wasn't there. A thrown error here surfaces
  // immediately in the admin UI instead of rotting as a support ticket.
  const { error: membershipErr } = await service
    .from('company_members')
    .upsert({ user_id: claim.claimant_id, company_id: companyId }, { onConflict: 'user_id,company_id' })
  if (membershipErr) {
    throw new Error(`Could not grant company membership: ${membershipErr.message}`)
  }

  await service
    .from('users')
    .update({ role: 'company_admin', company_id: companyId })
    .eq('id', claim.claimant_id)

  revalidatePath('/admin/claims')
}

export async function rejectClaim(claimId: string) {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)
  const service = createAdminClient()

  await service
    .from('company_claims')
    .update({ status: 'rejected', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
    .eq('id', claimId)

  revalidatePath('/admin/claims')
}

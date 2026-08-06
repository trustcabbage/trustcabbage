'use server'

import { revalidatePath } from 'next/cache'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export type SimpleResult = { ok: true } | { ok: false; error: string }

// Any member can switch which of their companies is currently active,
// membership-gated only, no ownership required (that's a stricter rule that
// only applies to inviting/removing teammates, see dashboard/settings).
export async function switchActiveCompany(companyId: string): Promise<SimpleResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Not signed in.' }

  const admin = createAdminClient()
  const { data: membership } = await admin
    .from('company_members')
    .select('id')
    .eq('user_id', user.id)
    .eq('company_id', companyId)
    .maybeSingle()
  if (!membership) return { ok: false, error: 'You do not have access to that company.' }

  await admin.from('users').update({ company_id: companyId, role: 'company_admin' }).eq('id', user.id)

  revalidatePath('/dashboard')
  return { ok: true }
}

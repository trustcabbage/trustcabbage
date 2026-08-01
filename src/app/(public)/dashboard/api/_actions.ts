'use server'

import { createHash, randomBytes } from 'crypto'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export type GenerateKeyState = { key?: string; error?: string } | undefined

export async function generateApiKey(_prev: GenerateKeyState, _formData: FormData): Promise<GenerateKeyState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) {
    return { error: 'Only company admins can generate API keys.' }
  }

  const companyId = (profile as any).company_id as string

  const key = `tc_live_${randomBytes(20).toString('hex')}`
  const hash = createHash('sha256').update(key).digest('hex')
  const prefix = key.slice(0, 15)

  const service = await createServiceClient()
  const { error } = await service
    .from('companies')
    .update({
      api_key_hash: hash,
      api_key_prefix: prefix,
      api_key_created_at: new Date().toISOString(),
    })
    .eq('id', companyId)

  if (error) return { error: 'Failed to save the key. Try again.' }

  return { key }
}

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BusinessTypeSettings } from './_components/business-type-settings'

export const metadata: Metadata = { title: 'Company settings — Trust Cabbage' }

export default async function DashboardSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/settings')

  const { data: profile } = await supabase
    .from('users')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) {
    redirect('/')
  }

  const companyId = (profile as any).company_id

  const { data: companyData } = await supabase
    .from('companies')
    .select('id, name, business_type')
    .eq('id', companyId)
    .single()

  const company = companyData as { id: string; name: string; business_type: string } | null
  if (!company) redirect('/')

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="font-black text-slate-950 text-sm">Company settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">{company.name}</p>
          </div>
          <Link href="/dashboard" className="text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            ← Dashboard
          </Link>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <BusinessTypeSettings
          companyId={company.id}
          companyName={company.name}
          currentBusinessType={company.business_type}
          userId={user.id}
        />
      </div>
    </div>
  )
}

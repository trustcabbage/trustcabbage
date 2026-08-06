import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { BusinessTypeSettings } from './_components/business-type-settings'
import { TeamSettings } from './_components/team-settings'
import { teamSeatLimit, type Plan } from '@/lib/plan-limits'

export const metadata: Metadata = { title: 'Company settings | Trust Cabbage' }

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
    .select('id, name, business_type, claimed_by, plan')
    .eq('id', companyId)
    .single()

  const company = companyData as { id: string; name: string; business_type: string; claimed_by: string | null; plan: string } | null
  if (!company) redirect('/')

  // Reading teammates' rows here is a cross-user read, and this codebase's
  // users table RLS policy (set up outside the tracked migrations) is not
  // guaranteed to allow that for a regular company_admin, the exact class of
  // silent-empty-result bug already hit twice this session. Authorization is
  // already verified above, so read via the admin client instead of relying
  // on RLS to also grant the read.
  const admin = createAdminClient()
  const [{ data: membershipsRaw }, { data: invitesRaw }] = await Promise.all([
    // company_members is the source of truth for who's on the team, someone
    // can be a member here while a different company is their active
    // dashboard right now, so this must NOT filter on users.company_id.
    admin
      .from('company_members')
      .select('created_at, users(id, display_name, email)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: true }),
    admin
      .from('company_team_invites')
      .select('id, email, created_at')
      .eq('company_id', companyId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ])

  const membersRaw = ((membershipsRaw ?? []) as any[])
    .filter(m => m.users)
    .map(m => ({ ...m.users, created_at: m.created_at }))

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
        {company.claimed_by && (
          <TeamSettings
            members={(membersRaw ?? []) as any}
            invites={(invitesRaw ?? []) as any}
            ownerId={company.claimed_by}
            currentUserId={user.id}
            seatLimit={teamSeatLimit((company.plan ?? 'free') as Plan)}
          />
        )}
      </div>
    </div>
  )
}

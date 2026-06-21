import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { InviteForm } from './_components/invite-form'
import { ChevronLeft, Mail, Info } from 'lucide-react'
import { emailInviteLimit } from '@/lib/plan-limits'

export const metadata: Metadata = { title: 'Email invites — Dashboard' }

export default async function InvitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/invites')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const { data: co } = await supabase
    .from('companies').select('name, slug, invite_token, plan').eq('id', companyId).single()

  const plan = ((co as any)?.plan ?? 'free') as 'free' | 'starter' | 'growth'
  const limit = emailInviteLimit(plan)
  const limitNum = isFinite(limit) ? limit : null

  // Get this month's count
  let monthUsed = 0
  if (limitNum !== null) {
    const { data } = await supabase.rpc('invite_emails_this_month', { p_company_id: companyId })
    monthUsed = (data as number) ?? 0
  }

  // Recent logs (last 50)
  const { data: logsRaw } = await supabase
    .from('invite_email_logs')
    .select('id, recipient, status, sent_at')
    .eq('company_id', companyId)
    .order('sent_at', { ascending: false })
    .limit(50)

  const logs = (logsRaw ?? []) as any[]

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">Email invites</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Send form */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-[#6d28d9]" />
              <h1 className="font-black text-slate-950">Send email invites</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              We&apos;ll send a branded invite email asking clients to leave a review.
              {limitNum !== null && ` Up to ${limitNum} per month on your plan.`}
            </p>
          </div>
          <div className="px-6 py-6">
            <InviteForm monthUsed={monthUsed} monthLimit={limitNum} />
          </div>
        </div>

        {/* Tip */}
        <div className="flex items-start gap-3 rounded-xl bg-violet-50 border border-violet-200 px-4 py-3">
          <Info className="h-4 w-4 text-[#6d28d9] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-violet-800 leading-relaxed">
            <span className="font-black">Tip:</span> The best time to send a review invite is immediately after completing a project or delivery. Keep the list under 20 at a time for better deliverability.
          </p>
        </div>

        {/* History */}
        {logs.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="font-black text-slate-950">Invite history</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 50 invites sent</p>
            </div>
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {logs.map((log: any) => (
                <div key={log.id} className="flex items-center gap-3 px-6 py-3">
                  <div className={`h-2 w-2 rounded-full flex-shrink-0 ${log.status === 'sent' ? 'bg-green-400' : 'bg-red-400'}`} />
                  <span className="text-sm text-slate-700 flex-1 font-mono truncate">{log.recipient}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={`text-[10px] font-black capitalize px-2 py-0.5 rounded-full ${
                    log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>{log.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

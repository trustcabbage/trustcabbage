import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AcceptInvite } from './_components/accept-invite'
import { CheckCircle, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Team invite | Trust Cabbage', robots: { index: false } }

type Props = { params: Promise<{ token: string }> }

const EXPIRY_DAYS = 14

export default async function TeamInvitePage({ params }: Props) {
  const { token } = await params
  if (!token) notFound()

  const admin = createAdminClient()
  const { data: inviteRaw } = await admin
    .from('company_team_invites')
    .select('id, email, status, created_at, companies(name, slug)')
    .eq('token', token)
    .maybeSingle()

  if (!inviteRaw) notFound()
  const invite = inviteRaw as any
  const company = invite.companies as { name: string; slug: string }

  const isExpired = invite.status === 'pending' && Date.now() - new Date(invite.created_at).getTime() > EXPIRY_DAYS * 24 * 3600 * 1000

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-[#1e1b4b] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-lg font-black text-white">
            Trust<span className="text-[#a78bfa]">Cabbage</span>
          </p>
        </div>

        {invite.status === 'accepted' ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
            <h1 className="text-xl font-black text-white">Already accepted</h1>
            <p className="text-sm text-slate-400 mt-2">This invite has already been used.</p>
            <Link href="/dashboard" className="inline-block mt-5 text-sm font-black text-violet-300 hover:text-violet-200 transition-colors">
              Go to your dashboard →
            </Link>
          </div>
        ) : isExpired ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
            <Clock className="h-8 w-8 text-amber-400 mx-auto mb-3" />
            <h1 className="text-xl font-black text-white">This invite has expired</h1>
            <p className="text-sm text-slate-400 mt-2">
              Ask an admin at {company.name} to send you a new invite from their dashboard.
            </p>
          </div>
        ) : !user ? (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
            <h1 className="text-xl font-black text-white">Join {company.name}</h1>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">
              Sign in with <span className="text-slate-200 font-bold">{invite.email}</span> to accept this invite.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(`/team-invite/${token}`)}`}
              className="inline-block mt-6 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
            >
              Sign in to continue
            </Link>
          </div>
        ) : (
          <AcceptInvite
            token={token}
            companyName={company.name}
            currentEmail={user.email ?? ''}
            invitedEmail={invite.email}
          />
        )}
      </div>
    </div>
  )
}

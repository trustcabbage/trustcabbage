'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { acceptTeamInvite } from '../_actions'
import { Users } from 'lucide-react'

export function AcceptInvite({ token, companyName, currentEmail, invitedEmail }: {
  token: string
  companyName: string
  currentEmail: string
  invitedEmail: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const mismatch = currentEmail.toLowerCase() !== invitedEmail.toLowerCase()

  async function accept() {
    setBusy(true)
    const res = await acceptTeamInvite(token)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`You're in! Welcome to ${companyName}.`)
    router.push('/dashboard')
    router.refresh()
  }

  async function switchAccount() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(`/login?next=${encodeURIComponent(`/team-invite/${token}`)}`)
    router.refresh()
  }

  if (mismatch) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
        <div className="h-12 w-12 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <Users className="h-6 w-6 text-amber-400" />
        </div>
        <h1 className="text-lg font-black text-white">Wrong account</h1>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">
          This invite was sent to <span className="text-slate-200 font-bold">{invitedEmail}</span>, but
          you&apos;re signed in as <span className="text-slate-200 font-bold">{currentEmail}</span>.
        </p>
        <button
          type="button"
          onClick={switchAccount}
          className="mt-6 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
        >
          Sign in with {invitedEmail}
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
      <div className="h-12 w-12 rounded-2xl bg-violet-500/15 flex items-center justify-center mx-auto mb-4">
        <Users className="h-6 w-6 text-violet-300" />
      </div>
      <h1 className="text-lg font-black text-white">Join {companyName}</h1>
      <p className="text-sm text-slate-400 mt-2 leading-relaxed">
        You&apos;ll get full access to their dashboard, reviews, and Service Desk.
      </p>
      <button
        type="button"
        onClick={accept}
        disabled={busy}
        className="mt-6 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors disabled:opacity-50"
      >
        {busy ? 'Joining…' : 'Accept invitation'}
      </button>
    </div>
  )
}

'use client'

import { useActionState, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Crown, Mail, X, Send } from 'lucide-react'
import { inviteTeamMember, revokeInvite, removeTeamMember, type InviteState } from '../_actions'

export interface TeamMember {
  id: string
  display_name: string | null
  email: string
  created_at: string
}

export interface PendingInvite {
  id: string
  email: string
  created_at: string
}

export function TeamSettings({ members, invites, ownerId, currentUserId, seatLimit }: {
  members: TeamMember[]
  invites: PendingInvite[]
  ownerId: string
  currentUserId: string
  seatLimit: number
}) {
  const isOwner = currentUserId === ownerId
  const seatsUsed = members.length
  const atLimit = isFinite(seatLimit) && seatsUsed >= seatLimit

  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="font-black text-slate-950">Team</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {isFinite(seatLimit) ? `${seatsUsed} of ${seatLimit} seats used.` : `${seatsUsed} team member${seatsUsed !== 1 ? 's' : ''}.`}{' '}
          Everyone here has full access to this dashboard.
        </p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Members */}
        <div className="space-y-2">
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-100 px-4 py-3">
              <div className="h-9 w-9 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 text-violet-700 font-black text-sm">
                {(m.display_name || m.email)[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-950 truncate flex items-center gap-1.5">
                  {m.display_name || m.email}
                  {m.id === ownerId && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-black">
                      <Crown className="h-2.5 w-2.5" /> Owner
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400 truncate">{m.email}</p>
              </div>
              {isOwner && m.id !== ownerId && <RemoveMemberButton memberId={m.id} name={m.display_name || m.email} />}
            </div>
          ))}
        </div>

        {/* Pending invites */}
        {invites.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">Pending invites</p>
            {invites.map(inv => (
              <div key={inv.id} className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 px-4 py-3">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-slate-700 truncate">{inv.email}</p>
                  <p className="text-xs text-slate-400">
                    Invited {new Date(inv.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
                {isOwner && <RevokeInviteButton inviteId={inv.id} />}
              </div>
            ))}
          </div>
        )}

        {/* Invite form, owner only */}
        {isOwner && (
          atLimit ? (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
              You&apos;ve used all {seatLimit} seats on your plan. Remove a teammate or upgrade to invite more.
            </p>
          ) : (
            <InviteForm />
          )
        )}
      </div>
    </div>
  )
}

function InviteForm() {
  const [state, formAction, pending] = useActionState<InviteState, FormData>(inviteTeamMember, undefined)

  return (
    <form action={formAction} className="space-y-2">
      <Label htmlFor="team-email" className="text-xs font-black uppercase tracking-wide text-slate-400">Invite a teammate</Label>
      <div className="flex gap-2">
        <Input
          id="team-email"
          name="email"
          type="email"
          placeholder="teammate@company.com"
          required
          className="border-slate-200 flex-1"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2.5 text-sm transition-colors disabled:opacity-50 disabled:pointer-events-none inline-flex items-center gap-1.5"
        >
          <Send className="h-3.5 w-3.5" /> {pending ? 'Sending…' : 'Invite'}
        </button>
      </div>
      {state?.error && <p className="text-xs font-bold text-rose-600">{state.error}</p>}
      {state?.success && <p className="text-xs font-bold text-green-600">{state.success}</p>}
      <p className="text-xs text-slate-400">They get full dashboard access once they accept.</p>
    </form>
  )
}

function RevokeInviteButton({ inviteId }: { inviteId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function revoke() {
    setBusy(true)
    const res = await revokeInvite(inviteId)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Invite revoked.')
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button type="button" onClick={revoke} disabled={busy} className="text-[11px] font-black text-rose-600 hover:text-rose-700">
          {busy ? '…' : 'Confirm?'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex-shrink-0 text-slate-400 hover:text-rose-500 transition-colors"
      aria-label="Revoke invite"
    >
      <X className="h-4 w-4" />
    </button>
  )
}

function RemoveMemberButton({ memberId, name }: { memberId: string; name: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  async function remove() {
    setBusy(true)
    const res = await removeTeamMember(memberId)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`${name} removed from the team.`)
    router.refresh()
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button type="button" onClick={remove} disabled={busy} className="text-[11px] font-black text-rose-600 hover:text-rose-700">
          {busy ? '…' : 'Confirm?'}
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="text-[11px] font-bold text-slate-400 hover:text-slate-600">
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="flex-shrink-0 text-xs font-bold text-slate-400 hover:text-rose-500 transition-colors"
    >
      Remove
    </button>
  )
}

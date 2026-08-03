'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Clock, Building2, User, Megaphone, Send } from 'lucide-react'
import { confirmResolution, escalatePublish, customerReply } from '../_actions'

export interface CaseData {
  id: string
  type: 'feedback' | 'complaint'
  status: 'open' | 'resolution_offered' | 'resolved' | 'unresolved'
  title: string
  body: string
  category: string | null
  resolution_summary: string | null
  publish_at: string
  created_at: string
  first_company_reply_at: string | null
}

export interface CaseEvent {
  id: string
  author: 'company' | 'customer'
  kind: 'reply' | 'resolution_offer' | 'customer_confirm' | 'customer_decline'
  body: string | null
  created_at: string
}

const STATUS_CHIP: Record<CaseData['status'], { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-amber-500/20 text-amber-300' },
  resolution_offered: { label: 'Resolution offered', cls: 'bg-blue-500/20 text-blue-300' },
  resolved: { label: 'Resolved', cls: 'bg-green-500/20 text-green-300' },
  unresolved: { label: 'Unresolved', cls: 'bg-rose-500/20 text-rose-300' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function hoursUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600000))
}

interface CaseStatusProps {
  token: string
  companyName: string
  companySlug: string
  reviewUrl: string
  caseData: CaseData
  events: CaseEvent[]
}

export function CaseStatus({ token, companyName, companySlug, reviewUrl, caseData, events }: CaseStatusProps) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [declineComment, setDeclineComment] = useState('')
  const [declining, setDeclining] = useState(false)
  const [message, setMessage] = useState('')

  const isComplaint = caseData.type === 'complaint'
  const chip = STATUS_CHIP[caseData.status]
  const unpublished = new Date(caseData.publish_at).getTime() > Date.now()
  const canEscalate =
    isComplaint &&
    unpublished &&
    !caseData.first_company_reply_at &&
    Date.now() - new Date(caseData.created_at).getTime() >= 24 * 3600 * 1000

  async function answer(yes: boolean) {
    setBusy(true)
    const res = await confirmResolution(token, yes ? 'yes' : 'no', yes ? undefined : declineComment)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(yes ? 'Marked as resolved. Thank you!' : 'The company has been notified that the issue remains.')
    router.refresh()
  }

  async function sendMessage() {
    setBusy(true)
    const res = await customerReply(token, message)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success(`Sent. ${companyName} has been notified.`)
    setMessage('')
    router.refresh()
  }

  async function escalate() {
    setBusy(true)
    const res = await escalatePublish(token)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Your complaint is now public.')
    router.refresh()
  }

  // Feedback lane: simple thank-you tracker
  if (!isComplaint) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
        <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <h1 className="text-xl font-black text-white">Feedback received</h1>
        <p className="text-sm text-slate-400 mt-2">
          Your feedback is visible on {companyName}&apos;s Trust Cabbage page. Thank you!
        </p>
        <Link
          href={reviewUrl}
          className="inline-block mt-5 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
        >
          Turn it into a full review
        </Link>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-6 sm:p-8 backdrop-blur">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2">
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${chip.cls}`}>{chip.label}</span>
        {caseData.category && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-300">{caseData.category}</span>
        )}
        {unpublished ? (
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 ml-auto">
            Goes public in {hoursUntil(caseData.publish_at)}h
          </span>
        ) : (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/10 text-slate-400 ml-auto">Public</span>
        )}
      </div>

      <h1 className="text-lg font-black text-white mt-3">{caseData.title}</h1>

      {/* Resolved banner */}
      {caseData.status === 'resolved' && (
        <div className="mt-4 rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3">
          <p className="text-sm text-green-300 font-bold flex items-center gap-2">
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
            Resolved{caseData.resolution_summary ? `: ${caseData.resolution_summary}` : ''}
          </p>
        </div>
      )}

      {/* Thread */}
      <div className="mt-5 space-y-4">
        {/* Original complaint */}
        <div className="flex gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-slate-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 font-bold">You · {fmt(caseData.created_at)}</p>
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{caseData.body}</p>
          </div>
        </div>

        {events.map(e => (
          <div key={e.id} className="flex gap-3">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${e.author === 'company' ? 'bg-violet-500/20' : 'bg-white/10'}`}>
              {e.author === 'company'
                ? <Building2 className="h-4 w-4 text-violet-300" />
                : <User className="h-4 w-4 text-slate-300" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 font-bold">
                {e.author === 'company' ? companyName : 'You'} · {fmt(e.created_at)}
                {e.kind === 'resolution_offer' && <span className="text-blue-300 ml-1">offered a resolution</span>}
                {e.kind === 'customer_confirm' && <span className="text-green-300 ml-1">confirmed resolved</span>}
                {e.kind === 'customer_decline' && <span className="text-rose-300 ml-1">said not resolved</span>}
              </p>
              {e.body && <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{e.body}</p>}
            </div>
          </div>
        ))}

        {caseData.status === 'open' && events.length === 0 && (
          <div className="flex gap-3 items-center text-slate-500 text-sm">
            <Clock className="h-4 w-4 flex-shrink-0" />
            Waiting for {companyName} to respond. We will email you when they do.
          </div>
        )}
      </div>

      {/* Reply composer, open conversations only */}
      {(caseData.status === 'open' || caseData.status === 'resolution_offered') && (
        <div className="mt-5 flex gap-2">
          <Textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={2}
            placeholder={`Reply to ${companyName} (public)`}
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm flex-1"
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={busy || message.trim().length < 2}
            className="self-end rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Resolution confirmation */}
      {caseData.status === 'resolution_offered' && (
        <div className="mt-6 rounded-xl bg-blue-500/10 border border-blue-500/30 p-4">
          <p className="text-sm font-black text-white">Did {companyName} resolve your issue?</p>
          {caseData.resolution_summary && (
            <p className="text-sm text-slate-300 mt-1">They say: &ldquo;{caseData.resolution_summary}&rdquo;</p>
          )}
          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={() => answer(true)}
              disabled={busy}
              className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              Yes, resolved
            </button>
            <button
              type="button"
              onClick={() => setDeclining(v => !v)}
              disabled={busy}
              className="flex-1 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-2.5 text-sm transition-colors disabled:opacity-50"
            >
              No, not resolved
            </button>
          </div>
          {declining && (
            <div className="mt-3">
              <Textarea
                value={declineComment}
                onChange={e => setDeclineComment(e.target.value)}
                rows={2}
                placeholder="What is still unresolved? (optional, shown on the public thread)"
                className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
              />
              <button
                type="button"
                onClick={() => answer(false)}
                disabled={busy}
                className="mt-2 w-full rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black py-2.5 text-sm transition-colors disabled:opacity-50"
              >
                {busy ? 'Sending…' : 'Confirm: not resolved'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Customer-initiated resolution: the company fixed it in reality but
          has not clicked "Offer resolution" yet. Only the customer can close. */}
      {caseData.status === 'open' && (
        <button
          type="button"
          onClick={() => answer(true)}
          disabled={busy}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-300 font-black py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          <CheckCircle className="h-4 w-4" />
          {companyName} resolved it? Mark as resolved
        </button>
      )}

      {/* Escalation valve */}
      {canEscalate && (
        <button
          type="button"
          onClick={escalate}
          disabled={busy}
          className="mt-5 w-full flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-amber-300 font-black py-2.5 text-sm transition-colors disabled:opacity-50"
        >
          <Megaphone className="h-4 w-4" />
          No reply in 24h. Publish my complaint now
        </button>
      )}

      {/* Post-resolution review prompt */}
      {(caseData.status === 'resolved' || caseData.status === 'unresolved') && (
        <Link
          href={reviewUrl}
          className="mt-5 block w-full text-center rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
        >
          Write a review of your overall experience
        </Link>
      )}

      <p className="text-xs text-slate-500 mt-5 text-center">
        This thread is{unpublished ? ' about to be' : ''} publicly visible on{' '}
        <Link href={`/company/${companySlug}`} className="text-violet-300 hover:text-violet-200 font-bold">
          {companyName}&apos;s page
        </Link>. Neither side can edit or delete it.
      </p>
    </div>
  )
}

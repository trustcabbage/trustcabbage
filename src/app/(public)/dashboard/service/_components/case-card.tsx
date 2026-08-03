'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CheckCircle, Building2, User, Send } from 'lucide-react'
import { replyToCase, offerResolution } from '../_actions'

export interface DashCaseEvent {
  id: string
  author: 'company' | 'customer'
  kind: string
  body: string | null
  created_at: string
}

export interface DashCase {
  id: string
  type: 'feedback' | 'complaint'
  category: string | null
  satisfaction: number | null
  title: string
  body: string
  expected_resolution: string | null
  status: string
  resolution_summary: string | null
  customer_display: string
  publish_at: string
  created_at: string
  product_name: string | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  open: { label: 'Open', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  resolution_offered: { label: 'Awaiting customer', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200' },
  unresolved: { label: 'Unresolved', cls: 'bg-rose-50 text-rose-700 border-rose-200' },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function hoursUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600000))
}

export function CaseCard({ kase, events }: { kase: DashCase; events: DashCaseEvent[] }) {
  const router = useRouter()
  const [expanded, setExpanded] = useState(kase.type === 'complaint' && kase.status === 'open')
  const [reply, setReply] = useState('')
  const [resolution, setResolution] = useState('')
  const [showResolve, setShowResolve] = useState(false)
  const [busy, setBusy] = useState(false)

  const isComplaint = kase.type === 'complaint'
  const st = STATUS[kase.status] ?? STATUS.open
  const unpublished = new Date(kase.publish_at).getTime() > Date.now()
  const actionable = isComplaint && (kase.status === 'open' || kase.status === 'resolution_offered')

  async function sendReply() {
    setBusy(true)
    const res = await replyToCase(kase.id, reply)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Reply sent, the customer has been emailed.')
    setReply('')
    router.refresh()
  }

  async function sendResolution() {
    setBusy(true)
    const res = await offerResolution(kase.id, resolution)
    setBusy(false)
    if (!res.ok) { toast.error(res.error); return }
    toast.success('Resolution offered. The customer gets a one-click confirm email.')
    setResolution('')
    setShowResolve(false)
    router.refresh()
  }

  return (
    <div className="rounded-xl bg-white border border-slate-200 p-5">
      {/* Chips row */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {isComplaint ? (
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
        ) : (
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
            Feedback {kase.satisfaction ? `${kase.satisfaction}/5` : ''}
          </span>
        )}
        {kase.category && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{kase.category}</span>}
        {kase.product_name && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{kase.product_name}</span>}
        {isComplaint && unpublished && (
          <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 ml-auto">
            Publishes in {hoursUntil(kase.publish_at)}h
          </span>
        )}
        {isComplaint && !unpublished && (
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-auto inline-flex items-center gap-1">
            <CheckCircle className="h-3 w-3" /> Public
          </span>
        )}
      </div>

      {/* Summary */}
      <button type="button" onClick={() => setExpanded(v => !v)} className="text-left w-full">
        <p className="font-black text-slate-950 text-sm">{kase.title}</p>
        {!expanded && <p className="text-sm text-slate-600 mt-1 line-clamp-2 whitespace-pre-line">{kase.body}</p>}
        <p className="text-xs text-slate-400 mt-1.5">
          {kase.customer_display} · {fmt(kase.created_at)} · {expanded ? 'Click to collapse' : 'Click to expand'}
        </p>
      </button>

      {expanded && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          {/* Thread */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                <User className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400 font-bold">{kase.customer_display} · {fmt(kase.created_at)}</p>
                <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{kase.body}</p>
                {kase.expected_resolution && (
                  <p className="text-xs text-slate-500 mt-2">
                    <span className="font-black">Wants:</span> {kase.expected_resolution}
                  </p>
                )}
              </div>
            </div>

            {events.map(e => (
              <div key={e.id} className="flex gap-3">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${e.author === 'company' ? 'bg-violet-100' : 'bg-slate-100'}`}>
                  {e.author === 'company' ? <Building2 className="h-3.5 w-3.5 text-violet-600" /> : <User className="h-3.5 w-3.5 text-slate-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-slate-400 font-bold">
                    {e.author === 'company' ? 'You' : kase.customer_display} · {fmt(e.created_at)}
                    {e.kind === 'resolution_offer' && <span className="text-blue-600 ml-1">offered a resolution</span>}
                    {e.kind === 'customer_confirm' && <span className="text-green-600 ml-1">confirmed resolved</span>}
                    {e.kind === 'customer_decline' && <span className="text-rose-600 ml-1">said not resolved</span>}
                  </p>
                  {e.body && <p className="text-sm text-slate-700 mt-1 whitespace-pre-line">{e.body}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Composer */}
          {actionable && (
            <div className="mt-5 space-y-3">
              <div className="flex gap-2">
                <Textarea
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  rows={2}
                  placeholder="Reply to the customer (public, emailed to them)"
                  className="border-slate-200 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={sendReply}
                  disabled={busy || reply.trim().length < 5}
                  className="self-end rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  aria-label="Send reply"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {kase.status === 'open' && (
                !showResolve ? (
                  <button
                    type="button"
                    onClick={() => setShowResolve(true)}
                    className="w-full rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 text-green-700 font-black py-2.5 text-sm transition-colors"
                  >
                    Offer resolution
                  </button>
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-3 space-y-2">
                    <p className="text-xs font-black text-green-800">
                      How did you resolve it? One sentence, it becomes the public resolution note once the customer confirms.
                    </p>
                    <Input
                      value={resolution}
                      onChange={e => setResolution(e.target.value)}
                      placeholder="e.g. Replacement shipped on 4 Aug with a prepaid return label"
                      className="border-green-200 bg-white text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={sendResolution}
                        disabled={busy || resolution.trim().length < 10}
                        className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 text-white font-black py-2 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
                      >
                        {busy ? 'Sending…' : 'Send for customer confirmation'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowResolve(false)}
                        className="rounded-xl px-4 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )
              )}

              {kase.status === 'resolution_offered' && (
                <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2">
                  Waiting for the customer to confirm your resolution. You can keep replying meanwhile.
                </p>
              )}
            </div>
          )}

          {kase.status === 'resolved' && kase.resolution_summary && (
            <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
              <p className="text-sm text-green-800 font-bold flex items-center gap-2">
                <CheckCircle className="h-4 w-4 flex-shrink-0" /> Resolved: {kase.resolution_summary}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

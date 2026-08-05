'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { CheckCircle, Building2, User, Send, Inbox, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { replyToCase, offerResolution } from '../_actions'
import { StatusStepper } from './status-stepper'

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
  first_company_reply_at: string | null
  resolution_offered_at: string | null
  resolved_at: string | null
  product_name: string | null
}

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  open: { label: 'Open', cls: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500' },
  resolution_offered: { label: 'Awaiting customer', cls: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500' },
  resolved: { label: 'Resolved', cls: 'bg-green-50 text-green-700 border-green-200', dot: 'bg-green-500' },
  unresolved: { label: 'Unresolved', cls: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500' },
}

type Filter = 'all' | 'open' | 'awaiting' | 'feedback' | 'closed'

function fmt(iso: string) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function timeAgo(iso: string): string {
  const hrs = Math.round((Date.now() - new Date(iso).getTime()) / 3600000)
  if (hrs < 1) return 'just now'
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function hoursUntil(iso: string): number {
  return Math.max(0, Math.round((new Date(iso).getTime() - Date.now()) / 3600000))
}

function matchesFilter(c: DashCase, filter: Filter): boolean {
  if (filter === 'all') return true
  if (filter === 'open') return c.type === 'complaint' && c.status === 'open'
  if (filter === 'awaiting') return c.type === 'complaint' && c.status === 'resolution_offered'
  if (filter === 'feedback') return c.type === 'feedback'
  if (filter === 'closed') return c.type === 'complaint' && (c.status === 'resolved' || c.status === 'unresolved')
  return true
}

// Ticket-manager view of a company's Service Desk: a filterable list on the
// left, a full detail panel (lifecycle stepper + thread + composer) on the
// right. Selection is client-side state; server data is passed in once.
export function ServiceInbox({ cases, eventsByCase, companySlug }: {
  cases: DashCase[]
  eventsByCase: Record<string, DashCaseEvent[]>
  companySlug: string
}) {
  const [filter, setFilter] = useState<Filter>('all')
  const [selectedId, setSelectedId] = useState<string | null>(
    cases.find(c => c.type === 'complaint' && c.status === 'open')?.id ?? cases[0]?.id ?? null
  )
  const [mobileDetail, setMobileDetail] = useState(false)

  const counts = useMemo(() => ({
    all: cases.length,
    open: cases.filter(c => matchesFilter(c, 'open')).length,
    awaiting: cases.filter(c => matchesFilter(c, 'awaiting')).length,
    feedback: cases.filter(c => matchesFilter(c, 'feedback')).length,
    closed: cases.filter(c => matchesFilter(c, 'closed')).length,
  }), [cases])

  const filtered = useMemo(() => cases.filter(c => matchesFilter(c, filter)), [cases, filter])
  const selected = cases.find(c => c.id === selectedId) ?? null

  const TABS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'open', label: 'Open' },
    { key: 'awaiting', label: 'Awaiting' },
    { key: 'feedback', label: 'Feedback' },
    { key: 'closed', label: 'Closed' },
  ]

  function selectCase(id: string) {
    setSelectedId(id)
    setMobileDetail(true)
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
      {/* Filter tabs */}
      <div className="flex items-center gap-1 px-3 pt-3 border-b border-slate-100 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`px-3 py-2 text-xs font-black rounded-t-lg transition-colors whitespace-nowrap ${
              filter === t.key ? 'bg-slate-100 text-slate-950' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.label} <span className="text-slate-400 font-bold">({counts[t.key]})</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] lg:h-[640px]">
        {/* ── List ── */}
        <div className={`border-r border-slate-100 overflow-y-auto ${mobileDetail ? 'hidden lg:block' : ''}`}>
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="h-5 w-5 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400">Nothing in this view.</p>
            </div>
          ) : (
            filtered.map(c => {
              const st = STATUS[c.status] ?? STATUS.open
              const unpublished = c.type === 'complaint' && new Date(c.publish_at).getTime() > Date.now()
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCase(c.id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-slate-50 transition-colors ${
                    selectedId === c.id ? 'bg-teal-50/70 border-l-2 border-l-teal-600' : 'hover:bg-slate-50 border-l-2 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full flex-shrink-0 ${c.type === 'complaint' ? st.dot : 'bg-violet-400'}`} />
                    <p className="font-bold text-slate-950 text-sm truncate flex-1">{c.title}</p>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5 ml-4">
                    {c.customer_display} · {c.category ?? (c.type === 'feedback' ? 'Feedback' : 'General')}
                  </p>
                  <div className="flex items-center justify-between mt-1 ml-4">
                    <span className="text-[10px] text-slate-400">{timeAgo(c.created_at)}</span>
                    {unpublished && (
                      <span className="text-[10px] font-black text-amber-700">{hoursUntil(c.publish_at)}h to publish</span>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>

        {/* ── Detail ── */}
        <div className={`overflow-y-auto ${mobileDetail ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center">
              <Inbox className="h-6 w-6 text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">Select a ticket to view details.</p>
            </div>
          ) : (
            <CaseDetail
              key={selected.id}
              kase={selected}
              events={eventsByCase[selected.id] ?? []}
              companySlug={companySlug}
              onBack={() => setMobileDetail(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

function CaseDetail({ kase, events, companySlug, onBack }: {
  kase: DashCase
  events: DashCaseEvent[]
  companySlug: string
  onBack: () => void
}) {
  const router = useRouter()
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
    <div className="p-5 sm:p-6">
      <button type="button" onClick={onBack} className="lg:hidden text-xs font-black text-slate-400 mb-3">← Back to list</button>

      {/* Header */}
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
          <Link
            href={`/company/${companySlug}/service/${kase.id}`}
            target="_blank"
            className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 ml-auto inline-flex items-center gap-1 hover:bg-slate-200 transition-colors"
          >
            <CheckCircle className="h-3 w-3" /> View public page <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>

      <h2 className="font-black text-slate-950 text-lg">{kase.title}</h2>
      <p className="text-xs text-slate-400 mt-1">{kase.customer_display} · Verified customer · {fmt(kase.created_at)}</p>

      {/* Lifecycle stepper */}
      {isComplaint && (
        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 px-4 py-4">
          <StatusStepper
            createdAt={kase.created_at}
            firstReplyAt={kase.first_company_reply_at}
            offeredAt={kase.resolution_offered_at}
            resolvedAt={kase.resolved_at}
            isUnresolved={kase.status === 'unresolved'}
          />
        </div>
      )}

      {/* Thread */}
      <div className="mt-5 space-y-4">
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
            <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${e.author === 'company' ? 'bg-teal-100' : 'bg-slate-100'}`}>
              {e.author === 'company' ? <Building2 className="h-3.5 w-3.5 text-teal-700" /> : <User className="h-3.5 w-3.5 text-slate-500" />}
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
              className="self-end rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-black px-4 py-2.5 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
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
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle, Clock } from 'lucide-react'
import { submitServiceCase } from '../_actions'

const CATEGORIES = ['Delivery', 'Product quality', 'Refund or return', 'Billing', 'Customer support', 'Other']
const EMOJIS = ['😡', '🙁', '😐', '🙂', '🤩']

interface ResponseFlowProps {
  token: string
  companyName: string
  companySlug: string
  customerName: string
  productName: string | null
  productParam: string | null
}

export function ResponseFlow({ token, companyName, companySlug, customerName, productName, productParam }: ResponseFlowProps) {
  const router = useRouter()
  const [satisfaction, setSatisfaction] = useState(0)
  const [lane, setLane] = useState<'pick' | 'feedback' | 'complaint' | 'done-feedback' | 'done-complaint'>('pick')
  const [submitting, setSubmitting] = useState(false)

  const [feedbackText, setFeedbackText] = useState('')
  const [complaint, setComplaint] = useState({ category: '', title: '', body: '', expected_resolution: '' })

  const reviewUrl = `/company/${companySlug}/write-review?src=service${productParam ? `&product=${encodeURIComponent(productParam)}` : ''}`
  const firstName = customerName.trim().split(/\s+/)[0] || 'there'

  function pickSatisfaction(v: number) {
    setSatisfaction(v)
    setLane(v >= 4 ? 'feedback' : 'complaint')
  }

  async function submit(type: 'feedback' | 'complaint') {
    setSubmitting(true)
    const fd = new FormData()
    fd.set('type', type)
    fd.set('satisfaction', String(satisfaction))
    if (type === 'feedback') {
      fd.set('body', feedbackText)
    } else {
      fd.set('category', complaint.category)
      fd.set('title', complaint.title)
      fd.set('body', complaint.body)
      fd.set('expected_resolution', complaint.expected_resolution)
    }
    const res = await submitServiceCase(token, fd)
    setSubmitting(false)
    if (!res.ok) { toast.error(res.error); return }
    setLane(res.type === 'complaint' ? 'done-complaint' : 'done-feedback')
  }

  // ── Done states ─────────────────────────────────────────────────────────────
  if (lane === 'done-feedback') {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center backdrop-blur">
        <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <h1 className="text-xl font-black text-white">Thank you, {firstName}!</h1>
        <p className="text-sm text-slate-400 mt-2">
          Your feedback is now visible on {companyName}&apos;s Trust Cabbage page.
        </p>
        <button
          type="button"
          onClick={() => router.push(reviewUrl)}
          className="mt-6 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
        >
          Turn it into a full review (2 min)
        </button>
        <p className="text-xs text-slate-500 mt-3">Full reviews count toward {companyName}&apos;s star rating.</p>
      </div>
    )
  }

  if (lane === 'done-complaint') {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur">
        <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-3" />
        <h1 className="text-xl font-black text-white text-center">Complaint submitted</h1>
        <div className="mt-5 space-y-3 text-sm text-slate-300">
          <div className="flex gap-3">
            <Clock className="h-4 w-4 text-violet-300 flex-shrink-0 mt-0.5" />
            <p>{companyName} has been notified and can respond right away.</p>
          </div>
          <div className="flex gap-3">
            <Clock className="h-4 w-4 text-violet-300 flex-shrink-0 mt-0.5" />
            <p>
              Your complaint appears publicly on their Trust Cabbage page within 72 hours, no matter what.
              If they resolve it before then, it publishes already marked as resolved.
            </p>
          </div>
          <div className="flex gap-3">
            <Clock className="h-4 w-4 text-violet-300 flex-shrink-0 mt-0.5" />
            <p>We will email you when {companyName} responds.</p>
          </div>
        </div>
      </div>
    )
  }

  // ── Step 1: satisfaction ────────────────────────────────────────────────────
  if (lane === 'pick' || satisfaction === 0) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur">
        <h1 className="text-xl font-black text-white text-center leading-snug">
          Hi {firstName}, how was your {productName ? <span className="text-violet-300">{productName}</span> : 'experience'} from {companyName}?
        </h1>
        <div className="flex justify-center gap-3 mt-8">
          {EMOJIS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              onClick={() => pickSatisfaction(i + 1)}
              className="h-14 w-14 rounded-2xl bg-white/10 hover:bg-white/20 hover:scale-110 text-2xl transition-all"
              aria-label={`${i + 1} out of 5`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-slate-500 font-bold mt-2 px-1">
          <span>Terrible</span>
          <span>Excellent</span>
        </div>
        <p className="text-xs text-slate-500 text-center mt-8">
          Honest answers only. What you share becomes publicly visible on Trust Cabbage.
        </p>
      </div>
    )
  }

  // ── Happy lane: quick feedback (or jump to full review) ─────────────────────
  if (lane === 'feedback') {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur">
        <h1 className="text-xl font-black text-white">Great to hear! {EMOJIS[satisfaction - 1]}</h1>
        <p className="text-sm text-slate-400 mt-1">Two ways to share it:</p>

        <button
          type="button"
          onClick={() => router.push(reviewUrl)}
          className="mt-5 w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors"
        >
          Write a full review (counts toward their rating)
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-slate-500 font-bold">OR JUST LEAVE QUICK FEEDBACK</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Textarea
          value={feedbackText}
          onChange={e => setFeedbackText(e.target.value)}
          rows={3}
          placeholder={`What did you like about ${companyName}?`}
          className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
        />
        <button
          type="button"
          onClick={() => submit('feedback')}
          disabled={submitting || feedbackText.trim().length < 10}
          className="mt-3 w-full rounded-xl bg-white/10 hover:bg-white/20 text-white font-black py-3 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? 'Submitting…' : 'Submit quick feedback'}
        </button>
        <button
          type="button"
          onClick={() => { setSatisfaction(0); setLane('pick') }}
          className="mt-3 w-full text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          Change my rating
        </button>
      </div>
    )
  }

  // ── Unhappy lane: complaint ─────────────────────────────────────────────────
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-8 backdrop-blur">
      <h1 className="text-xl font-black text-white">Sorry to hear that. Let&apos;s get it fixed.</h1>
      <p className="text-sm text-slate-400 mt-1.5">
        Raise it here and {companyName} gets a chance to resolve it. Your complaint goes public on their page within 72 hours, resolved or not, so it cannot be ignored.
      </p>

      <div className="space-y-4 mt-6">
        <div className="space-y-1.5">
          <Label className="text-xs font-black uppercase tracking-wide text-slate-400">What is it about? <span className="text-red-400">*</span></Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setComplaint(prev => ({ ...prev, category: c }))}
                className={`px-3 py-1.5 rounded-full text-xs font-black transition-colors ${
                  complaint.category === c ? 'bg-[#6d28d9] text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-title" className="text-xs font-black uppercase tracking-wide text-slate-400">Summary <span className="text-red-400">*</span></Label>
          <Input
            id="c-title"
            value={complaint.title}
            onChange={e => setComplaint(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g. Order arrived damaged, no reply from support"
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-body" className="text-xs font-black uppercase tracking-wide text-slate-400">What happened? <span className="text-red-400">*</span></Label>
          <Textarea
            id="c-body"
            value={complaint.body}
            onChange={e => setComplaint(prev => ({ ...prev, body: e.target.value }))}
            rows={4}
            placeholder="Describe the issue with dates and details, it helps them resolve it faster"
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="c-res" className="text-xs font-black uppercase tracking-wide text-slate-400">What would resolve this for you? (optional)</Label>
          <Input
            id="c-res"
            value={complaint.expected_resolution}
            onChange={e => setComplaint(prev => ({ ...prev, expected_resolution: e.target.value }))}
            placeholder="e.g. Replacement, refund, a call back"
            className="bg-white/10 border-white/20 text-white placeholder:text-slate-500 text-sm"
          />
        </div>

        <button
          type="button"
          onClick={() => submit('complaint')}
          disabled={submitting || !complaint.category || complaint.title.trim().length < 5 || complaint.body.trim().length < 10}
          className="w-full rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black py-3 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none"
        >
          {submitting ? 'Submitting…' : 'Submit complaint'}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => { setSatisfaction(0); setLane('pick') }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Change my rating
          </button>
          <button
            type="button"
            onClick={() => router.push(reviewUrl)}
            className="text-xs font-bold text-violet-300 hover:text-violet-200 transition-colors"
          >
            I&apos;d rather just write a public review →
          </button>
        </div>
      </div>
    </div>
  )
}

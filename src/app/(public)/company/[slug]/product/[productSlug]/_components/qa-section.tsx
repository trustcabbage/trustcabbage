'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { MessageCircleQuestion, ShieldCheck, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { askQuestion, answerQuestion, type QaState } from '../_actions'

interface Answer {
  id: string
  body: string
  is_company_answer: boolean
  is_verified_buyer: boolean
  created_at: string
  answerer_name: string
}

interface Question {
  id: string
  body: string
  created_at: string
  asker_name: string
  answers: Answer[]
}

interface QaSectionProps {
  productId: string
  companySlug: string
  productSlug: string
  companyName: string
  questions: Question[]
  isLoggedIn: boolean
  currentPath: string
}

function AnswerBadge({ answer, companyName }: { answer: Answer; companyName: string }) {
  if (answer.is_company_answer) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-[#6d28d9]">
        <ShieldCheck className="h-3 w-3" /> {companyName} · Official
      </span>
    )
  }
  if (answer.is_verified_buyer) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600">
        <CheckCircle className="h-3 w-3" /> {answer.answerer_name} · Verified buyer
      </span>
    )
  }
  return <span className="text-xs font-black text-slate-500">{answer.answerer_name} · Community</span>
}

function AnswerForm({ questionId, productId, companySlug, productSlug, onDone }: {
  questionId: string; productId: string; companySlug: string; productSlug: string; onDone: () => void
}) {
  const [state, action, pending] = useActionState<QaState, FormData>(answerQuestion, undefined)

  if (state?.success) onDone()

  return (
    <form action={action} className="mt-3 space-y-2">
      <input type="hidden" name="question_id" value={questionId} />
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="company_slug" value={companySlug} />
      <input type="hidden" name="product_slug" value={productSlug} />
      {state?.error && (
        <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {state.error}</p>
      )}
      <textarea
        name="body"
        rows={2}
        required
        placeholder="Write your answer…"
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] resize-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-3.5 py-1.5 text-xs transition-colors"
      >
        {pending ? <><Loader2 className="h-3 w-3 animate-spin" /> Posting…</> : 'Post answer'}
      </button>
    </form>
  )
}

export function QaSection({ productId, companySlug, productSlug, companyName, questions, isLoggedIn, currentPath }: QaSectionProps) {
  const [askState, askAction, askPending] = useActionState<QaState, FormData>(askQuestion, undefined)
  const [openAnswerFor, setOpenAnswerFor] = useState<string | null>(null)
  const [justAsked, setJustAsked] = useState(false)

  if (askState?.success && !justAsked) setJustAsked(true)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center gap-2">
        <MessageCircleQuestion className="h-4 w-4 text-[#6d28d9]" />
        <h2 className="font-black text-slate-950 text-sm">
          Questions &amp; Answers {questions.length > 0 ? `(${questions.length})` : ''}
        </h2>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-6">
        {questions.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-4">No questions yet. Be the first to ask.</p>
        ) : (
          questions.map(q => (
            <div key={q.id} className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-[10px] flex-shrink-0">
                  {q.asker_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{q.body}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Asked by {q.asker_name}</p>
                </div>
              </div>

              {q.answers.length > 0 && (
                <div className="ml-10 space-y-2.5">
                  {q.answers.map(a => (
                    <div
                      key={a.id}
                      className={`rounded-xl p-3.5 ${a.is_company_answer ? 'bg-violet-50 border-l-4 border-[#6d28d9]' : 'bg-slate-50'}`}
                    >
                      <AnswerBadge answer={a} companyName={companyName} />
                      <p className="text-sm text-slate-700 leading-relaxed mt-1.5">{a.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="ml-10">
                {openAnswerFor === q.id ? (
                  isLoggedIn ? (
                    <AnswerForm
                      questionId={q.id}
                      productId={productId}
                      companySlug={companySlug}
                      productSlug={productSlug}
                      onDone={() => setOpenAnswerFor(null)}
                    />
                  ) : (
                    <Link href={`/login?next=${encodeURIComponent(currentPath)}`} className="text-xs font-black text-[#6d28d9] hover:underline">
                      Sign in to answer →
                    </Link>
                  )
                ) : (
                  <button
                    onClick={() => setOpenAnswerFor(q.id)}
                    className="text-xs font-black text-slate-400 hover:text-[#6d28d9] transition-colors"
                  >
                    Answer this question
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Ask a question */}
      <div className="px-5 sm:px-6 py-4 border-t border-slate-100">
        {justAsked ? (
          <p className="flex items-center gap-1.5 text-sm text-emerald-700 font-bold">
            <CheckCircle className="h-4 w-4" /> Question posted!
          </p>
        ) : isLoggedIn ? (
          <form action={askAction} className="space-y-2.5">
            <input type="hidden" name="product_id" value={productId} />
            <input type="hidden" name="company_slug" value={companySlug} />
            <input type="hidden" name="product_slug" value={productSlug} />
            {askState?.error && (
              <p className="flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="h-3 w-3" /> {askState.error}</p>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                name="body"
                required
                placeholder="Ask a question about this product…"
                className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9]"
              />
              <button
                type="submit"
                disabled={askPending}
                className="rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-4 py-2.5 text-sm transition-colors flex-shrink-0"
              >
                {askPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ask'}
              </button>
            </div>
          </form>
        ) : (
          <Link
            href={`/login?next=${encodeURIComponent(currentPath)}`}
            className="flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-400 hover:border-[#6d28d9] hover:text-[#6d28d9] transition-colors"
          >
            <MessageCircleQuestion className="h-4 w-4" /> Sign in to ask a question
          </Link>
        )}
      </div>
    </div>
  )
}

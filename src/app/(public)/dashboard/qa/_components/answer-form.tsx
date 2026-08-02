'use client'

import { useActionState } from 'react'
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { answerQuestion, type QaState } from '@/app/(public)/company/[slug]/product/[productSlug]/_actions'

interface AnswerFormProps {
  questionId: string
  productId: string
  companySlug: string
  productSlug: string
}

export function AnswerForm({ questionId, productId, companySlug, productSlug }: AnswerFormProps) {
  const [state, action, pending] = useActionState<QaState, FormData>(answerQuestion, undefined)

  if (state?.success) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-bold text-emerald-700">
        <CheckCircle className="h-3.5 w-3.5" /> Answer posted
      </p>
    )
  }

  return (
    <form action={action} className="space-y-2">
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
        placeholder="Write your official answer…"
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#6d28d9] focus:ring-1 focus:ring-[#6d28d9] resize-none"
      />
      <button
        type="submit"
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-3.5 py-1.5 text-xs transition-colors"
      >
        {pending ? <><Loader2 className="h-3 w-3 animate-spin" /> Posting…</> : 'Post official answer'}
      </button>
    </form>
  )
}

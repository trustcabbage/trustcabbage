'use client'

import { useActionState, useState } from 'react'
import { replyToReview } from '../_actions/reply-to-review'
import { MessageSquareDot, Loader2, CheckCircle, AlertCircle, Pencil } from 'lucide-react'

interface Props {
  reviewId: string
  existingReply?: string | null
}

export function ReplyForm({ reviewId, existingReply }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(replyToReview, undefined)

  if (state?.success && !open) {
    // reply submitted — form stays closed, parent re-renders with new reply via revalidatePath
  }

  return (
    <div className="mt-3">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-xs font-black text-[#6d28d9] hover:text-violet-800 transition-colors"
        >
          <MessageSquareDot className="h-3.5 w-3.5" />
          {existingReply ? 'Edit reply' : 'Reply as company'}
        </button>
      ) : (
        <div className="bg-violet-50 rounded-xl border border-violet-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Pencil className="h-3.5 w-3.5 text-[#6d28d9]" />
            <p className="text-xs font-black text-[#6d28d9]">
              {existingReply ? 'Edit your reply' : 'Reply as company'}
            </p>
            <span className="text-[10px] text-violet-400 ml-auto">Visible publicly · max 2000 chars</span>
          </div>

          {state?.error && (
            <div className="mb-3 flex items-center gap-2 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {state.error}
            </div>
          )}
          {state?.success && (
            <div className="mb-3 flex items-center gap-2 text-xs text-green-700">
              <CheckCircle className="h-3.5 w-3.5 flex-shrink-0" /> Reply published!
            </div>
          )}

          <form action={action} className="space-y-3">
            <input type="hidden" name="review_id" value={reviewId} />
            <textarea
              name="content"
              rows={4}
              defaultValue={existingReply ?? ''}
              placeholder="Thank the reviewer, address their feedback, or share context. Your reply will appear publicly below their review."
              className="w-full rounded-xl border border-violet-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors resize-none"
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={pending}
                className="flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-4 py-2 text-xs transition-colors"
              >
                {pending ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Publishing…</> : 'Publish reply'}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-black text-slate-500 hover:text-slate-700 transition-colors px-2 py-2"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

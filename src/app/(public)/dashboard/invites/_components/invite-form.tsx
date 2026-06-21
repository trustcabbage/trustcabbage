'use client'

import { useActionState, useRef } from 'react'
import { sendInvites, type InviteState } from '../_actions'
import { Send, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export function InviteForm({ monthUsed, monthLimit }: { monthUsed: number; monthLimit: number | null }) {
  const [state, action, pending] = useActionState(sendInvites, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  const sentCount = state?.results?.filter(r => r.status === 'sent').length ?? 0
  const failedCount = state?.results?.filter(r => r.status === 'failed').length ?? 0

  return (
    <div className="space-y-6">
      {/* Usage meter */}
      {monthLimit !== null && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-black text-slate-700">Invites sent this month</span>
            <span className={`font-black ${monthUsed >= monthLimit ? 'text-red-600' : 'text-slate-500'}`}>
              {monthUsed} / {monthLimit}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${monthUsed >= monthLimit ? 'bg-red-500' : 'bg-[#6d28d9]'}`}
              style={{ width: `${Math.min(100, (monthUsed / monthLimit) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {state?.limitError && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" /> {state.limitError}
        </div>
      )}

      <form ref={formRef} action={action} className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-600 mb-1.5">
            Email addresses
          </label>
          <textarea
            name="emails"
            rows={6}
            placeholder={"client1@company.in\nclient2@company.in\nclient3@company.in"}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400 transition-colors font-mono resize-none"
          />
          <p className="text-[10px] text-slate-400 mt-1.5">One email per line — or separate with commas or semicolons</p>
        </div>

        <button
          type="submit"
          disabled={pending}
          className="flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-6 py-3 text-sm transition-colors"
        >
          {pending
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
            : <><Send className="h-4 w-4" /> Send invites</>}
        </button>
      </form>

      {/* Results */}
      {state?.results && state.results.length > 0 && (
        <div className="rounded-xl border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center gap-4">
            <span className="text-xs font-black text-slate-700">Results</span>
            {sentCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-green-700">
                <CheckCircle className="h-3.5 w-3.5" /> {sentCount} sent
              </span>
            )}
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600">
                <XCircle className="h-3.5 w-3.5" /> {failedCount} failed
              </span>
            )}
          </div>
          <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
            {state.results.map(r => (
              <div key={r.email} className="flex items-center gap-3 px-4 py-2.5">
                {r.status === 'sent'
                  ? <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                  : <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />}
                <span className="text-sm text-slate-700 flex-1 font-mono">{r.email}</span>
                {r.error && <span className="text-xs text-red-400">{r.error}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

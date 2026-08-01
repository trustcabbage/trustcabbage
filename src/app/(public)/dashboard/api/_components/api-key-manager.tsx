'use client'

import { useActionState, useState } from 'react'
import { KeyRound, Copy, Check, RotateCw, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { generateApiKey, type GenerateKeyState } from '../_actions'

interface ApiKeyManagerProps {
  keyPrefix: string | null
  keyCreatedAt: string | null
}

export function ApiKeyManager({ keyPrefix, keyCreatedAt }: ApiKeyManagerProps) {
  const [state, formAction, pending] = useActionState<GenerateKeyState, FormData>(generateApiKey, undefined)
  const [copied, setCopied] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const hasKey = !!keyPrefix || !!state?.key
  const createdDate = keyCreatedAt
    ? new Date(keyCreatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  async function copyKey() {
    if (!state?.key) return
    await navigator.clipboard.writeText(state.key)
    setCopied(true)
    toast.success('API key copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Freshly generated key, shown once */}
      {state?.key && (
        <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Check className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-black text-emerald-800">Your new API key. Copy it now.</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-white border border-emerald-200 px-3 py-2.5 text-xs font-mono text-slate-800 break-all select-all">
              {state.key}
            </code>
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-2.5 text-xs transition-colors flex-shrink-0"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-xs text-emerald-700 mt-3 leading-relaxed">
            This is the only time the full key is shown. Store it in your server environment
            (never in frontend code or a public repo). If you lose it, generate a new one.
          </p>
        </div>
      )}

      {state?.error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 font-bold">
          {state.error}
        </div>
      )}

      {/* Current key status */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
              <KeyRound className="h-5 w-5 text-[#6d28d9]" />
            </div>
            <div>
              {hasKey ? (
                <>
                  <p className="text-sm font-black text-slate-900 font-mono">
                    {state?.key ? state.key.slice(0, 15) : keyPrefix}••••••••••••••••
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {state?.key ? 'Created just now' : createdDate ? `Created ${createdDate}` : 'Active'}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-black text-slate-900">No API key yet</p>
                  <p className="text-xs text-slate-400 mt-0.5">Generate one to start using the API</p>
                </>
              )}
            </div>
          </div>

          {!confirming || !hasKey ? (
            <form action={hasKey ? undefined : formAction}>
              <button
                type={hasKey ? 'button' : 'submit'}
                onClick={hasKey ? () => setConfirming(true) : undefined}
                disabled={pending}
                className="flex items-center gap-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2.5 text-xs transition-colors disabled:opacity-40"
              >
                <RotateCw className={`h-3.5 w-3.5 ${pending ? 'animate-spin' : ''}`} />
                {pending ? 'Generating…' : hasKey ? 'Rotate key' : 'Generate API key'}
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <form action={formAction}>
                <button
                  type="submit"
                  disabled={pending}
                  onClick={() => setConfirming(false)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black px-4 py-2.5 text-xs transition-colors disabled:opacity-40"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Yes, rotate
                </button>
              </form>
              <button
                onClick={() => setConfirming(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-black text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        {confirming && hasKey && (
          <p className="text-xs text-rose-600 font-bold mt-3">
            Rotating invalidates your current key immediately. Any integration using the old key stops working.
          </p>
        )}
      </div>
    </div>
  )
}

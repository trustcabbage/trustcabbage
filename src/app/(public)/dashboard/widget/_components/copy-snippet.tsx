'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function CopySnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <pre className="rounded-xl bg-slate-950 px-4 py-4 text-xs font-mono text-slate-200 overflow-x-auto whitespace-pre-wrap break-all">
        {code}
      </pre>
      <button
        onClick={copy}
        className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-black px-2.5 py-1.5 text-[10px] transition-colors"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

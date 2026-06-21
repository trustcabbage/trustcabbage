'use client'

import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'

interface Props {
  companyName: string
  slug: string
  rating: number
  totalReviews: number
  snippet: string
  siteUrl: string
}

function StarDisplay({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} className={`h-4 w-4 ${i <= Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.448a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.448a1 1 0 00-1.175 0l-3.37 2.448c-.784.57-1.838-.197-1.54-1.118l1.286-3.957a1 1 0 00-.364-1.118L2.063 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69L9.049 2.927z" />
        </svg>
      ))}
    </div>
  )
}

export function WidgetPreview({ companyName, slug, rating, totalReviews, snippet, siteUrl }: Props) {
  const [copied, setCopied] = useState(false)

  function copySnippet() {
    navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const profileUrl = `${siteUrl}/company/${slug}`

  return (
    <div className="space-y-6">
      {/* Visual badge preview */}
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Badge preview</p>
        <div className="inline-flex items-center gap-3 bg-white border border-slate-200 rounded-xl shadow-sm px-4 py-3">
          <div className="h-9 w-9 rounded-lg bg-[#1e1b4b] flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-black text-[#a78bfa]">TC</span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Trust Cabbage</p>
            <div className="flex items-center gap-2">
              <StarDisplay value={rating} />
              <span className="text-sm font-black text-slate-950">{rating > 0 ? rating.toFixed(1) : '—'}</span>
              <span className="text-xs text-slate-400">{totalReviews > 0 ? `${totalReviews} reviews` : 'No reviews yet'}</span>
            </div>
          </div>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-[#6d28d9] transition-colors ml-1">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">Live preview — the actual badge on your website will link to your Trust Cabbage page.</p>
      </div>

      {/* Snippet */}
      <div>
        <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Embed code</p>
        <div className="rounded-xl border border-slate-200 bg-slate-950 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-[10px] font-mono text-slate-500">HTML</span>
            <button
              onClick={copySnippet}
              className={`flex items-center gap-1.5 text-xs font-black rounded-lg px-3 py-1.5 transition-colors ${
                copied
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy code</>}
            </button>
          </div>
          <pre className="px-4 py-4 text-xs text-violet-300 font-mono leading-relaxed overflow-x-auto whitespace-pre">
            {snippet}
          </pre>
        </div>
      </div>
    </div>
  )
}

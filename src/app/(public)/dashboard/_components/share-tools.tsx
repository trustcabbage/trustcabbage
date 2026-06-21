'use client'
import { useState } from 'react'
import { Copy, Check, MessageCircle, Link as LinkIcon } from 'lucide-react'

export function ShareTools({ slug, companyName, inviteToken }: { slug: string; companyName: string; inviteToken: string }) {
  const [copied, setCopied] = useState(false)

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrlBase = `${siteUrl}/review/${slug}?ref=${inviteToken}`
  const linkUrl = `${inviteUrlBase}&src=link`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(
    `Hi! We'd love to hear your feedback about ${companyName}. It only takes 3 minutes — please leave us a review here:\n${inviteUrlBase}&src=whatsapp`
  )}`

  async function copyLink() {
    await navigator.clipboard.writeText(linkUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-black text-slate-950 text-sm">Your review link</h2>
        <p className="text-xs text-slate-400 mt-0.5">Share this with clients — reviews from this link are tracked</p>
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* Link display + copy */}
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <LinkIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
          <span className="text-xs text-slate-600 font-mono flex-1 truncate">{linkUrl}</span>
          <button
            onClick={copyLink}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-black transition-colors flex-shrink-0 ${
              copied
                ? 'bg-green-100 text-green-700 border border-green-200'
                : 'bg-[#6d28d9] hover:bg-[#7c3aed] text-white'
            }`}
          >
            {copied ? <><Check className="h-3 w-3" /> Copied!</> : <><Copy className="h-3 w-3" /> Copy</>}
          </button>
        </div>

        {/* WhatsApp share */}
        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 px-4 py-3 transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
            <MessageCircle className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-black text-green-900">Share on WhatsApp</p>
            <p className="text-xs text-green-700">Opens WhatsApp with a pre-written message</p>
          </div>
        </a>
      </div>
    </div>
  )
}

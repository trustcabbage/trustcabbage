'use client'

import { useState, useEffect, useRef } from 'react'
import { Download, Loader2 } from 'lucide-react'

interface Props {
  companyName: string
  slug: string
  inviteUrl: string
}

export function QrCodePreview({ companyName, slug, inviteUrl }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Dynamically import qrcode (browser-safe) to render preview
    import('qrcode').then(QRCode => {
      QRCode.toDataURL(inviteUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      }).then(url => setQrDataUrl(url))
    })
  }, [inviteUrl])

  async function download() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/qrcode/${slug}`)
      if (!res.ok) throw new Error('Failed to generate QR code')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trustcabbage-qr-${slug}.png`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start gap-8">
      {/* QR preview */}
      <div className="flex-shrink-0">
        <div className="rounded-2xl border-2 border-slate-200 p-4 bg-white inline-block">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={`QR code for ${companyName}`} className="h-48 w-48" />
          ) : (
            <div className="h-48 w-48 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-slate-300 animate-spin" />
            </div>
          )}
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-2 max-w-[200px]">
          Scan to reach your review page
        </p>
      </div>

      {/* Info + download */}
      <div className="flex-1">
        <div className="space-y-3 mb-6">
          <div>
            <p className="text-xs font-black text-slate-500 mb-1">Company</p>
            <p className="text-sm font-black text-slate-950">{companyName}</p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 mb-1">Links to</p>
            <p className="text-xs text-slate-600 font-mono break-all">{inviteUrl}</p>
          </div>
          <div>
            <p className="text-xs font-black text-slate-500 mb-1">Download format</p>
            <p className="text-xs text-slate-600">600 × 600 px PNG — print-ready</p>
          </div>
        </div>

        <button
          onClick={download}
          disabled={downloading || !qrDataUrl}
          className="flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-60 text-white font-black px-6 py-3 text-sm transition-colors"
        >
          {downloading
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
            : <><Download className="h-4 w-4" /> Download PNG</>}
        </button>

        <p className="text-[10px] text-slate-400 mt-3">
          The QR code always points to your review invite link. If you regenerate your invite token, you&apos;ll need to re-download the QR code.
        </p>
      </div>

      {/* Hidden canvas (not used but kept for future canvas-based rendering) */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  )
}

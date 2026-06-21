import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { QrCodePreview } from './_components/qrcode-preview'
import { ChevronLeft, QrCode } from 'lucide-react'

export const metadata: Metadata = { title: 'QR code — Dashboard' }

export default async function QrCodePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/qrcode')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id
  const { data: co } = await supabase
    .from('companies').select('name, slug, invite_token').eq('id', companyId).single()

  const company = co as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const inviteUrl = `${siteUrl}/review/${company.slug}?ref=${company.invite_token}&src=qr`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">QR code</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-[#6d28d9]" />
            <h1 className="font-black text-slate-950">Review QR code</h1>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Download your review QR code and place it anywhere — proposals, invoice footers, office reception, visiting cards.
              Clients scan it to land directly on your review form.
            </p>
            <QrCodePreview
              companyName={company.name}
              slug={company.slug}
              inviteUrl={inviteUrl}
            />
          </div>
        </div>

        {/* Use cases */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-black text-slate-950">Where to use it</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 rounded-b-2xl overflow-hidden">
            {[
              { emoji: '📄', title: 'Project proposals', body: 'Add at the bottom of your proposals so prospects can verify your reputation before signing.' },
              { emoji: '🧾', title: 'Invoice footers', body: 'After project delivery, add to your invoice. Ask happy clients to scan and share feedback.' },
              { emoji: '🏢', title: 'Office reception', body: 'Print and frame it at your reception desk. Visiting clients can review you on the spot.' },
              { emoji: '💼', title: 'Visiting cards', body: 'Add to the back of visiting cards with a line like "See our client reviews →".' },
            ].map(u => (
              <div key={u.title} className="bg-white px-5 py-4">
                <span className="text-xl mb-2 block">{u.emoji}</span>
                <p className="text-sm font-black text-slate-950 mb-1">{u.title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{u.body}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}

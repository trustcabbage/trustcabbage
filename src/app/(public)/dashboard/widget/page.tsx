import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { WidgetPreview } from './_components/widget-preview'
import { ChevronLeft, Code2 } from 'lucide-react'

export const metadata: Metadata = { title: 'Website widget — Dashboard' }

export default async function WidgetPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/widget')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const companyId = (profile as any).company_id

  const { data: co } = await supabase
    .from('companies')
    .select('name, slug, average_rating, total_reviews')
    .eq('id', companyId)
    .single()

  const company = co as any

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const widgetUrl = `${siteUrl}/api/widget/${company.slug}` // widget badge links to company page, not invite URL
  const snippetSrc = `${widgetUrl}.js`

  const snippet = `<!-- Trust Cabbage widget -->
<script src="${snippetSrc}" async></script>`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">Website widget</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[#6d28d9]" />
            <h1 className="font-black text-slate-950">Website widget</h1>
          </div>
          <div className="px-6 py-6">
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Add a Trust Cabbage rating badge to your website. It auto-updates as new reviews come in — no code changes needed.
            </p>
            <WidgetPreview
              companyName={company.name}
              slug={company.slug}
              rating={company.average_rating ?? 0}
              totalReviews={company.total_reviews ?? 0}
              snippet={snippet}
              siteUrl={siteUrl}
            />
          </div>
        </div>

        {/* How to install */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="font-black text-slate-950">How to install</h2>
          </div>
          <ol className="px-6 py-5 space-y-4 list-none">
            {[
              { step: '1', title: 'Copy the snippet', body: 'Click "Copy code" on the snippet above.' },
              { step: '2', title: 'Paste before </body>', body: 'Open your website HTML and paste the snippet just before the closing </body> tag.' },
              { step: '3', title: 'It auto-updates', body: 'The badge pulls your latest rating from Trust Cabbage every time the page loads. No re-deployment needed when you get new reviews.' },
            ].map(s => (
              <li key={s.step} className="flex items-start gap-4">
                <div className="h-7 w-7 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0 font-black text-[#6d28d9] text-xs">{s.step}</div>
                <div>
                  <p className="text-sm font-black text-slate-950">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

      </div>
    </div>
  )
}

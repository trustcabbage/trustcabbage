import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ApiKeyManager } from './_components/api-key-manager'
import { ChevronLeft, Terminal, Mail, ShieldCheck, Code2, ArrowRight, ListOrdered } from 'lucide-react'

export const metadata: Metadata = { title: 'Product Reviews API | Dashboard' }

export default async function ApiDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/api')

  const { data: profile } = await supabase
    .from('users').select('role, company_id').eq('id', user.id).single()

  if (!profile || (profile as any).role !== 'company_admin' || !(profile as any).company_id) redirect('/')

  const { data: co } = await supabase
    .from('companies')
    .select('name, slug, api_key_prefix, api_key_created_at')
    .eq('id', (profile as any).company_id)
    .single()

  const company = co as any
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://trustcabbage.com'
  const productWidgetSrc = `${siteUrl}/api/widget/product/${company.slug}.js`

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-1.5 text-xs font-black text-slate-500 hover:text-[#6d28d9] transition-colors">
            <ChevronLeft className="h-3.5 w-3.5" /> Dashboard
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-black text-slate-950">Product Reviews API</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* API key */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#6d28d9]" />
            <h1 className="font-black text-slate-950">Product Reviews API</h1>
            <span className="ml-auto rounded-full bg-violet-100 text-violet-700 border border-violet-200 px-2.5 py-0.5 text-[10px] font-black">
              Early access · Free
            </span>
          </div>
          <div className="px-6 py-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              Collect and display reviews for individual products you sell. Looking for a
              company-level review invite instead (no specific product), triggered from your
              backend? See{' '}
              <Link href="/dashboard/invites" className="text-[#6d28d9] font-bold hover:underline">Email invites</Link>,
              the same key below works there too. This key also doesn&apos;t apply to your rating
              badge, QR code, or invite link, find those under{' '}
              <Link href="/dashboard/widget" className="text-[#6d28d9] font-bold hover:underline">Website widget</Link>.
              Keep the key secret: use it only from your server, never in browser or app code.
            </p>
            <ApiKeyManager
              keyPrefix={company.api_key_prefix ?? null}
              keyCreatedAt={company.api_key_created_at ?? null}
            />
          </div>
        </div>

        {/* Step-by-step walkthrough */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <ListOrdered className="h-4 w-4 text-[#6d28d9]" />
            <h2 className="font-black text-slate-950">How it fits together</h2>
          </div>
          <div className="px-6 py-6 space-y-6">
            {[
              {
                n: '1',
                title: 'Generate your API key',
                body: <>Done above. Keep it on your server, it&apos;s used to authenticate every call below.</>,
              },
              {
                n: '2',
                title: 'Register each product, once',
                body: (
                  <>
                    <p>
                      There is no separate &quot;create product&quot; call, calling{' '}
                      <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">POST /api/review-invite</code> the{' '}
                      <strong>first time</strong> for a given <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">product_id</code> registers
                      it inside Trust Cabbage. What happens next depends on whether you include{' '}
                      <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">customer_email</code>:
                    </p>
                    <ul className="mt-2 space-y-1.5 list-disc list-inside">
                      <li><strong>Include it</strong>, and we also send that customer our branded review-invite email. Good if you want us to handle sending.</li>
                      <li><strong>Omit it</strong>, and we only register the product, no email is sent, no customer data is shared with us at all. Good if you plan to send your own email and don&apos;t want to hand us any customer email addresses.</li>
                    </ul>
                    <p className="mt-2">
                      Either way, one call per product is enough. There is nothing to &quot;set up&quot; beyond this.
                    </p>
                  </>
                ),
              },
              {
                n: '3',
                title: 'From then on, that product works everywhere',
                body: (
                  <>
                    <p>Once step 2 has run once for a <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">product_id</code>, all of these work for it, in any combination:</p>
                    <ul className="mt-2 space-y-1.5 list-disc list-inside">
                      <li>Keep calling the API (with or without an email) for future customers, see <a href="#invite-endpoint" className="text-[#6d28d9] font-bold hover:underline">endpoint docs below</a></li>
                      <li>Embed the widget on your order/product pages, see <a href="#widget" className="text-[#6d28d9] font-bold hover:underline">widget docs below</a></li>
                      <li>Send your own email with a direct link, using the same <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">product_id</code>, no customer data ever touches Trust Cabbage this way</li>
                    </ul>
                  </>
                ),
              },
            ].map(s => (
              <div key={s.n} className="flex gap-4">
                <div className="h-7 w-7 rounded-full bg-[#6d28d9] text-white flex items-center justify-center flex-shrink-0 font-black text-xs">
                  {s.n}
                </div>
                <div className="text-sm text-slate-600 leading-relaxed">
                  <p className="font-black text-slate-950 mb-1">{s.title}</p>
                  {s.body}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoint docs */}
        <div id="invite-endpoint" className="bg-white rounded-2xl border border-slate-200 shadow-sm scroll-mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Mail className="h-4 w-4 text-[#6d28d9]" />
            <h2 className="font-black text-slate-950">Send a review invite</h2>
          </div>
          <div className="px-6 py-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              One endpoint, two ways to call it, see step 2 above. <code className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">customer_email</code> is
              the only thing that changes.
            </p>

            <div>
              <p className="text-xs font-black text-slate-700 mb-2">A. With an email — we send the invite</p>
              <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <p><span className="text-amber-300">POST</span> <span className="text-emerald-300">{siteUrl}/api/review-invite</span></p>
                <p className="text-slate-500 mt-2">{'// Headers'}</p>
                <p><span className="text-violet-300">Authorization:</span> <span className="text-slate-300">Bearer tc_live_your_key</span></p>
                <p><span className="text-violet-300">Content-Type:</span> <span className="text-slate-300">application/json</span></p>
                <p className="text-slate-500 mt-2">{'// Body'}</p>
                <p className="text-slate-300">{'{'}</p>
                <p className="pl-3"><span className="text-sky-300">&quot;customer_email&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;priya@example.com&quot;</span><span className="text-slate-400">,</span></p>
                <p className="pl-3"><span className="text-sky-300">&quot;product_id&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;SKU-1042&quot;</span><span className="text-slate-400">,</span></p>
                <p className="pl-3"><span className="text-sky-300">&quot;product_name&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;Vitamin C Face Serum&quot;</span><span className="text-slate-400">,</span></p>
                <p className="pl-3"><span className="text-sky-300">&quot;order_id&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;ORD-9234&quot;</span></p>
                <p className="text-slate-300">{'}'}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">Response: <code className="font-mono bg-slate-100 rounded px-1 py-0.5">{'{ "status": "sent" }'}</code></p>
            </div>

            <div>
              <p className="text-xs font-black text-slate-700 mb-2">B. Without an email — register only, nothing shared</p>
              <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <p><span className="text-amber-300">POST</span> <span className="text-emerald-300">{siteUrl}/api/review-invite</span></p>
                <p className="text-slate-500 mt-2">{'// Headers same as above'}</p>
                <p className="text-slate-500 mt-2">{'// Body'}</p>
                <p className="text-slate-300">{'{'}</p>
                <p className="pl-3"><span className="text-sky-300">&quot;product_id&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;SKU-1042&quot;</span><span className="text-slate-400">,</span></p>
                <p className="pl-3"><span className="text-sky-300">&quot;product_name&quot;</span><span className="text-slate-400">: </span><span className="text-emerald-300">&quot;Vitamin C Face Serum&quot;</span></p>
                <p className="text-slate-300">{'}'}</p>
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Response: <code className="font-mono bg-slate-100 rounded px-1 py-0.5">{'{ "status": "registered", "write_review_url": "…" }'}</code>{' '}
                — that URL is what you&apos;d put in your own email.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Field</th>
                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Required</th>
                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['product_id', 'Yes', 'Your own SKU or product ID, any string. Registers the product on first use.'],
                    ['customer_email', 'Optional', 'Include it and we send our invite email. Omit it to only register the product, no customer data shared.'],
                    ['product_name', 'First time only', 'Used as the display name when the product is registered'],
                    ['order_id', 'Recommended with an email', 'Deduplicates: the same order + email is never invited twice'],
                  ].map(([field, req, notes]) => (
                    <tr key={field}>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700">{field}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{req}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 leading-relaxed">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wide text-slate-400 mb-2">Responses</p>
              <ul className="space-y-1.5 text-xs text-slate-600">
                <li><code className="font-mono bg-emerald-50 text-emerald-700 rounded px-1.5 py-0.5 font-bold">200</code> <span className="ml-1">{'{ "status": "sent" }'}, {'{ "status": "registered" }'}, or {'{ "status": "already_sent" }'} (deduplicated)</span></li>
                <li><code className="font-mono bg-rose-50 text-rose-700 rounded px-1.5 py-0.5 font-bold">401</code> <span className="ml-1">Missing or invalid API key</span></li>
                <li><code className="font-mono bg-rose-50 text-rose-700 rounded px-1.5 py-0.5 font-bold">400</code> <span className="ml-1">Missing product_id, or customer_email is present but invalid</span></li>
                <li><code className="font-mono bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 font-bold">429</code> <span className="ml-1">Daily invite limit reached (500/day during early access, only applies when sending an email)</span></li>
              </ul>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5">
              <p className="text-xs font-black text-slate-700 mb-1">Sending your own email?</p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Use call B above, no customer email is ever sent to us. Then send your own email
                using the <code className="font-mono bg-white rounded px-1 py-0.5">write_review_url</code> from the response, or build it yourself:{' '}
                <code className="font-mono bg-white rounded px-1 py-0.5 break-all">
                  {siteUrl}/company/{'{your-slug}'}/write-review?product={'{your-sku}'}&amp;src=email
                </code>
              </p>
            </div>
          </div>
        </div>

        {/* Widget docs */}
        <div id="widget" className="bg-white rounded-2xl border border-slate-200 shadow-sm scroll-mt-6">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-2">
            <Code2 className="h-4 w-4 text-[#6d28d9]" />
            <h2 className="font-black text-slate-950">Product widget</h2>
            <span className="ml-auto rounded-full bg-slate-100 text-slate-500 border border-slate-200 px-2.5 py-0.5 text-[10px] font-black">
              No API key needed
            </span>
          </div>
          <div className="px-6 py-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed">
              The API above sends an email. If you&apos;d rather collect and display reviews{' '}
              <strong>directly on your own site</strong>, without email, embed this script instead.
              It doesn&apos;t use your API key (nothing secret is exposed in page source), it&apos;s
              scoped to your company by URL, like the rating badge widget.
            </p>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Collect, on your order confirmation page</p>
              <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <p><span className="text-sky-300">{'<script'}</span></p>
                <p className="pl-3"><span className="text-violet-300">src</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;{productWidgetSrc}&quot;</span></p>
                <p className="pl-3"><span className="text-violet-300">data-product-id</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;SKU-1042&quot;</span></p>
                <p className="pl-3"><span className="text-violet-300">data-mode</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;collect&quot;</span></p>
                <p><span className="text-sky-300">{'></script>'}</span></p>
              </div>
              <p className="text-xs text-slate-400">Renders an inline review form in place of the script tag. No popup, no redirect.</p>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-wide text-slate-400">Display, on your product page</p>
              <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto">
                <p><span className="text-sky-300">{'<script'}</span></p>
                <p className="pl-3"><span className="text-violet-300">src</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;{productWidgetSrc}&quot;</span></p>
                <p className="pl-3"><span className="text-violet-300">data-product-id</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;SKU-1042&quot;</span></p>
                <p className="pl-3"><span className="text-violet-300">data-mode</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;display&quot;</span></p>
                <p><span className="text-sky-300">{'></script>'}</span></p>
              </div>
              <p className="text-xs text-slate-400">Fetches and renders that product&apos;s rating, review excerpts, and Q&amp;A as plain HTML.</p>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Attribute</th>
                    <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    ['data-product-id', 'Same SKU you use in the API. Same product ID in both snippets links collect and display together.'],
                    ['data-mode', '"collect" or "display". Defaults to "display" if omitted.'],
                  ].map(([field, notes]) => (
                    <tr key={field}>
                      <td className="px-4 py-3 text-xs font-mono font-bold text-slate-700">{field}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 leading-relaxed">{notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3.5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Works once step 2 above has registered the <code className="font-mono bg-white rounded px-1 py-0.5">data-product-id</code> you use here.
                Call B (no email) works fine for this, the widget doesn&apos;t need us to have an email on file.
              </p>
            </div>

            <Link
              href="/dashboard/widget"
              className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-[#6d28d9] hover:bg-violet-50/50 transition-colors group"
            >
              <span className="text-sm font-black text-slate-700 group-hover:text-[#6d28d9]">
                Copy your ready-made snippets from the Widget page
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-[#6d28d9] flex-shrink-0" />
            </Link>
          </div>
        </div>

        {/* Security note */}
        <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-4 flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-[#6d28d9] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-900">Security:</span> we store only a hash of your key,
            so it can never be recovered, only rotated. Invites include a mandatory footer identifying
            your company as the sender, and every send is logged and visible to you.
          </p>
        </div>

      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Code2, QrCode, Link2, Mail, CheckCircle, ArrowRight,
  MousePointerClick, Printer, Wrench, ListChecks,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Widget & QR Integration Guide | Trust Cabbage',
  description:
    'Step-by-step guide to installing the Trust Cabbage review widget on your website, downloading your QR code, and using invite links. Live rating badge, popup review form, one line of code.',
}

const NAV = [
  { id: 'widget', label: 'Website widget', icon: Code2 },
  { id: 'qrcode', label: 'QR code', icon: QrCode },
  { id: 'invite-link', label: 'Invite link', icon: Link2 },
  { id: 'email-invites', label: 'Email invites', icon: Mail },
  { id: 'which-tool', label: 'Which tool?', icon: ListChecks },
]

const PLACEMENTS = [
  { place: 'Site footer', how: 'Inside your footer template, next to your social links' },
  { place: 'Homepage hero', how: 'Below your main headline / CTA' },
  { place: 'Contact or About page', how: 'Near your address and contact details' },
  { place: 'Order confirmation page', how: 'Below the "thank you" message (best for collecting reviews)' },
]

const PLATFORMS = [
  { name: 'WordPress', how: 'Appearance → Widgets → add a "Custom HTML" block where you want the badge, paste the snippet. Or use a footer-code plugin.' },
  { name: 'Shopify', how: 'Online Store → Themes → Edit code → open theme.liquid (for site-wide footer) or the specific template, paste the snippet where you want the badge.' },
  { name: 'Wix', how: 'Add → Embed Code → Embed HTML, paste the snippet in the HTML box, position the frame.' },
  { name: 'Webflow', how: 'Add an Embed element where you want the badge, paste the snippet.' },
  { name: 'Google Tag Manager', how: 'Create a Custom HTML tag with the snippet, trigger on the pages you want. Note: with GTM the badge appears where GTM injects it (end of body), so direct HTML placement is preferred for positioning control.' },
]

const BEHAVIOUR = [
  'The badge auto-updates: rating and review count are fetched fresh (cached up to 1 hour). You never need to touch the snippet again.',
  'Reviews submitted through the widget are tagged with source "widget", so dashboard analytics shows how many reviews the widget brings in.',
  'The reviewer verifies with an email OTP inside the popup, so widget reviews are authenticated like all other Trust Cabbage reviews.',
  'The snippet is async and ~4 KB. It does not slow your page down.',
  'Multiple badges on one page are fine (e.g. header and footer).',
]

const TROUBLESHOOTING = [
  { problem: 'Badge doesn’t appear', fix: 'Check the slug in the src URL matches your dashboard exactly. Open the browser console: if it says "company not found", the slug is wrong.' },
  { problem: 'Badge shows a dash instead of a rating', fix: 'You have no published reviews yet. The rating appears automatically after your first review.' },
  { problem: 'Popup doesn’t open', fix: 'Make sure no other script intercepts clicks on the badge container (its id starts with "tc-widget-").' },
  { problem: 'Badge appears at the bottom of the page', fix: 'The badge renders at the script tag’s position. Move the script tag; avoid GTM if you need precise placement.' },
]

const QR_PLACEMENTS = [
  { place: 'Invoice footers', why: 'The client just received the deliverable, the moment of proof' },
  { place: 'Proposal / pitch deck last slide', why: 'Prospects scan and read your reviews on the spot' },
  { place: 'Office / store reception', why: 'Walk-in clients and visitors' },
  { place: 'Product packaging inserts', why: 'For retail and D2C: reviews at the unboxing moment' },
  { place: 'Event standees and visiting cards', why: 'Turns every offline touchpoint into a review channel' },
  { place: 'WhatsApp business catalog images', why: 'Works digitally too, any screen can be scanned' },
]

const PRINT_TIPS = [
  'Minimum print size: 2 cm × 2 cm (the QR uses high error correction, level H)',
  'Keep the white margin around the code, it is part of the file. Don’t crop it.',
  'Don’t recolor the code, contrast is what makes it scannable',
  'Add a caption near it: "Scan to review us on Trust Cabbage". People scan more when told why.',
]

const WHICH_TOOL = [
  { situation: 'You have a website with traffic', tool: 'Widget (order / thank-you page placement converts best)' },
  { situation: 'You send invoices or proposals', tool: 'QR code in the footer' },
  { situation: 'You have a physical location', tool: 'QR code at reception + on printed material' },
  { situation: 'You talk to clients on WhatsApp', tool: 'Invite link via WhatsApp share' },
  { situation: 'You have a client email list', tool: 'Email invites' },
  { situation: 'All of the above', tool: 'Use all of them. Each tags its source, so analytics shows what works.' },
]

function SectionCard({ id, icon: Icon, title, badge, children }: {
  id: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="bg-white rounded-2xl border border-slate-200 shadow-sm scroll-mt-20">
      <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4.5 w-4.5 text-[#6d28d9]" />
        </div>
        <h2 className="text-lg font-black text-slate-950">{title}</h2>
        {badge && (
          <span className="ml-auto rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-black">
            {badge}
          </span>
        )}
      </div>
      <div className="px-6 sm:px-8 py-6 space-y-6">
        {children}
      </div>
    </section>
  )
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-black text-slate-950 mb-3">{children}</h3>
}

function DocTable({ headers, rows }: { headers: [string, string]; rows: Array<[string, string]> }) {
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400 min-w-[140px]">{headers[0]}</th>
              <th className="text-left px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-400">{headers[1]}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map(([a, b]) => (
              <tr key={a}>
                <td className="px-4 py-3 text-xs font-black text-slate-700 align-top">{a}</td>
                <td className="px-4 py-3 text-xs text-slate-500 leading-relaxed">{b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Hero */}
      <section className="bg-[#1e1b4b] pt-12 pb-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="text-xs text-slate-500 mb-4">
            <Link href="/for-businesses" className="hover:text-[#a78bfa] transition-colors">For Businesses</Link>
            <span className="mx-2">/</span>
            <span className="text-slate-300">Integration guide</span>
          </nav>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-3">
            Widget & QR integration guide
          </h1>
          <p className="text-violet-200/60 text-sm sm:text-base max-w-2xl leading-relaxed">
            Everything you need to start collecting reviews with the website widget, QR code,
            invite link, and email invites. All four tools are live and free during early access.
          </p>

          {/* Section nav */}
          <div className="flex flex-wrap gap-2 mt-7">
            {NAV.map(n => (
              <a
                key={n.id}
                href={`#${n.id}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/8 border border-white/15 text-violet-200 hover:bg-white/15 hover:text-white px-3.5 py-1.5 text-xs font-bold transition-colors"
              >
                <n.icon className="h-3 w-3" /> {n.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Prerequisite note */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-5">
        <div className="rounded-xl bg-violet-50 border border-violet-200 px-5 py-3.5 flex items-start gap-3">
          <CheckCircle className="h-4 w-4 text-[#6d28d9] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600 leading-relaxed">
            <span className="font-black text-slate-900">Prerequisite:</span> your company page must be claimed.
            Not claimed yet?{' '}
            <Link href="/for-businesses/add" className="text-[#6d28d9] font-bold hover:underline">
              Search and claim your company →
            </Link>
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── 1. Widget ── */}
        <SectionCard id="widget" icon={Code2} title="Website widget" badge="Live now">
          <div>
            <p className="text-sm text-slate-600 leading-relaxed">
              A small rating badge for your website. It shows your live Trust Cabbage star rating
              and review count. When a visitor clicks it, a popup opens with your review form right
              there on your site, like a Calendly popup. Visitors write a review without leaving your page.
              The popup closes automatically when the review is submitted.
            </p>
          </div>

          {/* Badge mock */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 flex justify-center">
            <div className="inline-flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shadow-sm">
              <div className="h-8 w-8 rounded-lg bg-[#1e1b4b] flex items-center justify-center flex-shrink-0">
                <span className="text-[#a78bfa] font-black text-[8px] tracking-wide">TC</span>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Trust Cabbage</p>
                <div className="flex items-center gap-1">
                  <span className="text-amber-400 text-xs tracking-tight">★★★★★</span>
                  <span className="text-xs font-black text-slate-950">4.6</span>
                  <span className="text-[10px] text-slate-400">32 reviews</span>
                </div>
              </div>
              <div className="w-px h-7 bg-slate-100 mx-0.5" />
              <span className="rounded-lg bg-[#6d28d9] text-white text-[10px] font-black px-2.5 py-1.5 whitespace-nowrap">Write a review</span>
            </div>
          </div>

          <div>
            <SubHeading>Install in 3 steps</SubHeading>
            <ol className="space-y-3">
              {[
                { n: '1', text: <>Log in to your <Link href="/dashboard/widget" className="text-[#6d28d9] font-bold hover:underline">dashboard → Website widget</Link> and copy your snippet:</> },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 font-black text-[#6d28d9] text-xs">{s.n}</div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{s.text}</p>
                </li>
              ))}
            </ol>
            <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs leading-relaxed overflow-x-auto my-3 ml-9">
              <p className="text-slate-500">{'<!-- Trust Cabbage widget -->'}</p>
              <p>
                <span className="text-sky-300">{'<script '}</span>
                <span className="text-violet-300">src</span>
                <span className="text-slate-400">=</span>
                <span className="text-emerald-300">&quot;https://trustcabbage.com/api/widget/your-company-slug.js&quot;</span>
                <span className="text-violet-300"> async</span>
                <span className="text-sky-300">{'></script>'}</span>
              </p>
            </div>
            <ol className="space-y-3">
              {[
                { n: '2', text: 'Paste it into your website’s HTML wherever you want the badge to appear. The badge renders exactly where the script tag is placed.' },
                { n: '3', text: 'Done. The badge pulls your latest rating automatically, no re-deployment needed when new reviews come in.' },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 font-black text-[#6d28d9] text-xs">{s.n}</div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SubHeading>Recommended placements</SubHeading>
            <DocTable headers={['Placement', 'Where to paste']} rows={PLACEMENTS.map(p => [p.place, p.how])} />
          </div>

          <div>
            <SubHeading>Platform-specific instructions</SubHeading>
            <DocTable headers={['Platform', 'How']} rows={PLATFORMS.map(p => [p.name, p.how])} />
          </div>

          <div>
            <SubHeading>Behaviour notes</SubHeading>
            <ul className="space-y-2">
              {BEHAVIOUR.map(b => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-slate-400" />
              <SubHeading>Troubleshooting</SubHeading>
            </div>
            <DocTable headers={['Problem', 'Fix']} rows={TROUBLESHOOTING.map(t => [t.problem, t.fix])} />
          </div>
        </SectionCard>

        {/* ── 2. QR code ── */}
        <SectionCard id="qrcode" icon={QrCode} title="QR code" badge="Live now">
          <p className="text-sm text-slate-600 leading-relaxed">
            A downloadable, print-ready QR code (600×600 PNG with high error correction, so it scans
            even when printed small). Scanning it takes the person straight to your review form,
            with the review automatically tagged as source &quot;QR&quot; in your analytics.
          </p>

          <div>
            <SubHeading>How to get it</SubHeading>
            <ol className="space-y-3">
              {[
                { n: '1', text: <>Log in to your <Link href="/dashboard/qrcode" className="text-[#6d28d9] font-bold hover:underline">dashboard → QR code</Link>.</> },
                { n: '2', text: 'Click download. You get a print-ready PNG named after your company. Only the claimed company admin can download it.' },
              ].map(s => (
                <li key={s.n} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0 font-black text-[#6d28d9] text-xs">{s.n}</div>
                  <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>

          <div>
            <SubHeading>Where to use it</SubHeading>
            <DocTable headers={['Placement', 'Why it works']} rows={QR_PLACEMENTS.map(q => [q.place, q.why])} />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <Printer className="h-4 w-4 text-slate-400" />
              <SubHeading>Print guidance</SubHeading>
            </div>
            <ul className="space-y-2">
              {PRINT_TIPS.map(t => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>

        {/* ── 3. Invite link ── */}
        <SectionCard id="invite-link" icon={Link2} title="Review invite link" badge="Live now">
          <p className="text-sm text-slate-600 leading-relaxed">
            The simplest tool: a unique link shown in your dashboard under <span className="font-bold">Share tools</span>.
            Send it anywhere: WhatsApp, email signature, SMS, client onboarding docs. It lands the
            client directly on your review form. Reviews via this link are tagged as source &quot;invite link&quot;.
          </p>
          <div className="rounded-xl bg-slate-950 px-5 py-4 font-mono text-xs overflow-x-auto">
            <span className="text-emerald-300">https://trustcabbage.com/review/your-company-slug?ref=YOUR_TOKEN</span>
          </div>
          <div className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed">
            <MousePointerClick className="h-4 w-4 text-[#6d28d9] flex-shrink-0 mt-0.5" />
            <p>
              The dashboard also has a one-click <span className="font-bold">WhatsApp share</span> button
              that opens WhatsApp with a pre-written message containing your link.
            </p>
          </div>
        </SectionCard>

        {/* ── 4. Email invites ── */}
        <SectionCard id="email-invites" icon={Mail} title="Email invites" badge="Live now">
          <p className="text-sm text-slate-600 leading-relaxed">
            From <Link href="/dashboard/invites" className="text-[#6d28d9] font-bold hover:underline">dashboard → Email invites</Link>,
            enter a client&apos;s email and we send a branded review invitation on your behalf.
            100 invites per month on the free tier during early access. Every invite is logged,
            so you can see what was sent and when.
          </p>
        </SectionCard>

        {/* ── 5. Which tool ── */}
        <SectionCard id="which-tool" icon={ListChecks} title="Which tool should I use?">
          <DocTable headers={['Your situation', 'Best tool']} rows={WHICH_TOOL.map(w => [w.situation, w.tool])} />
        </SectionCard>

        {/* CTA */}
        <div className="rounded-2xl bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#7c3aed] p-8 text-center">
          <h2 className="text-xl font-black text-white mb-2">Ready to start collecting?</h2>
          <p className="text-violet-200/70 text-sm mb-6">All tools are in your dashboard, free during early access.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#6d28d9] font-black px-6 py-3 text-sm hover:bg-violet-50 transition-colors"
            >
              Open my dashboard <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/for-businesses/add"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 text-white font-black px-6 py-3 text-sm hover:bg-white/10 transition-colors"
            >
              Claim my company first
            </Link>
          </div>
          <p className="text-xs text-violet-200/50 mt-5">Questions? hello@trustcabbage.com</p>
        </div>

      </div>
    </div>
  )
}

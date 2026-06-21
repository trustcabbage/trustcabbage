import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Search, PenLine, Star, Link2, Mail, Code2, QrCode, ShieldCheck, X, ArrowRight, Zap, BarChart3, MessageSquareDot } from 'lucide-react'

export const metadata: Metadata = {
  title: 'For Businesses — Trust Cabbage',
  description: 'List your B2B company on Trust Cabbage or claim your existing page. Collect verified reviews, respond publicly, and get found by buyers. Free forever.',
}

const PAGE_CARDS = [
  {
    num: '01',
    title: 'Your profile',
    body: 'Company name, logo, description, founding year, team size, location, GST-verified badge, and all categories you operate in.',
    color: 'from-violet-500 to-violet-700',
    light: 'bg-violet-50 border-violet-100',
    text: 'text-violet-700',
  },
  {
    num: '02',
    title: 'Your services',
    body: 'List exactly what you offer. Buyers can filter reviews by specific service — so only the most relevant reviews surface.',
    color: 'from-sky-500 to-blue-600',
    light: 'bg-sky-50 border-sky-100',
    text: 'text-sky-700',
  },
  {
    num: '03',
    title: 'Client reviews',
    body: 'Detailed, multi-factor reviews from verified clients. Ratings across 6 dimensions. You can reply publicly to every review.',
    color: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-700',
  },
  {
    num: '04',
    title: 'Your rating',
    body: 'A Trust Cabbage score (1–5) shown in Google search results via structured data — buyers see your stars before they even click.',
    color: 'from-amber-400 to-orange-500',
    light: 'bg-amber-50 border-amber-100',
    text: 'text-amber-700',
  },
]

const TOOLS = [
  {
    icon: Link2,
    title: 'Review invite link',
    body: 'A unique link for your company. Share it on WhatsApp, email, or in your client onboarding docs. Lands your client directly on your review form.',
    badge: 'Live now',
    badgeColor: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: Mail,
    title: 'Email invites',
    body: 'Upload your client list. We send branded invite emails on your behalf via Resend. 100 invites/month included, more on higher plans.',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-100 text-slate-500 border border-slate-200',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: Code2,
    title: 'Website widget',
    body: 'A small badge for your website showing your Trust Cabbage rating. One line of code. Updates automatically as new reviews come in.',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-100 text-slate-500 border border-slate-200',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: QrCode,
    title: 'QR code',
    body: 'Download your review QR code. Put it on proposals, invoice footers, or office reception. Clients scan and review instantly.',
    badge: 'Coming soon',
    badgeColor: 'bg-slate-100 text-slate-500 border border-slate-200',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
]

const PLANS = [
  {
    name: 'Free',
    price: '₹0',
    period: '/ month',
    cta: 'Get started free',
    ctaStyle: 'bg-slate-900 hover:bg-slate-800 text-white',
    href: '/for-businesses/add',
    cardStyle: 'bg-white border border-slate-200',
    nameStyle: 'text-slate-500',
    priceStyle: 'text-slate-950',
    periodStyle: 'text-slate-400',
    checkStyle: 'text-slate-400',
    textStyle: 'text-slate-600',
    features: [
      'Company page listed',
      'Claim your page',
      'Unlimited reviews collected',
      'Review invite link',
      'Public reply to reviews',
      'Trust Cabbage badge (watermarked)',
    ],
  },
  {
    name: 'Starter',
    price: '₹1,499',
    period: '/ month',
    cta: 'Coming soon',
    ctaStyle: 'bg-white/20 text-white cursor-not-allowed',
    href: '#',
    tag: 'Most popular',
    cardStyle: 'bg-gradient-to-b from-[#4c1d95] to-[#1e1b4b] border border-violet-400/30 shadow-2xl shadow-violet-900/40 scale-105',
    nameStyle: 'text-violet-300',
    priceStyle: 'text-white',
    periodStyle: 'text-violet-300',
    checkStyle: 'text-violet-400',
    textStyle: 'text-violet-100',
    features: [
      'Everything in Free',
      'Clean embeddable widget (no watermark)',
      'Email invite tool (up to 100/month)',
      'Basic analytics (rating trend)',
      'Verified company badge',
      'Priority claim processing',
    ],
  },
  {
    name: 'Growth',
    price: '₹4,999',
    period: '/ month',
    cta: 'Coming soon',
    ctaStyle: 'bg-slate-100 text-slate-400 cursor-not-allowed',
    href: '#',
    cardStyle: 'bg-white border border-slate-200',
    nameStyle: 'text-slate-500',
    priceStyle: 'text-slate-950',
    periodStyle: 'text-slate-400',
    checkStyle: 'text-slate-400',
    textStyle: 'text-slate-600',
    features: [
      'Everything in Starter',
      'Unlimited email invites + CSV upload',
      'Advanced analytics (sentiment, trends)',
      'API access to your rating data',
      'QR code generator',
      'Featured in category listing',
      'Dedicated support',
    ],
  },
]

const CANNOT_DO = [
  'You cannot delete your company page once created',
  'You cannot delete or hide individual reviews',
  'You cannot edit what a reviewer wrote',
  'Paid plans do not affect your rating or review visibility',
  'You can flag factually incorrect reviews for admin review — but not remove them',
]

export default function ForBusinessesPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-[#1e1b4b] pt-16 pb-24 overflow-hidden">
        {/* bg decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-400/15 border border-violet-400/25 text-violet-300 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-7">
            <Zap className="h-3 w-3" /> For Businesses
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-5">
            Your reputation is your<br className="hidden sm:block" />
            biggest sales tool.{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Start using it.
            </span>
          </h1>
          <p className="text-violet-200/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Trust Cabbage gives Indian B2B companies a verified, permanent home for their client reviews — so buyers can find you and trust you before the first call.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-8 py-4 text-sm transition-all shadow-lg shadow-violet-900/50 hover:shadow-violet-700/40 hover:-translate-y-0.5"
            >
              Claim your company page — free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-to-get-on"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-white/80 font-black px-8 py-4 text-sm hover:bg-white/8 hover:border-white/30 transition-colors"
            >
              See how it works →
            </Link>
          </div>

          {/* trust chips */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { label: 'Free to list', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
              { label: 'No hidden fees', color: 'bg-sky-500/15 text-sky-300 border-sky-500/20' },
              { label: 'Google-indexed pages', color: 'bg-violet-500/15 text-violet-300 border-violet-500/20' },
              { label: 'Verified reviews only', color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
            ].map(c => (
              <span key={c.label} className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${c.color}`}>
                <CheckCircle className="h-3 w-3" />{c.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Problem — split layout ── */}
      <section className="bg-slate-950 py-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left: problem */}
            <div className="py-16 lg:pr-16 border-b lg:border-b-0 lg:border-r border-white/10">
              <span className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4 block">The problem</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
                Winning new business shouldn&apos;t depend on who you know.
              </h2>
              <p className="text-slate-400 leading-relaxed">
                In Indian B2B, too much depends on referrals, LinkedIn connections, and who can shout the loudest on social media. Good companies with great track records lose to noisier competitors.
              </p>
            </div>
            {/* Right: solution */}
            <div className="py-16 lg:pl-16">
              <span className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-4 block">The solution</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-4">
                Let your clients&apos; words open doors you couldn&apos;t knock on.
              </h2>
              <p className="text-slate-400 leading-relaxed">
                Your verified client reviews stay permanently on your page — searchable, Google-indexed, and visible to every buyer who looks you up. The best companies rise, regardless of budget.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── What your page gives you ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Everything a buyer needs to say yes to you.
            </h2>
            <p className="text-slate-500 text-sm">Your company page works for you around the clock.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {PAGE_CARDS.map(card => (
              <div key={card.num} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-shadow">
                <div className={`h-1.5 w-full bg-gradient-to-r ${card.color}`} />
                <div className="p-6 flex gap-4">
                  <div className={`h-11 w-11 rounded-xl ${card.light} border flex items-center justify-center flex-shrink-0`}>
                    <span className={`text-lg font-black ${card.text}`}>{card.num}</span>
                  </div>
                  <div>
                    <h3 className="font-black text-slate-950 mb-1.5">{card.title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{card.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How to get on ── */}
      <section id="how-to-get-on" className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">Three ways to get started</h2>
            <p className="text-slate-500 text-sm">Pick the path that fits where you are right now.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="relative rounded-2xl border-2 border-violet-200 bg-violet-50 p-6 flex flex-col">
              <div className="h-12 w-12 rounded-2xl bg-[#6d28d9] flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">Already listed?</span>
              <h3 className="font-black text-slate-950 text-base mb-2">Find & claim</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                Search your company name. If it&apos;s already listed, claim it with your GST or CIN. Verified within 48 hours.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-4 py-2.5 text-xs transition-colors"
              >
                <Search className="h-3.5 w-3.5" /> Search my company
              </Link>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border-2 border-sky-200 bg-sky-50 p-6 flex flex-col">
              <div className="h-12 w-12 rounded-2xl bg-sky-500 flex items-center justify-center mb-4">
                <PenLine className="h-6 w-6 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-500 mb-1">Not listed yet?</span>
              <h3 className="font-black text-slate-950 text-base mb-2">Create your page</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                Create your company page in under 5 minutes. Free. Add services, logo, and description, then claim it.
              </p>
              <Link
                href="/for-businesses/add"
                className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-black px-4 py-2.5 text-xs transition-colors"
              >
                <PenLine className="h-3.5 w-3.5" /> Add my company
              </Link>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 flex flex-col">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center mb-4">
                <Star className="h-6 w-6 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Then</span>
              <h3 className="font-black text-slate-950 text-base mb-2">Collect reviews</h3>
              <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-5">
                Share your unique review link via email or WhatsApp. Your clients take 3 minutes to review. You benefit forever.
              </p>
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white font-black px-4 py-2.5 text-xs">
                <Zap className="h-3.5 w-3.5" /> Available after claiming
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Review collection tools ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              Make it easy for happy clients to say so publicly.
            </h2>
            <p className="text-slate-500 text-sm">Four tools to turn satisfied clients into public advocates.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {TOOLS.map(tool => (
              <div key={tool.title} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:bg-white/6 transition-colors flex gap-4">
                <div className={`h-12 w-12 rounded-xl ${tool.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <tool.icon className={`h-6 w-6 ${tool.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-black text-white">{tool.title}</h3>
                    <span className={`text-[10px] font-black rounded-full px-2 py-0.5 ${tool.badgeColor}`}>{tool.badge}</span>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed">{tool.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="bg-slate-100 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Start free. Upgrade when you&apos;re ready.
            </h2>
            <p className="text-slate-500 text-sm">No credit card needed to get started.</p>
          </div>

          {/* Early access banner */}
          <div className="mb-10 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 p-px">
            <div className="rounded-2xl bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center flex-shrink-0">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-black text-slate-950 mb-0.5">All features are free during early access</p>
                <p className="text-sm text-slate-500">We&apos;re in early access — every feature on every plan is available at no cost. Paid plans will launch later; you&apos;ll be notified before anything changes.</p>
              </div>
              <Link
                href="/for-businesses/add"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-black px-6 py-3 text-sm whitespace-nowrap hover:opacity-90 transition-opacity flex-shrink-0"
              >
                Get started — free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-center">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-7 flex flex-col relative ${plan.cardStyle}`}
              >
                {plan.tag && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-fuchsia-500 text-white text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap shadow-lg">
                    {plan.tag}
                  </span>
                )}
                <div className="mb-6">
                  <p className={`font-black text-xs uppercase tracking-widest mb-2 ${plan.nameStyle}`}>{plan.name}</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${plan.priceStyle}`}>{plan.price}</span>
                    <span className={`text-sm ${plan.periodStyle}`}>{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 flex-1 mb-7">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.checkStyle}`} />
                      <span className={plan.textStyle}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`w-full text-center rounded-xl font-black py-3 text-sm transition-colors ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-slate-400 mt-8">Paid plans launching soon · Your reviews and company page stay forever, on any plan.</p>
        </div>
      </section>

      {/* ── What businesses cannot do ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
                <ShieldCheck className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                Our promise to buyers — and why it makes your reviews more valuable.
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm">
                These rules are non-negotiable. They&apos;re what makes a 4.6 on Trust Cabbage actually mean something — to you, and to every buyer who reads it.
              </p>
            </div>
            <div className="space-y-3">
              {CANNOT_DO.map(rule => (
                <div key={rule} className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <div className="h-6 w-6 rounded-full bg-rose-500/15 border border-rose-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="h-3.5 w-3.5 text-rose-400" />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#4c1d95] via-[#6d28d9] to-[#7c3aed] py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-60 h-60 bg-fuchsia-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 text-white/80 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
            <BarChart3 className="h-3 w-3" /> 4,200+ companies already listed
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Ready to build trust that compounds?
          </h2>
          <p className="text-violet-200/70 text-base mb-10 leading-relaxed">
            Start free. Your first review changes everything.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#6d28d9] font-black px-8 py-4 text-sm hover:bg-violet-50 transition-colors shadow-xl"
            >
              <Search className="h-4 w-4" /> Claim my company page
            </Link>
            <Link
              href="/for-businesses/add"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 text-white font-black px-8 py-4 text-sm hover:bg-white/10 transition-colors"
            >
              <PenLine className="h-4 w-4" /> Add my company — free
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-violet-200/60">
            {['Free to list', 'No review deletion — ever', 'GST-verified company pages'].map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-violet-400" /> {p}
              </span>
            ))}
          </div>
        </div>
      </section>

    </div>
  )
}

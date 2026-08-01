import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle, X, ArrowRight, Zap, Code2, Search,
  MessageCircleQuestion, ShieldCheck, Package, Send, BarChart3,
  TrendingUp, Globe, IndianRupee, AlertTriangle, Landmark, Quote,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Product Reviews API & Widget, Collect Verified Product Reviews | Trust Cabbage',
  description:
    'Research shows displaying reviews lifts conversion by up to 270%. Collect product-level reviews on your order pages, display them on your product pages, and get them indexed on Google, third-party verified via Trust Cabbage. Built for Indian D2C brands and B2B companies.',
}

/* ────────────────────────────────────────────────────────────────
   Research-backed numbers used across this page.
   Sources listed in the SOURCES constant and rendered as footnotes.
──────────────────────────────────────────────────────────────── */

const HERO_STATS = [
  { value: '270%', label: 'higher conversion when a product displays reviews', source: '1' },
  { value: '98%', label: 'of consumers read reviews before buying', source: '2' },
  { value: '82%', label: 'of shoppers specifically seek out negative reviews to judge authenticity', source: '3' },
  { value: '2×', label: 'conversion rate for shoppers who engage with product Q&A', source: '4' },
]

const EVIDENCE_CARDS = [
  {
    stat: '270%',
    title: 'Reviews are the highest-ROI conversion asset you can own',
    body: 'Northwestern University’s Spiegel Research Center found that displaying reviews can increase conversion by up to 270%, and by up to 380% for higher-priced products, where buyers perceive more risk. No ad campaign, discount, or redesign delivers that lift.',
    source: 'Spiegel Research Center, Northwestern University',
    color: 'from-violet-500 to-violet-700',
    accent: 'text-violet-600',
  },
  {
    stat: '4.2–4.7',
    title: 'A perfect 5.0 actually hurts you. Verified honesty sells.',
    body: 'The same research found purchase likelihood peaks between 4.2 and 4.7 stars, and drops for perfect 5.0 ratings, which buyers read as fake. This is why self-hosted, cherry-picked review walls backfire: buyers have learned to distrust perfection.',
    source: 'Spiegel Research Center, Northwestern University',
    color: 'from-amber-400 to-orange-500',
    accent: 'text-amber-600',
  },
  {
    stat: '46%',
    title: 'A stranger’s review carries the weight of a friend’s advice',
    body: 'Nearly half of consumers say they trust online reviews as much as personal recommendations from family and friends. Your customers’ words, hosted somewhere you visibly cannot edit them, are the closest thing to word-of-mouth at scale.',
    source: 'BrightLocal Local Consumer Review Survey',
    color: 'from-emerald-500 to-teal-600',
    accent: 'text-emerald-600',
  },
  {
    stat: '5 reviews',
    title: 'The first five reviews do the heaviest lifting',
    body: 'A product’s purchase likelihood rises fastest between zero and five reviews, the jump from no reviews to five is larger than from five to fifty. Which means the collection widget on your very next order confirmation page is your highest-leverage move.',
    source: 'Spiegel Research Center, Northwestern University',
    color: 'from-sky-500 to-blue-600',
    accent: 'text-sky-600',
  },
]

const STEPS = [
  {
    num: '01',
    title: 'Get your API key',
    body: 'Claim your company page, open the dashboard, generate your key. Two minutes. No approval queue, no sales call, no onboarding fee.',
    color: 'from-violet-500 to-violet-700',
    light: 'bg-violet-50 border-violet-100',
    text: 'text-violet-700',
  },
  {
    num: '02',
    title: 'Paste one snippet',
    body: 'Add our script tag to your order confirmation page with your own product ID or SKU, whatever your system already uses. Works with any stack: custom site, Shopify, WooCommerce, or one tag in Google Tag Manager.',
    color: 'from-sky-500 to-blue-600',
    light: 'bg-sky-50 border-sky-100',
    text: 'text-sky-700',
  },
  {
    num: '03',
    title: 'Reviews compound automatically',
    body: 'Customers review at the moment of highest goodwill, right after purchase, on your site. Products auto-register on Trust Cabbage the first time they’re seen. Zero catalogue management, forever.',
    color: 'from-emerald-500 to-teal-600',
    light: 'bg-emerald-50 border-emerald-100',
    text: 'text-emerald-700',
  },
]

const BENEFITS = [
  {
    icon: Globe,
    title: 'Searchable on Google, where 98% of research starts',
    body: 'Reviews trapped inside your website are invisible to search engines. Every Trust Cabbage product page is server-rendered with Schema.org structured data, Google indexes every product, every star rating, every answered question. When a buyer searches "[your brand] reviews", they find verified proof instead of a Reddit thread.',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: ShieldCheck,
    title: 'Third-party verified, the trust you cannot buy',
    body: 'Buyers know you control your own website, that’s why on-site review walls convince no one. Reviews on Trust Cabbage cannot be edited, hidden, or deleted by you, and that constraint is precisely what makes your 4.6 believable. Neutrality is the product.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Package,
    title: 'Product-level precision, not company-level averages',
    body: 'A company rating says "they’re decent." A product rating says "this exact thing you’re about to buy, 128 people bought it, here’s what happened." Each product gets its own rating, its own reviews, its own public page, its own Google presence.',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: MessageCircleQuestion,
    title: 'Built-in Q&A, kill objections before they kill the sale',
    body: 'Shoppers who interact with product Q&A convert at roughly double the rate, because an unanswered question is an abandoned cart. Visitors ask on your product, you answer officially, verified buyers answer from experience. Answers rank on Google for long-tail buyer queries.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Code2,
    title: 'Collect once, display everywhere',
    body: 'The same script tag works in two modes: collect on order pages, display on product pages. Reviews gathered after checkout render back on your own product pages automatically, your site and your Trust Cabbage page stay in sync without a single manual step.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    icon: Send,
    title: 'Email invites with deliverability handled',
    body: 'Prefer email? Call our API when an order is delivered and we send a branded review invite, with mandatory unsubscribe links, bounce tracking, and sender reputation managed for you. Compliant by default, so your review requests never look like spam.',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
]

const COMPARISON = [
  { feature: 'Reviews displayed on your own website', tc: true, selfHosted: true, trustpilot: false },
  { feature: 'Reviews on a public, Google-indexed page', tc: true, selfHosted: false, trustpilot: true },
  { feature: 'Product-level ratings & reviews', tc: true, selfHosted: true, trustpilot: false },
  { feature: 'Product Q&A with official + buyer answers', tc: true, selfHosted: true, trustpilot: false },
  { feature: 'Third-party verified (you cannot edit or hide reviews)', tc: true, selfHosted: false, trustpilot: true },
  { feature: 'Aligned with India’s IS 19000:2022 review integrity standard', tc: true, selfHosted: false, trustpilot: false },
  { feature: 'Priced for Indian businesses', tc: true, selfHosted: false, trustpilot: false },
  { feature: 'Collect via widget, REST API, or email invite', tc: true, selfHosted: true, trustpilot: false },
]

const FAQS = [
  {
    q: 'Do I have to add my product catalogue to Trust Cabbage first?',
    a: 'No. Pass your own product ID or SKU in the snippet, the product is auto-created on Trust Cabbage the first time we see it, linked to your company via your API key. Your catalogue stays in your system; we mirror only what actually gets reviewed. There is nothing to upload, sync, or maintain.',
  },
  {
    q: 'What if I don’t have a developer?',
    a: 'If you run Shopify or WooCommerce, our plugin will handle everything, install and connect your key (coming soon). If your site uses Google Tag Manager, and if you run Facebook or Google ads, it almost certainly does, one GTM tag covers both collection and display with no code deployment. Otherwise, it’s a one-time task of roughly two hours for any developer: the same effort as installing a live-chat widget.',
  },
  {
    q: 'Can I delete or hide a bad product review?',
    a: 'No, and this is a feature, not a limitation. Research shows 82% of shoppers deliberately look for negative reviews, and ratings between 4.2 and 4.7 convert better than a perfect 5.0. A visible, professionally-answered negative review builds more trust than a suspiciously spotless wall. You can reply publicly to every review and flag factually false ones for moderation.',
  },
  {
    q: 'Do product reviews affect my company rating?',
    a: 'Yes, every product review also counts toward your overall company rating on Trust Cabbage. Collecting product reviews strengthens your entire profile: your company page, your category ranking, and your search presence all compound from the same effort.',
  },
  {
    q: 'How are reviewers verified? What stops fake reviews?',
    a: 'Reviews collected through the widget or API carry order context from your own system (order ID, product ID), so they’re marked as verified purchases. Reviewers authenticate with OTP before submitting. One review per customer per product. This mirrors the verified-purchase requirements of India’s IS 19000:2022 standard for online consumer reviews.',
  },
  {
    q: 'What happens to my reviews if I stop paying?',
    a: 'Your reviews and your public page stay up, permanently, on any plan, including free. We never hold your reputation hostage. Paid plans gate collection tools and analytics, never the visibility of reviews already earned.',
  },
  {
    q: 'What does it cost?',
    a: 'During early access, everything is free, including the API. When paid plans launch, product review collection will sit in the Growth plan, priced for Indian businesses (global platforms charge ₹15,000–50,000+ per month for less). Early access companies will be notified well before anything changes.',
  },
]

const SOURCES = [
  'Spiegel Research Center, Northwestern University, "How Online Reviews Influence Sales": displaying reviews increased conversion up to 270% (380% for higher-priced products); purchase likelihood peaks at 4.2–4.7 stars; the largest lift occurs within the first five reviews.',
  'BrightLocal Local Consumer Review Survey & PowerReviews consumer research, 98%+ of consumers read online reviews before purchasing; 46% trust online reviews as much as personal recommendations.',
  'PowerReviews, "The Ever-Growing Power of Reviews": 82% of shoppers specifically seek out negative reviews when evaluating a product.',
  'Bazaarvoice Shopper Experience Index, visitors who engage with product Q&A convert at roughly double the rate of those who don’t.',
  'Bureau of Indian Standards, IS 19000:2022, "Online Consumer Reviews: Principles and Requirements", Department of Consumer Affairs, Government of India (November 2022).',
]

function ComparisonMark({ yes }: { yes: boolean }) {
  return yes
    ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
    : <X className="h-4 w-4 text-slate-300 mx-auto" />
}

export default function ProductReviewsPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-[#1e1b4b] pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/40 to-transparent" />
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-fuchsia-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet-400/15 border border-violet-400/25 text-violet-300 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-7">
            <Package className="h-3 w-3" /> Product Reviews API · Early access
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-5">
            Reviews collected on your site.{' '}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              Trusted on Google.
            </span>
          </h1>
          <p className="text-violet-200/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            One snippet on your order page collects product-level reviews at the moment of highest
            customer goodwill. They render on your product pages, live permanently on your public
            Trust Cabbage page, and surface in Google search, third-party verified, impossible to fake.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <a
              href="mailto:hello@trustcabbage.com?subject=Product Reviews API, early access"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6d28d9] hover:bg-[#7c3aed] text-white font-black px-8 py-4 text-sm transition-all shadow-lg shadow-violet-900/50 hover:shadow-violet-700/40 hover:-translate-y-0.5"
            >
              Request early access <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="#the-evidence"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-white/80 font-black px-8 py-4 text-sm hover:bg-white/8 hover:border-white/30 transition-colors"
            >
              See the research →
            </Link>
          </div>

          {/* Hard numbers strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
            {HERO_STATS.map(s => (
              <div key={s.label} className="bg-[#1e1b4b] px-5 py-6">
                <p className="text-3xl font-black bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  {s.value}
                </p>
                <p className="text-[11px] text-violet-200/60 leading-snug mt-1.5">
                  {s.label}
                  <sup className="text-violet-400/80 ml-0.5">{s.source}</sup>
                </p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-violet-200/30 mt-3">Sources cited at the bottom of this page.</p>
        </div>
      </section>

      {/* ── The India problem, trust deficit ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4 block">The trust deficit</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
              Indian buyers have stopped believing you.<br className="hidden sm:block" /> They believe each other.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              India&apos;s e-commerce boom created a fake review epidemic severe enough that the Government of India
              published a national standard for online reviews, IS 19000:2022, requiring verified purchases
              and banning review manipulation. Buyer skepticism is now the default. That is bad news for brands
              with something to hide, and a structural advantage for brands with nothing to hide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">Self-hosted reviews read as marketing</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                A wall of five-star reviews on a page you control is a claim, not evidence. Research shows buyers
                actively hunt for negative reviews to test authenticity<sup>3</sup>, and a suspiciously perfect
                on-site rating fails that test instantly.
              </p>
            </div>
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <Landmark className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">The government raised the bar, IS 19000:2022</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                India&apos;s national standard for online consumer reviews<sup>5</sup> demands verified purchasers,
                authenticated reviewers, and no cherry-picking. Trust Cabbage is built on those principles,
                OTP-verified reviewers, order-linked verified purchases, and no deletion rights for businesses.
              </p>
            </div>
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">Skepticism rewards the genuinely good</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                When buyers distrust everything a brand says about itself, third-party verified proof becomes
                the scarcest asset in your funnel. If your product is genuinely good, buyer skepticism
                is your moat, you just need somewhere neutral for the truth to live.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── The evidence, research cards ── */}
      <section id="the-evidence" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-black uppercase tracking-widest text-[#6d28d9] mb-3 block">What the research says</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Reviews aren&apos;t a nice-to-have. They&apos;re the single biggest conversion lever.
            </h2>
            <p className="text-slate-500 text-sm max-w-2xl mx-auto">
              Two decades of consumer research is unambiguous, here is what the data says, with sources.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {EVIDENCE_CARDS.map(card => (
              <div key={card.stat} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow">
                <div className={`h-1.5 w-full bg-gradient-to-r ${card.color}`} />
                <div className="p-6">
                  <p className={`text-4xl font-black ${card.accent} mb-3`}>{card.stat}</p>
                  <h3 className="font-black text-slate-950 text-sm mb-2 leading-snug">{card.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed mb-3">{card.body}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">{card.source}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The ROI math ── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-700 px-3 py-1 text-xs font-black uppercase tracking-widest mb-5">
                <IndianRupee className="h-3 w-3" /> The math
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-4 leading-tight">
                What is a review actually worth to you?
              </h2>
              <p className="text-slate-500 leading-relaxed text-sm mb-4">
                Run your own numbers. Take a store doing 10,000 product page visits a month at a 2%
                conversion rate and ₹1,200 average order value, that&apos;s ₹2.4 lakh in monthly revenue.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm mb-4">
                The Spiegel research measured conversion lifts of up to 270% from displaying reviews<sup>1</sup>.
                You don&apos;t need anywhere near the full effect for this to be the best-ROI thing you ship this
                quarter: even a conservative one-fifth of that lift takes the same traffic to roughly
                ₹3.7 lakh, over ₹1.2 lakh of additional monthly revenue from reviews you collect once
                and benefit from forever.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm">
                And unlike ad spend, reviews don&apos;t stop working when you stop paying. They compound:
                every review strengthens the product page, the company page, and your Google presence
                simultaneously.
              </p>
            </div>

            {/* Math card */}
            <div className="rounded-2xl bg-slate-950 p-8 shadow-2xl">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">Illustration, conservative scenario</p>
              <div className="space-y-4">
                {[
                  { label: 'Monthly product page visits', value: '10,000' },
                  { label: 'Conversion rate today (no reviews)', value: '2.0%' },
                  { label: 'Average order value', value: '₹1,200' },
                  { label: 'Revenue today', value: '₹2.4L / month' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-b border-white/8 pb-3">
                    <span className="text-xs text-slate-400">{row.label}</span>
                    <span className="text-sm font-black text-white">{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-b border-white/8 pb-3">
                  <span className="text-xs text-slate-400">
                    Conversion with reviews displayed
                    <span className="block text-[10px] text-slate-500">assuming just ⅕ of the measured 270% lift¹</span>
                  </span>
                  <span className="text-sm font-black text-emerald-400">~3.1%</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-black text-white">Additional revenue</span>
                  <span className="text-xl font-black bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                    +₹1.2L+ / month
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 mt-6 leading-relaxed">
                Illustrative only, your lift depends on price point, category, and review volume.
                Higher-priced products saw larger lifts (up to 380%) in the cited research¹.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Live in an afternoon, not a sprint.
            </h2>
            <p className="text-slate-500 text-sm">No catalogue uploads. No product mapping. No maintenance. The same effort as installing a chat widget.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {STEPS.map(step => (
              <div key={step.num} className="bg-white rounded-2xl border border-slate-200 overflow-hidden group hover:shadow-lg transition-shadow">
                <div className={`h-1.5 w-full bg-gradient-to-r ${step.color}`} />
                <div className="p-6">
                  <div className={`h-11 w-11 rounded-xl ${step.light} border flex items-center justify-center mb-4`}>
                    <span className={`text-lg font-black ${step.text}`}>{step.num}</span>
                  </div>
                  <h3 className="font-black text-slate-950 mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Code snippet visual */}
          <div className="mt-12 max-w-2xl mx-auto">
            <div className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/10">
                <span className="h-3 w-3 rounded-full bg-rose-500/60" />
                <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                <span className="ml-3 text-xs text-slate-500 font-mono">order-confirmation.html</span>
              </div>
              <pre className="px-5 py-5 text-xs sm:text-sm font-mono leading-relaxed overflow-x-auto">
                <code>
                  <span className="text-slate-500">{'<!-- That’s it. This is the whole integration. -->'}</span>{'\n'}
                  <span className="text-sky-300">{'<script'}</span>{'\n'}
                  {'  '}<span className="text-violet-300">src</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;https://trustcabbage.com/api/widget/product.js&quot;</span>{'\n'}
                  {'  '}<span className="text-violet-300">data-api-key</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;tc_live_xxxxx&quot;</span>{'\n'}
                  {'  '}<span className="text-violet-300">data-product-id</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;SKU-1042&quot;</span>{'\n'}
                  {'  '}<span className="text-violet-300">data-product-name</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;Vitamin C Face Serum&quot;</span>{'\n'}
                  {'  '}<span className="text-violet-300">data-order-id</span><span className="text-slate-400">=</span><span className="text-emerald-300">&quot;ORD-9234&quot;</span>{'\n'}
                  <span className="text-sky-300">{'></script>'}</span>
                </code>
              </pre>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              Use <span className="font-mono font-bold">data-mode=&quot;collect&quot;</span> on order pages and{' '}
              <span className="font-mono font-bold">data-mode=&quot;display&quot;</span> on product pages. Same script, both jobs.
              Your product ID is whatever your system already uses, products auto-register on first sight.
            </p>
          </div>
        </div>
      </section>

      {/* ── Benefits grid ── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Everything a self-hosted tool does. Plus the one thing it never can.
            </h2>
            <p className="text-slate-500 text-sm">Neutrality. Reviews hosted where you visibly cannot touch them are the only reviews buyers fully believe.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BENEFITS.map(b => (
              <div key={b.title} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 hover:shadow-md hover:bg-white transition-all">
                <div className={`h-11 w-11 rounded-xl ${b.iconBg} flex items-center justify-center mb-4`}>
                  <b.icon className={`h-5 w-5 ${b.iconColor}`} />
                </div>
                <h3 className="font-black text-slate-950 text-sm mb-1.5 leading-snug">{b.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Google visibility highlight ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-violet-400/15 border border-violet-400/25 text-violet-300 px-3 py-1 text-xs font-black uppercase tracking-widest mb-5">
                <Search className="h-3 w-3" /> The search advantage
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4 leading-tight">
                &quot;[Your brand] reviews&quot; is being searched right now. What comes up?
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm mb-6">
                &quot;Reviews&quot; is one of the most common words buyers add to a brand search before purchasing.
                For most Indian brands, that search returns a marketplace listing they don&apos;t control,
                a stale forum thread, or nothing. Reviews collected through Trust Cabbage live on
                server-rendered public pages with structured data, purpose-built to rank for exactly
                these searches.
              </p>
              <ul className="space-y-3">
                {[
                  'Dedicated public page per product, indexed by Google',
                  'Star ratings eligible for rich results via Schema.org markup',
                  'Q&A answers rank for long-tail buyer questions ("does X work for Y")',
                  'Every product review also strengthens your company page ranking',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                    <CheckCircle className="h-4 w-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock search result */}
            <div className="rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 mb-5">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-sm text-slate-600">vitamin c face serum reviews india</span>
              </div>
              <div className="space-y-1 border-l-2 border-violet-200 pl-4">
                <p className="text-xs text-emerald-700">trustcabbage.com › company › glowlabs › product</p>
                <p className="text-base font-bold text-blue-700 leading-snug">
                  Vitamin C Face Serum Reviews, GlowLabs | Trust Cabbage
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-500 text-sm tracking-tight">★★★★★</span>
                  <span className="text-xs text-slate-600 font-bold">4.7 · 128 verified reviews</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  128 verified buyer reviews for Vitamin C Face Serum by GlowLabs.
                  &quot;Visible difference in 3 weeks&quot; · Q&A: Does it work on oily skin? ...
                </p>
              </div>
              <p className="text-[10px] text-slate-400 mt-5 text-center">Illustration of how your product page can appear in Google search</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Q&A feature ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Mock Q&A card */}
            <div className="order-2 lg:order-1">
              <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-6 space-y-5">
                <div>
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs flex-shrink-0">P</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">Does this work on oily, acne-prone skin?</p>
                      <p className="text-xs text-slate-400 mt-0.5">Asked by Priya M. · 3 days ago</p>
                    </div>
                  </div>
                  <div className="ml-11 mt-3 space-y-3">
                    <div className="rounded-xl bg-violet-50 border-l-4 border-[#6d28d9] p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <ShieldCheck className="h-3.5 w-3.5 text-[#6d28d9]" />
                        <span className="text-xs font-black text-[#6d28d9]">GlowLabs · Official answer</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Yes, it&apos;s non-comedogenic and formulated for all skin types. For oily skin, use 2–3 drops at night after cleansing.
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3.5">
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs font-black text-slate-600">Rahul S. · Verified buyer</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        I have very oily skin, been using it 2 months, no breakouts. Absorbs fast.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5">
                  <MessageCircleQuestion className="h-4 w-4 text-slate-300" />
                  <span className="text-xs text-slate-400">Ask a question about this product…</span>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-200 text-amber-700 px-3 py-1 text-xs font-black uppercase tracking-widest mb-5">
                <MessageCircleQuestion className="h-3 w-3" /> Product Q&A
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-4 leading-tight">
                Every unanswered question is an abandoned cart.
              </h2>
              <p className="text-slate-500 leading-relaxed text-sm mb-4">
                Shoppers who engage with product Q&A convert at roughly double the rate<sup>4</sup>,
                because the question they asked was the only thing between them and checkout.
              </p>
              <p className="text-slate-500 leading-relaxed text-sm mb-6">
                With built-in Q&A, prospective buyers ask directly on your product. You answer with an
                official badge; verified buyers back you up with lived experience, the most persuasive
                combination in commerce. Your dashboard flags unanswered questions so nothing slips.
              </p>
              <ul className="space-y-3">
                {[
                  'Official company answers with a verified badge',
                  'Verified buyers answer from real experience',
                  'Unanswered-question alerts in your dashboard',
                  'Q&A appears on your site and your Trust Cabbage page, and ranks on Google',
                ].map(item => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="bg-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              The best of both worlds, built for India.
            </h2>
            <p className="text-slate-500 text-sm">
              Self-hosted tools help you convert on-site. Global platforms help you get found.
              Until now you had to pick one, and pay Western prices for the second.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-400 min-w-[200px]">Feature</th>
                    <th className="px-4 py-4 min-w-[110px]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#6d28d9]">🥬 Trust Cabbage</span>
                    </th>
                    <th className="px-4 py-4 text-xs font-black text-slate-500 min-w-[110px]">Self-hosted tools</th>
                    <th className="px-4 py-4 text-xs font-black text-slate-500 min-w-[110px]">Global platforms</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON.map(row => (
                    <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-700 font-bold text-xs">{row.feature}</td>
                      <td className="px-4 py-3.5 bg-violet-50/40"><ComparisonMark yes={row.tc} /></td>
                      <td className="px-4 py-3.5"><ComparisonMark yes={row.selfHosted} /></td>
                      <td className="px-4 py-3.5"><ComparisonMark yes={row.trustpilot} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            Self-hosted tools: on-site review apps that live only on your website · Global platforms: international review sites priced ₹15,000–50,000+/month for Western markets
          </p>
        </div>
      </section>

      {/* ── Neutrality pledge ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 mb-6">
                <ShieldCheck className="h-8 w-8 text-rose-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                The rules that make your rating worth something.
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm">
                Remember: purchase likelihood peaks at 4.2–4.7 stars, not 5.0<sup>1</sup>, and 82% of
                buyers go looking for the negative reviews first<sup>3</sup>. A platform that let you
                scrub your record would be destroying the very trust you came here to build.
                These rules are non-negotiable because they are the product.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'You cannot delete or hide a product review, ever',
                'You cannot edit what a reviewer wrote',
                'Reviews are OTP-verified and order-linked, one review per customer per product',
                'Paid plans never affect ratings, rankings, or review visibility',
                'You can reply publicly to every review, and flag factually false ones for moderation',
              ].map(rule => (
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

      {/* ── FAQ ── */}
      <section className="bg-slate-100 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">The questions businesses actually ask us</h2>
            <p className="text-slate-500 text-sm">Straight answers. No sales fluff.</p>
          </div>
          <div className="space-y-4">
            {FAQS.map(faq => (
              <div key={faq.q} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-black text-slate-950 text-sm mb-2">{faq.q}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
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
            <Zap className="h-3 w-3" /> Early access · Free
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Your first five reviews are your biggest lift.<br className="hidden sm:block" /> Start collecting them.
          </h2>
          <p className="text-violet-200/70 text-base mb-10 leading-relaxed">
            Early access companies get the API free, priority onboarding, and a direct line to the team building it.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:hello@trustcabbage.com?subject=Product Reviews API, early access"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-[#6d28d9] font-black px-8 py-4 text-sm hover:bg-violet-50 transition-colors shadow-xl"
            >
              <Send className="h-4 w-4" /> Request early access
            </a>
            <Link
              href="/for-businesses/add"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 text-white font-black px-8 py-4 text-sm hover:bg-white/10 transition-colors"
            >
              <BarChart3 className="h-4 w-4" /> Claim your page first, free
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-violet-200/60">
            {['Free during early access', 'One-snippet integration', 'Reviews live on Google'].map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-violet-400" /> {p}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-violet-200/50">
            Already sold?{' '}
            <Link href="/for-businesses/integrations#product-api" className="text-violet-200 font-bold hover:underline">
              Read the full API reference →
            </Link>
          </p>
        </div>
      </section>

      {/* ── Sources ── */}
      <section className="bg-slate-950 border-t border-white/5 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-4">
            <Quote className="h-3.5 w-3.5 text-slate-600" />
            <p className="text-xs font-black uppercase tracking-widest text-slate-600">Sources</p>
          </div>
          <ol className="space-y-1.5 list-decimal list-inside">
            {SOURCES.map((s, i) => (
              <li key={i} className="text-[11px] text-slate-500 leading-relaxed">{s}</li>
            ))}
          </ol>
          <p className="text-[10px] text-slate-600 mt-4 leading-relaxed">
            Statistics are drawn from published third-party research and are indicative, not a guarantee of results.
            Conversion outcomes vary by category, price point, traffic quality, and review volume.
          </p>
        </div>
      </section>

    </div>
  )
}

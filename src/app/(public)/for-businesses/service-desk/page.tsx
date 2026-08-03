import type { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle, X, ArrowRight, Zap, ShieldCheck, Clock, MessageSquare,
  TrendingUp, Search, Send, AlertTriangle, Award, Lock, HeartHandshake,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Service Desk, Resolve Complaints in Public | Trust Cabbage',
  description:
    'A resolved complaint converts better than a five-star review. Trust Cabbage Service Desk lets your customers raise issues that publish publicly within 72 hours, and rewards you for resolving them fast, with a badge no one can buy.',
}

const STEPS = [
  {
    num: '01',
    title: 'Send a neutral request',
    body: 'When an order is delivered or a project closes, send one email: "How was your experience?" From your dashboard, in bulk, or automatically via API.',
    color: 'from-teal-500 to-emerald-600',
    light: 'bg-teal-50 border-teal-100',
    text: 'text-teal-700',
  },
  {
    num: '02',
    title: 'The customer decides, honestly',
    body: 'One question routes them. Happy, they are guided to a review. Unhappy, they raise a complaint, category, what happened, what would fix it.',
    color: 'from-sky-500 to-blue-600',
    light: 'bg-sky-50 border-sky-100',
    text: 'text-sky-700',
  },
  {
    num: '03',
    title: 'You get 72 hours, then it is public either way',
    body: 'Resolve it in that window and the complaint still publishes, already marked resolved. Ignore it, and it publishes anyway. There is no third option.',
    color: 'from-violet-500 to-fuchsia-600',
    light: 'bg-violet-50 border-violet-100',
    text: 'text-violet-700',
  },
]

const BENEFITS = [
  {
    icon: Award,
    title: 'A badge that cannot be bought',
    body: 'Resolve at least 80% of your public complaints, typically within 72 hours, and your page earns "Resolves issues fast". No plan upgrade grants it. No ad spend buys it. Only actually showing up for customers earns it.',
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: Lock,
    title: 'Only the customer can say resolved',
    body: 'A company can offer a resolution, but the case only closes when the customer confirms it themselves, in writing, on the record. That single rule is what makes your resolution rate mean something to a stranger reading it.',
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
  },
  {
    icon: MessageSquare,
    title: 'The reply happens where it counts',
    body: 'Both sides converse on the same public thread the customer eventually sees. No separate private inbox that never surfaces. What you actually said to fix it is what the next buyer reads.',
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
  },
  {
    icon: TrendingUp,
    title: 'It feeds your reviews too',
    body: 'The same neutral request that catches a complaint also catches a happy customer at the perfect moment, right after they got what they wanted. Every request you send works both sides of your reputation.',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
  },
  {
    icon: Search,
    title: 'Indexed, so it works while you sleep',
    body: 'Every resolved complaint gets its own public, Google-indexed page. The next time someone searches "[your brand] complaint", they find your resolution, not an anonymous forum thread.',
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
  },
  {
    icon: Send,
    title: 'Reminders handled, deliverability handled',
    body: 'We nudge customers who go quiet, once, never spammy, and manage sender reputation so your requests land in the inbox, not the spam folder.',
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
  },
]

const COMPARISON = [
  { feature: 'Customer complaints are collected', tc: true, privateInbox: true, reviews: false },
  { feature: 'Company gets a private window to fix it first', tc: true, privateInbox: true, reviews: false },
  { feature: 'What happened is ever shown to future buyers', tc: true, privateInbox: false, reviews: true },
  { feature: 'Resolution requires the customer\'s own confirmation', tc: true, privateInbox: false, reviews: false },
  { feature: 'Fast resolvers get a public, unpurchasable badge', tc: true, privateInbox: false, reviews: false },
  { feature: 'Company cannot delay or bury a complaint indefinitely', tc: true, privateInbox: false, reviews: true },
  { feature: 'Resolved threads get their own indexed page', tc: true, privateInbox: false, reviews: false },
]

const FAQS = [
  {
    q: 'Why would I want my complaints to be public?',
    a: 'They already are, just scattered across DMs, app store reviews, and consumer forums where you cannot respond with context. Service Desk gives every complaint one place to land, with a structured 72-hour window to fix it before anyone else sees it. A visible, resolved complaint is proof your business shows up after the sale, which is the exact thing buyers cannot verify anywhere else.',
  },
  {
    q: 'What actually happens in the 72 hours?',
    a: 'The complaint is visible only to you. Reply, offer a fix, whatever it takes. If the customer confirms it is resolved before the window closes, the complaint still publishes at the same time it always would, except now it carries a green "Resolved in Xh" badge instead of an open status. Resolving fast is never invisible, it is the entire point.',
  },
  {
    q: 'Can I ever delete or hide a complaint?',
    a: 'No. Not after 72 hours, not ever, on any plan. If companies could suppress complaints, the badge and the resolution rate would mean nothing, and buyers would stop trusting any of it within a month. The one thing you fully control is how fast you resolve it.',
  },
  {
    q: 'What stops a company from just clicking "resolved" on everything?',
    a: 'You cannot. Offering a resolution only sends the customer a one-click confirmation prompt, yes or no. The case stays open until they personally confirm it. If they say no, that is shown publicly too, with their reason.',
  },
  {
    q: 'Does a complaint hurt my star rating?',
    a: 'No. Complaints and reviews are separate signals. Your service record, resolution rate and typical response time, is shown on its own Service tab. Your star rating still comes only from reviews. A resolved complaint cannot be gamed into a rating boost, and an unresolved one cannot silently drag your rating down.',
  },
  {
    q: 'How is this different from a customer just leaving a bad review?',
    a: 'A bad review is a verdict with no path to change it. A complaint is a conversation with a deadline. The customer who was ignored can still write a scathing review afterward, that door never closes, but the company that engages gets to show exactly what they did about it, in public, before that verdict is final.',
  },
  {
    q: 'What does it cost?',
    a: 'Free plans get 20 requests a month, enough to run a real pilot. Higher plans raise the limit and unlock the API for automatic requests on delivery. Publication and the public Service tab are never paywalled, on any plan, because visibility is the whole point.',
  },
]

function ComparisonMark({ yes }: { yes: boolean }) {
  return yes
    ? <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
    : <X className="h-4 w-4 text-slate-300 mx-auto" />
}

export default function ServiceDeskPage() {
  return (
    <div className="min-h-screen">

      {/* ── Hero ── */}
      <section className="relative bg-[#1e1b4b] pt-16 pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />
          <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-teal-400/15 border border-teal-400/25 text-teal-300 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-7">
            <HeartHandshake className="h-3 w-3" /> Service Desk · Free to start
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.1] mb-5">
            Reviews prove people bought from you.{' '}
            <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              This proves you show up after they pay.
            </span>
          </h1>
          <p className="text-teal-200/65 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Send one neutral request. Customers raise complaints that publish publicly within
            72 hours, resolved or not. Fix it fast and you earn a badge no one can buy.
            Ignore it and everyone can see that too.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/dashboard/service"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-[#0f172a] font-black px-8 py-4 text-sm transition-all shadow-lg shadow-teal-900/40 hover:shadow-teal-500/30 hover:-translate-y-0.5"
            >
              Open your Service Desk <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 text-white/80 font-black px-8 py-4 text-sm hover:bg-white/8 hover:border-white/30 transition-colors"
            >
              See how it works →
            </Link>
          </div>

          {/* The rule, stated plainly */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-2xl overflow-hidden border border-white/10 bg-white/10">
            {[
              { icon: Clock, label: '72 hours to a public complaint, no exceptions' },
              { icon: Lock, label: 'Only the customer can mark it resolved' },
              { icon: Award, label: 'A badge that fast resolvers earn, never buy' },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="bg-[#1e1b4b] px-5 py-6 flex items-center gap-3">
                <Icon className="h-5 w-5 text-teal-400 flex-shrink-0" />
                <p className="text-xs text-teal-100/80 leading-snug text-left">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The problem ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-rose-400 mb-4 block">Why this matters now</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight mb-4">
              Reviews stopped being proof. Everyone claims great service.
            </h2>
            <p className="text-slate-400 leading-relaxed">
              New brands launch every week, and every one of them says the same thing: quality product,
              great service, trusted by thousands. Buyers have stopped listening to claims. What they
              actually want to know before they pay is one question you cannot answer with marketing copy:
              if something goes wrong, will this company show up?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-5 w-5 text-rose-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">Your best moments happen in private</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                You might resolve every complaint within hours. But it happens in a phone call or a DM,
                invisible to the next thousand customers deciding whether to trust you. Being good in
                private earns you nothing in public.
              </p>
            </div>
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="h-5 w-5 text-amber-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">A star rating cannot show a fix</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Reviews freeze a moment in time. They cannot show that you called the customer back, shipped
                a replacement, and made it right. There has never been a public place built specifically to
                show that.
              </p>
            </div>
            <div className="rounded-2xl bg-white/4 border border-white/8 p-6">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <TrendingUp className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="font-black text-white text-sm mb-2">Post-sales service is the new differentiator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Product quality became table stakes years ago. What separates businesses now is what
                happens after the sale, and that is precisely the part no platform has made visible, until
                a company gives customers a public place to raise it.
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
              One email. One honest question. One deadline.
            </h2>
            <p className="text-slate-500 text-sm">No approval queue. No separate complaints app. It runs on the same infrastructure as your reviews.</p>
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

          {/* Mock thread visual */}
          <div className="mt-12 max-w-xl mx-auto">
            <div className="rounded-2xl bg-white border border-slate-200 shadow-xl p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">Resolved</span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">Delivery</span>
              </div>
              <p className="font-black text-slate-950 text-sm">Order arrived a day late, no update from support</p>
              <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <p className="text-sm text-green-800 font-bold flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" /> Resolved in 19h, confirmed by the customer
                </p>
                <p className="text-sm text-green-700 mt-1">Refunded the shipping fee and shipped priority next time.</p>
              </div>
              <p className="text-xs text-slate-400 mt-3">Rahul, Indore · Verified customer</p>
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">
              This is what a fast resolution looks like on your public Service tab, exactly what the next buyer sees.
            </p>
          </div>
        </div>
      </section>

      {/* ── Benefits grid ── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Everything a support inbox does. Plus the one thing it never can.
            </h2>
            <p className="text-slate-500 text-sm">Proof. A private inbox resolves issues. Only a public one can show buyers that you do.</p>
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

      {/* ── Comparison table ── */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-950 mb-2">
              Not a support inbox. Not a review site. Something new.
            </h2>
            <p className="text-slate-500 text-sm">
              A private inbox never becomes proof. A review page never shows the fix. Service Desk is built to do both.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-wide text-slate-400 min-w-[220px]">Capability</th>
                    <th className="px-4 py-4 min-w-[110px]">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-700">🥬 Service Desk</span>
                    </th>
                    <th className="px-4 py-4 text-xs font-black text-slate-500 min-w-[110px]">Private support inbox</th>
                    <th className="px-4 py-4 text-xs font-black text-slate-500 min-w-[110px]">Reviews alone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {COMPARISON.map(row => (
                    <tr key={row.feature} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-700 font-bold text-xs">{row.feature}</td>
                      <td className="px-4 py-3.5 bg-teal-50/40"><ComparisonMark yes={row.tc} /></td>
                      <td className="px-4 py-3.5"><ComparisonMark yes={row.privateInbox} /></td>
                      <td className="px-4 py-3.5"><ComparisonMark yes={row.reviews} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ── The trust rules ── */}
      <section className="bg-slate-950 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-teal-500/10 border border-teal-500/20 mb-6">
                <ShieldCheck className="h-8 w-8 text-teal-400" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-4">
                The rules that make a resolved badge worth something.
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm">
                A platform that let companies decide what to publish would be selling reassurance, not
                trust. These rules exist so that when a stranger sees your resolution rate, it means
                exactly what it says.
              </p>
            </div>
            <div className="space-y-3">
              {[
                'Complaints publish within 72 hours, resolved or not, with no company override',
                'Only the customer\'s own confirmation can close a complaint as resolved',
                'Neither side can edit or delete a thread once it exists',
                'A customer can publish early if a company goes 24 hours without replying',
                'Complaints never affect your star rating, and vice versa',
              ].map(rule => (
                <div key={rule} className="flex items-start gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <div className="h-6 w-6 rounded-full bg-teal-500/15 border border-teal-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="h-3.5 w-3.5 text-teal-400" />
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
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0f2e2b] via-[#0d3d38] to-[#134e4a] py-20 text-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -top-10 -left-10 w-60 h-60 bg-teal-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 text-white/80 px-4 py-1.5 text-xs font-black uppercase tracking-widest mb-6">
            <Zap className="h-3 w-3" /> 20 free requests every month
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">
            Your next complaint is coming.<br className="hidden sm:block" /> Decide now where it lands.
          </h2>
          <p className="text-teal-200/70 text-base mb-10 leading-relaxed">
            Send your first request today, free, no setup call, no catalogue to upload.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard/service"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-800 font-black px-8 py-4 text-sm hover:bg-teal-50 transition-colors shadow-xl"
            >
              <HeartHandshake className="h-4 w-4" /> Open your Service Desk
            </Link>
            <Link
              href="/for-businesses/add"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 text-white font-black px-8 py-4 text-sm hover:bg-white/10 transition-colors"
            >
              Claim your page first, free
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-teal-200/60">
            {['Free to start', 'No setup call', 'Public visibility never paywalled'].map(p => (
              <span key={p} className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-teal-400" /> {p}
              </span>
            ))}
          </div>
          <p className="mt-6 text-xs text-teal-200/50">
            Prefer automating it from your order system?{' '}
            <Link href="/dashboard/api#service-endpoint" className="text-teal-200 font-bold hover:underline">
              Read the API reference →
            </Link>
          </p>
        </div>
      </section>

    </div>
  )
}

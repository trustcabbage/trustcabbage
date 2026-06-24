import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Trust Cabbage — India\'s Company & Product Review Platform',
  description: 'Find out why Trust Cabbage exists, what drives it, and what it is building toward — one verified review at a time.',
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1e1b4b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-4">About</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Trust Cabbage
          </h1>
          <p className="text-slate-300 text-lg mt-4 leading-relaxed max-w-xl">
            Finding the right company to work with — or the right brand to buy from — should not feel like a gamble.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">

        <div className="prose-section mb-12">
          <p className="text-slate-600 text-base leading-relaxed">
            But for most people in India, it still does. You search online, read a few testimonials on their website, look at their Instagram, and hope for the best. The real picture only shows up after the money has been sent, the contract has been signed, or the package has arrived.
          </p>
          <p className="text-slate-600 text-base leading-relaxed mt-4">
            Here, thousands of real clients and buyers share what working with Indian companies and brands is actually like — the good experiences and the disappointing ones. Detailed, honest, verified reviews across every factor that matters. Written by people who have been exactly where you are right now.
          </p>
          <p className="text-slate-600 text-base leading-relaxed mt-4">
            Search any company, any service, any brand. Read what real people experienced. Walk into every business decision knowing what you are getting into — not hoping.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-10 mb-10">
          <h2 className="text-xl font-black text-slate-950 mb-5">Why This Exists</h2>
          <p className="text-slate-600 leading-relaxed mb-4">
            Every person who has ever been let down by a company they trusted had a moment before the disappointment — a moment where they wanted to check, but had nowhere to go.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            The web agency that assured you the project would be done on time. The skincare brand that looked incredible on every influencer's feed. The logistics partner who sounded reliable on the first call. They all looked great before you got started. The truth arrived later.
          </p>
          <p className="text-slate-600 leading-relaxed mb-4">
            India has tens of thousands of B2B service companies, D2C brands, and online stores. Most of them have never been independently reviewed by anyone. They grow on referrals, on marketing budgets, and on being good at selling themselves before the work begins.
          </p>
          <p className="text-slate-600 leading-relaxed">
            This platform puts the real experience on the record — permanently, publicly, and verifiably — so the next person searching for exactly what you needed has somewhere honest to look first.
          </p>
        </div>

        <div className="border-t border-slate-200 pt-10 mb-10">
          <h2 className="text-xl font-black text-slate-950 mb-6">What You Can Do Here</h2>
          <div className="space-y-6">
            <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
              <p className="font-black text-slate-950 mb-2">Looking for a service partner or brand?</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Search any category — web agencies, logistics companies, skincare brands, accounting firms, online stores — and find who is genuinely the best, as rated by people who have actually worked with them or bought from them. Not sponsored listings. Not paid rankings. Just honest ratings from real people.
              </p>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
              <p className="font-black text-slate-950 mb-2">Had an experience worth talking about?</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Write a review. It takes a few minutes and it stays permanently. Your experience — whether brilliant or disappointing — helps the next person make a better decision. That is worth something.
              </p>
              <Link href="/write-review" className="inline-block mt-3 text-xs font-black text-[#6d28d9] hover:underline">
                Write a review →
              </Link>
            </div>
            <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
              <p className="font-black text-slate-950 mb-2">Running a business or a brand?</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Claim your page. Let your happy clients speak for you publicly. Build a reputation that finds new customers even when you are not actively pitching.
              </p>
              <Link href="/for-businesses" className="inline-block mt-3 text-xs font-black text-[#6d28d9] hover:underline">
                For business owners →
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-10 mb-10">
          <h2 className="text-xl font-black text-slate-950 mb-6">What Gets Reviewed Here</h2>
          <div className="space-y-4">
            {[
              {
                title: 'B2B Services',
                body: 'Agencies, consultants, software companies, logistics providers, CA firms, IT companies, HR services, legal firms — every category of Indian business service.',
              },
              {
                title: 'Online Brands and D2C Companies',
                body: 'Skincare, fashion, food, electronics, home products, baby and kids, fitness, pets — every category of Indian brand selling directly to consumers online.',
              },
              {
                title: 'Retail Chains and Physical Stores',
                body: 'Multi-city retail chains and stores with an online presence, reviewed for both the in-store experience and online ordering.',
              },
            ].map(item => (
              <div key={item.title} className="flex gap-4">
                <div className="mt-1.5 h-2 w-2 rounded-full bg-[#6d28d9] flex-shrink-0" />
                <div>
                  <p className="font-black text-slate-950 text-sm">{item.title}</p>
                  <p className="text-slate-600 text-sm leading-relaxed mt-1">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 pt-10">
          <div className="rounded-2xl bg-[#1e1b4b] p-8">
            <h2 className="text-xl font-black text-white mb-4">The Vision Behind This</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Somewhere in India right now, a 10-person web agency is doing genuinely brilliant work — and losing business to a larger, noisier competitor with a bigger marketing budget and a more polished sales pitch.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Somewhere, a D2C food brand is making something genuinely good — and struggling to get found because they cannot afford the influencer campaigns that get bigger brands noticed.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              The best companies should not have to outspend the competition to be found. They should be found because the people who have worked with them or bought from them say so — publicly, permanently, and honestly.
            </p>
            <p className="text-[#a78bfa] text-sm font-black">
              That is what this platform is building toward. One verified review at a time.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

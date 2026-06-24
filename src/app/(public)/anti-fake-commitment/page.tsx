import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Anti-Fake Review Commitment — Trust Cabbage',
  description: 'How Trust Cabbage fights fake reviews — the systems we have built, what happens when we find them, and what consequences follow.',
}

export default function AntiFakeCommitmentPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1e1b4b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-4">Trust & Integrity</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Anti-Fake Review Commitment
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed max-w-xl">
            A review platform is only as valuable as the trust people place in what they read on it.
          </p>
        </div>
      </section>

      {/* Intro */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 pb-0">
        <p className="text-slate-600 leading-relaxed">
          The moment a fake review goes undetected — a company planting five-star ratings, a competitor submitting negative reviews to damage a rival, a reviewer writing about an experience they never had — the platform stops being useful. It becomes noise. And noise is worse than silence.
        </p>
        <p className="text-slate-600 leading-relaxed mt-3">
          Fake reviews are the single biggest threat to what this platform is trying to do. This page explains exactly how we fight them — what systems we have built, what we do when we find them, and what consequences follow.
        </p>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-10">

        {/* What a Fake Review Is */}
        <div id="what-is-fake">
          <h2 className="text-lg font-black text-slate-950 mb-5">What a Fake Review Is</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-5">
            A fake review is any review that does not reflect a genuine, first-hand experience with the company being reviewed. Specifically:
          </p>
          <div className="space-y-4">
            {[
              { label: 'Company-planted positive reviews', body: 'Written by employees, founders, family members, friends, or paid individuals to inflate a company\'s rating.' },
              { label: 'Competitor-planted negative reviews', body: 'Written by a competing business or their associates to damage a rival\'s reputation on the platform.' },
              { label: 'Incentivised reviews', body: 'Written in exchange for a discount, free product, cash payment, or any other benefit offered by the company being reviewed.' },
              { label: 'Fabricated reviews', body: 'Written by someone with no genuine connection to or experience with the company.' },
              { label: 'Recycled reviews', body: 'Copied from another platform or written to describe someone else\'s experience rather than the reviewer\'s own.' },
            ].map(({ label, body }) => (
              <div key={label} className="rounded-xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
                <p className="font-black text-slate-950 text-sm mb-1">{label}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mt-5">
            All of the above violate our review policy and are removed when detected, regardless of whether they are positive or negative.
          </p>
        </div>

        {/* How We Prevent Them */}
        <div id="prevention" className="border-t border-slate-200 pt-10">
          <h2 className="text-lg font-black text-slate-950 mb-5">How We Prevent Them</h2>
          <div className="space-y-5 text-sm leading-relaxed">
            {[
              { label: 'Email verification on every review', body: 'No review is published without the reviewer confirming their identity via a one-time code sent to their email address. This is the baseline requirement. No exceptions.' },
              { label: 'One review per reviewer per company', body: 'Our system enforces a strict limit of one review per verified email address per company. Attempting to submit multiple reviews from the same account is automatically blocked at the point of submission.' },
              { label: 'IP and device monitoring', body: 'Every review submission is logged with the reviewer\'s IP address and device fingerprint. Patterns that suggest a coordinated campaign — multiple reviews submitted for the same company from the same location, device cluster, or IP range within a short window — are automatically held for manual review before publication.' },
              { label: 'Review velocity monitoring', body: 'We track how many reviews any company receives and how quickly. A company that receives an unusual number of reviews in a short period — particularly if those reviews share similar language, rating patterns, or account characteristics — is automatically flagged. The reviews are held while our team investigates.' },
              { label: 'Reviewer profile credibility scoring', body: 'Every reviewer builds a profile over time. An account that has written ten reviews across different companies over several months carries significantly more credibility than an account created last week with a single review. Our system weights reviews accordingly and applies additional scrutiny to new accounts with limited history.' },
              { label: 'Verified buyer and verified client badges', body: 'Reviewers who upload proof of their association with the company — an invoice, agreement, order confirmation, or email correspondence — receive a verified badge. Our team checks this proof before the badge is awarded. Verified reviews carry more weight in a company\'s overall rating. Unverified reviews are still published but weighted lower.' },
              { label: 'Business email domain matching', body: 'For B2B reviews where a reviewer claims to be a business client, we encourage verification via a business email address that matches the organisation they claim to represent. This significantly raises the barrier for fake B2B reviews.' },
            ].map(({ label, body }) => (
              <div key={label} className="flex gap-4">
                <div className="mt-1 h-5 w-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-green-700 text-[10px] font-black">✓</span>
                </div>
                <div>
                  <p className="font-black text-slate-950">{label}</p>
                  <p className="text-slate-600 mt-1">{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How We Detect Them */}
        <div id="detection" className="border-t border-slate-200 pt-10">
          <h2 className="text-lg font-black text-slate-950 mb-2">How We Detect Them</h2>
          <p className="text-slate-500 text-sm mb-6">Prevention stops the obvious attempts. Detection handles the sophisticated ones.</p>
          <div className="space-y-5 text-sm leading-relaxed">
            {[
              { label: 'Language and sentiment analysis', body: 'Our system analyses review text for patterns associated with fake content — unusually generic language, repetitive phrasing across multiple reviews for the same company, text that mirrors marketing language too closely, or content that appears generated rather than personal. These reviews are flagged automatically for human review.' },
              { label: 'Network analysis', body: 'We analyse relationships between reviewer accounts — shared IP addresses, similar registration patterns, overlapping device fingerprints — to identify coordinated campaigns. When a group of accounts shows these signals and reviews the same company within a concentrated timeframe, the reviews are held and the pattern is investigated before any are published.' },
              { label: 'Periodic audits', body: 'We conduct regular audits of companies with unusually high or low ratings — particularly where the volume or pattern of reviews is inconsistent with the company\'s known size, age, or industry. These audits are not announced and are not triggered by complaints — they are part of how we maintain the integrity of ratings across the platform.' },
              { label: 'Community flags', body: 'Any user can flag a review they believe is fake. Flags from established accounts with credible review histories carry more investigative weight. Every flag is reviewed by our team within 48 hours.' },
            ].map(({ label, body }) => (
              <div key={label}>
                <p className="font-black text-slate-950">{label}</p>
                <p className="text-slate-600 mt-1">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What Happens When We Find Them */}
        <div id="consequences" className="border-t border-slate-200 pt-10">
          <h2 className="text-lg font-black text-slate-950 mb-5">What Happens When We Find Them</h2>
          <div className="space-y-4 text-sm leading-relaxed">
            {[
              {
                label: 'When a fake review is confirmed',
                body: 'It is removed immediately and permanently. The reviewer\'s account is banned. All other reviews submitted by that account are audited and potentially removed. If the fake review was submitted as part of a coordinated campaign, every review linked to that campaign is removed.',
                color: 'bg-rose-50 border-rose-100',
                textColor: 'text-rose-900',
              },
              {
                label: 'When a company is found to have orchestrated fake positive reviews',
                body: 'All fake reviews are removed. The company receives a formal warning. A permanent notice is added to their profile indicating that reviews were removed for policy violation. This notice is public and cannot be hidden or removed by the company. Repeated violations result in permanent suspension of their ability to claim or manage their page on the platform.',
                color: 'bg-amber-50 border-amber-100',
                textColor: 'text-amber-900',
              },
              {
                label: 'When a coordinated negative campaign is detected against a company',
                body: 'All fake negative reviews are removed. The accounts responsible are permanently banned. The company is informed of what was found and what action was taken.',
                color: 'bg-blue-50 border-blue-100',
                textColor: 'text-blue-900',
              },
            ].map(({ label, body, color, textColor }) => (
              <div key={label} className={`rounded-xl border px-5 py-4 ${color}`}>
                <p className={`font-black text-sm mb-1.5 ${textColor}`}>{label}</p>
                <p className={`text-sm leading-relaxed ${textColor} opacity-80`}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* What We Cannot Promise */}
        <div id="limitations" className="border-t border-slate-200 pt-10">
          <h2 className="text-lg font-black text-slate-950 mb-5">What We Cannot Promise</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-4">
            No system — however well designed — catches every fake review. Some will get through, particularly well-constructed ones from accounts with established history or real human behaviour patterns. We work continuously to improve detection, but we will not claim perfection we do not have.
          </p>
          <div className="rounded-xl bg-[#1e1b4b] px-6 py-5">
            <p className="text-slate-300 text-sm leading-relaxed">
              What we can promise is this — every credible report of a fake review is investigated seriously. Every confirmed fake review is removed. Every account responsible is banned. And we never leave a fake review in place because investigating it is inconvenient or because we cannot immediately determine who is right.
            </p>
          </div>
        </div>

        {/* How to Report */}
        <div id="report" className="border-t border-slate-200 pt-10">
          <h2 className="text-lg font-black text-slate-950 mb-5">How to Report a Suspected Fake Review</h2>
          <div className="space-y-4 text-sm leading-relaxed">
            {[
              { label: 'On any review page', body: 'Click the flag icon below the review and describe why you believe it is fake. Be as specific as possible.' },
              { label: 'By email', body: <>Send the review link and your reason for concern to <a href="mailto:reviews@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">reviews@trustcabbage.com</a>.</> },
              { label: 'Through your dashboard', body: 'Claimed companies can use the dispute review option in their dashboard to formally flag a review for investigation.' },
            ].map(({ label, body }) => (
              <div key={label} className="flex gap-4">
                <div className="mt-1 h-5 w-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#6d28d9] text-[10px] font-black">→</span>
                </div>
                <div>
                  <p className="font-black text-slate-950">{label}</p>
                  <p className="text-slate-600 mt-0.5">{body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-5">
            We acknowledge every report and respond with our finding within <strong className="text-slate-700">48 hours</strong> for urgent flags and <strong className="text-slate-700">7 days</strong> for standard reports.
          </p>
        </div>

        {/* Ongoing Commitment */}
        <div id="commitment" className="border-t border-slate-200 pt-10">
          <div className="rounded-2xl bg-[#1e1b4b] p-8">
            <h2 className="text-lg font-black text-white mb-4">Our Ongoing Commitment</h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-3">
              Fake reviews are not a problem that gets solved once. They evolve as the platform grows and as bad actors find new approaches. Our commitment is not to a fixed set of rules — it is to an ongoing, active effort to keep what people read here as close to the truth as possible.
            </p>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              We commit to publishing an annual transparency report covering the number of reviews removed, accounts banned, and companies warned — so the people who use this platform can see exactly how seriously this commitment is taken.
            </p>
            <p className="text-[#a78bfa] text-sm font-black">
              The value of every genuine review on Trust Cabbage depends on people being able to trust that it is real. We do not take that lightly.
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

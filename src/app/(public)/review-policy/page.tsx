import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Review Policy — Trust Cabbage',
  description: 'How reviews work on Trust Cabbage — who can write them, what they must contain, and how we protect their integrity.',
}

const sections = [
  {
    id: 'who-can-write',
    heading: 'Who Can Write a Review',
    content: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>Anyone who has had a genuine, first-hand experience with a company or brand on Trust Cabbage can write a review. This includes:</p>
        <ul className="space-y-1.5 ml-1">
          {[
            'Current or past clients of a B2B service company',
            'Business owners who evaluated a company during a sales or procurement process',
            'Partners, vendors, or collaborators who have worked alongside a company',
            'Consumers who purchased from an online brand or D2C store',
            'People who visited a physical retail store',
          ].map(item => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6d28d9] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p>You do not need to create a full account to write a review — but you must verify your email address before your review is published. This is not optional. Every review on this platform is tied to a verified identity.</p>
      </div>
    ),
  },
  {
    id: 'what-happens',
    heading: 'What Happens When You Write a Review',
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        {[
          { step: '1', title: 'Identity verification', body: 'Before your review is published, you verify your email address via a one-time code sent to your inbox. No review goes live without this step.' },
          { step: '2', title: 'Association declaration', body: 'You declare your relationship with the company — current client, past client, evaluator, consumer, or partner — and the phase of your engagement. This context is shown alongside your review so readers understand whose perspective they are reading.' },
          { step: '3', title: 'Rating', body: 'You rate the company across the factors most relevant to your type of experience. For B2B companies — staff behaviour, service quality, communication, billing, after-sales support, and delivery. For online brands — product accuracy, packaging, delivery speed, returns experience, value for money, and customer support.' },
          { step: '4', title: 'Written review', body: 'You answer structured questions that go beyond a star rating. What went well. What could have been better. Whether you would recommend them. And anything specific worth sharing.' },
          { step: '5', title: 'Optional proof upload', body: 'Upload a document, invoice, agreement, order confirmation, or any evidence of your association with the company. This earns you a Verified Buyer or Verified Client badge on your review — and gives your experience more weight in the company\'s overall rating.' },
        ].map(({ step, title, body }) => (
          <div key={step} className="flex gap-4">
            <div className="h-7 w-7 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-black text-[#6d28d9]">{step}</span>
            </div>
            <div>
              <p className="font-black text-slate-950">{title}</p>
              <p className="text-slate-600 mt-1">{body}</p>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'good-review',
    heading: 'What a Good Review Looks Like',
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        {[
          { label: 'Honest', body: 'Write what you genuinely experienced. Your review should reflect your real interaction with the company, not a generalisation or assumption.' },
          { label: 'Specific', body: '"The development team missed the agreed deadline by three weeks and did not communicate proactively" is more useful than "bad service."' },
          { label: 'First-hand', body: 'Write only about your own experience. Do not write on behalf of someone else or based on what you heard from others.' },
          { label: 'Fair', body: 'Both positive and negative experiences are equally valid. A review that honestly acknowledges strengths and areas for improvement is more credible than one that is entirely one-sided.' },
          { label: 'Focused on the experience, not the person', body: 'Describe how a company behaved, not individual people by name. Review the business relationship, not individuals personally.' },
        ].map(({ label, body }) => (
          <div key={label}>
            <span className="font-black text-slate-950">{label} — </span>
            <span className="text-slate-600">{body}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'must-not-be',
    heading: 'What Reviews Must Not Be',
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        {[
          { label: 'Fake', body: 'Do not write a review for a company you have not genuinely engaged with. This includes reviews written by employees, founders, friends, or anyone with a personal or financial connection to the company being reviewed.' },
          { label: 'Incentivised', body: 'Do not write a review in exchange for a discount, free product, cash, or any other benefit. Even if your experience was genuine, an incentivised review compromises the independence that makes it valuable.' },
          { label: 'Defamatory', body: 'Do not make false factual claims about a company with the intent to damage their reputation. An honest negative review is protected. A deliberately false statement is not.' },
          { label: 'Competitor-motivated', body: 'Do not write negative reviews about companies because they compete with a business you are associated with.' },
          { label: 'Repeated', body: 'Do not submit more than one review for the same company.' },
        ].map(({ label, body }) => (
          <div key={label} className="flex gap-3">
            <span className="mt-1 text-rose-500 flex-shrink-0 font-black text-xs">✕</span>
            <div>
              <span className="font-black text-slate-950">{label} — </span>
              <span className="text-slate-600">{body}</span>
            </div>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'company-response',
    heading: 'How Companies Can Respond',
    content: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>Any company that has claimed their page on Trust Cabbage can reply publicly to any review. Responses appear directly below the review and are visible to everyone who reads it.</p>
        <p>A company response is an opportunity to acknowledge feedback, provide context, explain what has changed, or simply thank a client for taking the time. It is not an opportunity to attack the reviewer, dispute their right to share their experience, or use language that is threatening or dismissive.</p>
        <p>Responses that cross these lines will be removed. The review will remain.</p>
      </div>
    ),
  },
  {
    id: 'flagging',
    heading: 'Flagging a Review',
    content: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>Any user can flag a review they believe violates this policy. Companies can flag reviews through their dashboard. Flagging a review does not remove it — it places it in a queue for our team to investigate.</p>
        <p>Our team reviews every flag and responds within 48 hours. We consider both the reviewer's account history and the company's claim before making any decision.</p>
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-amber-800">
          <span className="font-black">What flagging cannot do — </span>a company cannot use the flagging system to remove a negative review simply because they disagree with it or find it uncomfortable. A negative experience honestly described is a valid review. Disagreement with a review is not grounds for its removal.
        </div>
      </div>
    ),
  },
  {
    id: 'removal',
    heading: 'When a Review Is Removed',
    content: (
      <div className="space-y-3 text-slate-600 text-sm leading-relaxed">
        <p>Reviews are removed only when:</p>
        <ul className="space-y-1.5 ml-1">
          {[
            'The review is confirmed to be fake — written by someone with no genuine association with the company',
            'The review contains demonstrably false factual claims that materially misrepresent the company',
            'The review was written in exchange for an incentive',
            'The review contains personal attacks on named individuals',
            'The reviewer requests removal within 24 hours of submission',
          ].map(item => (
            <li key={item} className="flex gap-2.5">
              <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6d28d9] flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <p className="font-bold text-slate-800">Reviews are never removed because a company is unhappy with the content or the rating. A company's discomfort with an honest review is not a reason to remove it.</p>
      </div>
    ),
  },
  {
    id: 'editing',
    heading: 'Editing Your Review',
    content: (
      <p className="text-slate-600 text-sm leading-relaxed">
        You can edit your review within 24 hours of submission. After that, your review is locked. If your experience with a company changes significantly — for better or worse — contact us and we will consider updating your review with a note indicating it has been revised and why.
      </p>
    ),
  },
  {
    id: 'one-review',
    heading: 'One Review Per Company',
    content: (
      <p className="text-slate-600 text-sm leading-relaxed">
        Each verified reviewer can write one review per company. If you have worked with a company across multiple projects or engagements over a long period, your single review should reflect the overall experience rather than a single interaction.
      </p>
    ),
  },
  {
    id: 'questions',
    heading: 'Questions About This Policy',
    content: (
      <p className="text-slate-600 text-sm leading-relaxed">
        If you have a question about a specific review, a flagging decision, or anything covered in this policy, contact us at{' '}
        <a href="mailto:reviews@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">reviews@trustcabbage.com</a>.
        {' '}We respond to every genuine query.
      </p>
    ),
  },
]

export default function ReviewPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1e1b4b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-4">Trust & Integrity</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Our Review Policy
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed max-w-xl">
            Every review on Trust Cabbage is someone's real experience — written honestly, verified independently, and published permanently.
          </p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {sections.map((section, i) => (
          <div key={section.id} id={section.id} className={i > 0 ? 'border-t border-slate-200 pt-10' : ''}>
            <h2 className="text-lg font-black text-slate-950 mb-5">{section.heading}</h2>
            {section.content}
          </div>
        ))}
      </div>
    </div>
  )
}

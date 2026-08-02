import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service | Trust Cabbage',
  description: 'The terms governing your use of Trust Cabbage, our review platform for Indian businesses and brands.',
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="text-slate-600 text-sm leading-relaxed">{children}</p>
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="font-black text-slate-950 text-sm mt-5 mb-2">{children}</h3>
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 ml-1">
      {items.map(item => (
        <li key={item} className="flex gap-2.5 text-slate-600 text-sm leading-relaxed">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#6d28d9] flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  )
}

const sections: { id: string; heading: string; body: React.ReactNode }[] = [
  {
    id: 'about',
    heading: '1. About the Platform',
    body: (
      <div className="space-y-3">
        <P>Trust Cabbage is an online review and discovery platform that enables:</P>
        <Bullets items={[
          'Users to search for Indian B2B service companies, online brands, and retail stores',
          'Verified reviewers to publish honest, first-hand reviews of companies and brands',
          'Businesses and brands to claim, manage, and build their public reputation on the Platform',
        ]} />
        <P>These Terms constitute a legally binding agreement between you and Trust Cabbage (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) governing your use of www.trustcabbage.com and all related features, tools, and services (collectively, the &quot;Platform&quot;). These Terms are governed by the laws of India, including the Information Technology Act, 2000, the Consumer Protection Act, 2019, and the Contract Act, 1872.</P>
      </div>
    ),
  },
  {
    id: 'eligibility',
    heading: '2. Eligibility',
    body: (
      <div className="space-y-3">
        <P>To use Trust Cabbage, you must:</P>
        <Bullets items={[
          'Be at least 18 years of age',
          'Be legally capable of entering into a binding contract under Indian law',
          'Not have been previously suspended or banned from the Platform',
          'Use the Platform only for lawful purposes',
        ]} />
        <P>By using the Platform, you represent and warrant that you meet all of these requirements. If you are using the Platform on behalf of a company or organisation, you represent that you have the authority to bind that entity to these Terms.</P>
      </div>
    ),
  },
  {
    id: 'account',
    heading: '3. Account Registration',
    body: (
      <div>
        <H3>3.1 Creating an Account</H3>
        <div className="space-y-3">
          <P>Some features of the Platform, including writing reviews and claiming a company page, require you to create an account. When registering, you must:</P>
          <Bullets items={[
            'Provide accurate, complete, and current information',
            'Use your real name and a valid email address you own and control',
            'Create a strong, unique password and keep it confidential',
            'Verify your email address when prompted',
          ]} />
          <P>You are responsible for all activity that occurs under your account. If you believe your account has been compromised, notify us immediately at <a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a>.</P>
        </div>

        <H3>3.2 Account Types</H3>
        <div className="space-y-3">
          <P><span className="font-black text-slate-950">Reviewer account, </span>for individuals who want to write reviews and build a reviewer profile on the Platform.</P>
          <P><span className="font-black text-slate-950">Business account, </span>for companies and brands that want to claim and manage their page, respond to reviews, and access business features.</P>
          <P>You may hold both a reviewer account and a business account using the same email address, but the roles are distinct and governed separately under these Terms.</P>
        </div>

        <H3>3.3 Account Termination</H3>
        <div className="space-y-3">
          <P>You may delete your account at any time through your account settings. Upon deletion:</P>
          <Bullets items={[
            'Your account and profile information will be removed',
            'Reviews you have published will remain on the Platform but will be anonymised, your name will be replaced with "Former Reviewer"',
            'Any active subscription will not be automatically refunded for unused periods unless required by applicable law',
          ]} />
          <P>We reserve the right to suspend or terminate your account at any time if we determine that you have violated these Terms, our Review Policy, or any applicable law.</P>
        </div>
      </div>
    ),
  },
  {
    id: 'reviews',
    heading: '4. Reviews, Rules and Responsibilities',
    body: (
      <div>
        <H3>4.1 Who Can Write a Review</H3>
        <P>You may write a review on Trust Cabbage only if you have had a genuine, first-hand experience with the company or brand being reviewed. Reviews must be based on your own direct experience, not on what you heard from others, read elsewhere, or imagined.</P>

        <H3>4.2 What You Agree When You Submit a Review</H3>
        <div className="space-y-3">
          <P>By submitting a review, you confirm that:</P>
          <Bullets items={[
            'You have had a genuine, direct experience with the company or brand you are reviewing',
            'The review is your honest, personal account of that experience',
            'The review does not contain false statements of fact',
            'You have not been offered or received any incentive to write the review',
            'You are not an employee, founder, investor, family member, or associate of the company being reviewed (for positive reviews)',
            'You are not affiliated with a competitor of the company being reviewed (for negative reviews)',
            'You have not submitted and will not submit another review for the same company',
          ]} />
        </div>

        <H3>4.3 Review Content Standards</H3>
        <div className="space-y-3">
          <P>Reviews must not contain:</P>
          <Bullets items={[
            'False statements of fact about a company or its employees',
            'Content that is defamatory, threatening, harassing, or abusive',
            'Personal attacks on named individuals',
            'Discriminatory content based on religion, caste, gender, race, or any other protected characteristic',
            'Sexually explicit or obscene content',
            'Private or confidential information about a company or its employees that you were not authorised to disclose',
            'Content that infringes the intellectual property rights of any third party',
            'Promotional content or advertising for any product or service',
            'Content that violates any applicable law',
          ]} />
        </div>

        <H3>4.4 Review Ownership and Licence</H3>
        <div className="space-y-3">
          <P>You retain ownership of the review content you submit. By submitting a review, you grant Trust Cabbage a worldwide, royalty-free, non-exclusive, perpetual licence to use, reproduce, publish, display, translate, and distribute your review content on the Platform and in connection with our services, including in marketing materials, press releases, and third-party integrations, without further compensation to you.</P>
          <P>This licence continues even if you delete your account, as your review content may form part of a company&apos;s permanent public record.</P>
        </div>

        <H3>4.5 Review Moderation</H3>
        <div className="space-y-3">
          <P>We reserve the right to review, moderate, delay publication of, or remove any review that we believe violates these Terms or our Review Policy. Moderation decisions are made at our sole discretion.</P>
          <P>Removal of a review does not automatically entitle the reviewer to any compensation or explanation, though we will endeavour to notify reviewers when their content is removed and the reason why.</P>
        </div>

        <H3>4.6 Company Responses</H3>
        <P>Claimed companies may respond publicly to reviews. Company responses are subject to the same content standards as reviews. We reserve the right to remove responses that violate these standards.</P>
      </div>
    ),
  },
  {
    id: 'company-pages',
    heading: '5. Company Pages',
    body: (
      <div>
        <H3>5.1 Unclaimed Pages</H3>
        <div className="space-y-3">
          <P>Company pages may be created by any user who has had an experience with that company. An unclaimed page contains only the information provided by the reviewer who created it, along with any reviews that have been submitted.</P>
          <P>The existence of an unclaimed page does not imply any endorsement, verification, or relationship between Trust Cabbage and the company named on that page.</P>
        </div>

        <H3>5.2 Claiming a Page</H3>
        <div className="space-y-3">
          <P>A company may claim its page by submitting proof of ownership, a GST certificate, CIN number, or domain email verification. Claims are reviewed and approved by our team. Approval may take up to 48 hours.</P>
          <P>By submitting a claim, you represent that:</P>
          <Bullets items={[
            'You are an authorised representative of the company named on the page',
            'The proof of ownership you submit is genuine and accurate',
            'You have the authority to manage the company\'s page on behalf of the company',
          ]} />
          <P>Submitting false information in a claim request is a violation of these Terms and may result in permanent suspension.</P>
        </div>

        <H3>5.3 What Claimed Companies Can Do</H3>
        <div className="space-y-3">
          <P>Once a page is claimed, the company may:</P>
          <Bullets items={[
            'Update the company profile, description, logo, and cover image',
            'Add, edit, or remove products and services listed on the page',
            'Respond publicly to reviews',
            'Send review invite links to clients',
            'Embed the Trust Cabbage review widget on their website',
            'Access analytics through the company dashboard',
            'Purchase subscription plans and advertising features',
          ]} />
        </div>

        <H3>5.4 What Claimed Companies Cannot Do</H3>
        <div className="space-y-3">
          <P>Companies cannot, under any circumstances:</P>
          <Bullets items={[
            'Delete their company page from the Platform',
            'Delete, hide, or edit reviews written about them by third parties',
            'Remove verified ratings from their overall score',
            'Purchase or otherwise obtain a higher rating or more prominent placement in organic listings',
            'Use their claimed status to retaliate against reviewers who have written honest negative reviews',
          ]} />
          <P>Attempting to do any of the above is a violation of these Terms and may result in suspension of the company&apos;s claimed status.</P>
        </div>

        <H3>5.5 Company Responsibility for Content</H3>
        <P>Companies are responsible for the accuracy and completeness of the information they add to their page, including product descriptions, service details, pricing information, and any other content they publish. Trust Cabbage does not verify the accuracy of company-submitted content and is not liable for any inaccuracy.</P>
      </div>
    ),
  },
  {
    id: 'subscriptions',
    heading: '6. Subscriptions and Payments',
    body: (
      <div>
        <H3>6.1 Free and Paid Plans</H3>
        <P>Trust Cabbage offers both free and paid subscription plans for businesses. The features available under each plan are described on our Pricing page at www.trustcabbage.com/pricing, which may be updated from time to time.</P>

        <H3>6.2 Billing</H3>
        <div className="space-y-3">
          <P>Paid plans are billed on a monthly or annual basis as selected at the time of purchase. Payment is processed through Razorpay or PayU. By subscribing, you authorise Trust Cabbage to charge your selected payment method on a recurring basis until you cancel.</P>
          <P>All prices are in Indian Rupees (INR) and are inclusive of applicable GST unless stated otherwise.</P>
        </div>

        <H3>6.3 Cancellation and Refunds</H3>
        <div className="space-y-3">
          <P>You may cancel your subscription at any time through your dashboard. Cancellation takes effect at the end of the current billing period, you will retain access to paid features until then.</P>
          <P>We do not offer refunds for unused portions of a subscription period except where:</P>
          <Bullets items={[
            'The cancellation is within 7 days of the initial purchase (cooling-off period for first-time subscribers)',
            'A technical error on our part resulted in a charge you did not authorise',
            'Refund is required under applicable Indian consumer protection law',
          ]} />
        </div>

        <H3>6.4 Changes to Pricing</H3>
        <P>We may change subscription pricing at any time. If we increase the price of your current plan, we will notify you at least 30 days in advance by email. If you do not cancel before the new price takes effect, you will be charged at the new rate on your next billing date.</P>
      </div>
    ),
  },
  {
    id: 'advertising',
    heading: '7. Advertising and Sponsored Content',
    body: (
      <div>
        <H3>7.1 Paid Placements</H3>
        <P>Trust Cabbage offers paid advertising features, including featured listings in category pages, sponsored cards in search results, and display placements. All paid placements are clearly labelled as &quot;Sponsored&quot; and are distinct from organic listings.</P>

        <H3>7.2 No Influence on Ratings</H3>
        <P>Paid advertising does not influence a company&apos;s rating, review content, or position in organic search results. Companies that advertise on Trust Cabbage receive no preferential treatment in how their reviews are displayed or moderated.</P>

        <H3>7.3 Advertiser Responsibility</H3>
        <P>Advertisers are responsible for ensuring that their advertising content complies with all applicable laws, including the Consumer Protection Act, 2019, the Advertising Standards Council of India (ASCI) guidelines, and any other relevant regulations. Trust Cabbage reserves the right to refuse or remove advertising content that is misleading, false, or in violation of applicable standards.</P>
      </div>
    ),
  },
  {
    id: 'ip',
    heading: '8. Intellectual Property',
    body: (
      <div>
        <H3>8.1 Our Content</H3>
        <div className="space-y-3">
          <P>All content on the Platform that is not user-generated, including the Trust Cabbage name, logo, design, software, text, graphics, and data compilations, is the intellectual property of Trust Cabbage and is protected by applicable Indian and international intellectual property laws.</P>
          <P>You may not copy, reproduce, modify, distribute, or create derivative works from our content without our prior written permission.</P>
        </div>

        <H3>8.2 Your Content</H3>
        <P>As described in Section 4.4, you retain ownership of the review content you submit but grant us a licence to use it. You represent that you own or have the right to submit all content you provide to the Platform and that your content does not infringe the intellectual property rights of any third party.</P>

        <H3>8.3 Reporting Infringement</H3>
        <P>If you believe that content on the Platform infringes your intellectual property rights, please send a written notice to <a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a> including a description of the work allegedly infringed, the location of the infringing content on the Platform, your contact details, and a statement that you have a good faith belief that the use is not authorised.</P>
      </div>
    ),
  },
  {
    id: 'prohibited',
    heading: '9. Prohibited Conduct',
    body: (
      <div className="space-y-3">
        <P>You agree not to use the Platform to:</P>
        <Bullets items={[
          'Submit fake, fraudulent, or incentivised reviews',
          'Create fake accounts or impersonate any person or entity',
          'Scrape, crawl, or otherwise extract data from the Platform using automated tools without our prior written permission',
          'Introduce malware, viruses, or any other malicious code',
          'Attempt to gain unauthorised access to any part of the Platform or its underlying infrastructure',
          'Use the Platform to send spam, unsolicited messages, or commercial communications not authorised under these Terms',
          'Interfere with or disrupt the operation of the Platform or the servers and networks connected to it',
          'Use the Platform in any way that violates applicable Indian law or the rights of any third party',
          'Reverse engineer, decompile, or disassemble any part of the Platform',
          'Use the Platform to defame, harass, threaten, or abuse any person',
        ]} />
        <P>Violation of any of the above may result in immediate account suspension and may be reported to law enforcement where appropriate.</P>
      </div>
    ),
  },
  {
    id: 'disclaimers',
    heading: '10. Disclaimers',
    body: (
      <div>
        <H3>10.1 Review Content</H3>
        <div className="space-y-3">
          <P>Trust Cabbage is a platform for user-generated review content. We do not endorse, verify (beyond the identity verification described in our Review Policy), or take responsibility for the accuracy, completeness, or reliability of any review published on the Platform.</P>
          <P>Reviews represent the personal opinion and experience of the reviewer. They are not statements of fact made by Trust Cabbage. We are not liable for any reliance you place on review content published on the Platform.</P>
        </div>

        <H3>10.2 Company Information</H3>
        <P>Company profiles on Trust Cabbage may contain information submitted by the company itself or by users. We do not verify the accuracy of company-submitted information, including descriptions, product details, and service claims. You should independently verify any information before entering into a business relationship.</P>

        <H3>10.3 Platform Availability</H3>
        <P>We strive to keep the Platform available at all times but do not guarantee uninterrupted access. The Platform may be temporarily unavailable due to maintenance, updates, or factors outside our control. We are not liable for any loss resulting from Platform unavailability.</P>

        <H3>10.4 No Professional Advice</H3>
        <P>Nothing on Trust Cabbage constitutes professional, legal, financial, medical, or any other regulated advice. Reviews and ratings are the personal opinions of individual users and should not be relied upon as a substitute for professional advice relevant to your specific situation.</P>
      </div>
    ),
  },
  {
    id: 'liability',
    heading: '11. Limitation of Liability',
    body: (
      <div className="space-y-3">
        <P>To the fullest extent permitted by applicable Indian law:</P>
        <P>Trust Cabbage&apos;s total liability to you for any claim arising out of or related to these Terms or your use of the Platform, whether in contract, tort, or otherwise, is limited to the amount you paid to Trust Cabbage in the 3 months immediately preceding the event giving rise to the claim, or INR 5,000, whichever is greater.</P>
        <P>We are not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, loss of business opportunity, or reputational damage, arising from your use of the Platform, even if we have been advised of the possibility of such damages.</P>
        <P>Nothing in these Terms limits our liability for death or personal injury caused by our negligence, fraud, or any other liability that cannot be excluded under applicable Indian law.</P>
      </div>
    ),
  },
  {
    id: 'indemnification',
    heading: '12. Indemnification',
    body: (
      <div className="space-y-3">
        <P>You agree to indemnify, defend, and hold harmless Trust Cabbage and its directors, officers, employees, and agents from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable legal fees) arising out of or in connection with:</P>
        <Bullets items={[
          'Your use of the Platform in violation of these Terms',
          'Any review content or other content you submit to the Platform',
          'Your violation of any third party\'s rights, including intellectual property rights',
          'Your violation of any applicable law',
        ]} />
      </div>
    ),
  },
  {
    id: 'third-party',
    heading: '13. Third-Party Links and Services',
    body: (
      <div className="space-y-3">
        <P>The Platform may contain links to third-party websites, company websites, or external services. These links are provided for convenience. We do not control and are not responsible for the content, privacy practices, or terms of any third-party website or service.</P>
        <P>The inclusion of any link does not imply our endorsement of the linked website or its content.</P>
      </div>
    ),
  },
  {
    id: 'governing-law',
    heading: '14. Governing Law and Dispute Resolution',
    body: (
      <div>
        <P>These Terms are governed by and construed in accordance with the laws of India, without regard to conflict of law principles.</P>

        <H3>14.1 Informal Resolution</H3>
        <P>If you have a dispute with us, please contact us first at <a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a>. We will try to resolve the dispute informally within 30 days.</P>

        <H3>14.2 Arbitration</H3>
        <div className="space-y-3">
          <P>If informal resolution is unsuccessful, any dispute, controversy, or claim arising out of or relating to these Terms or the Platform, including disputes about the validity, interpretation, breach, or termination of these Terms, shall be resolved by binding arbitration under the Arbitration and Conciliation Act, 1996.</P>
          <P>The arbitration shall be conducted by a sole arbitrator mutually agreed upon by both parties, or appointed in accordance with the Act if no agreement is reached. The seat and venue of arbitration shall be [City, India]. The language of arbitration shall be English.</P>
        </div>

        <H3>14.3 Jurisdiction</H3>
        <P>Without prejudice to the arbitration clause above, both parties submit to the exclusive jurisdiction of the courts at [City], India for interim or injunctive relief and for enforcement of arbitral awards.</P>
      </div>
    ),
  },
  {
    id: 'changes',
    heading: '15. Changes to These Terms',
    body: (
      <div className="space-y-3">
        <P>We may update these Terms from time to time. When we make material changes, we will notify you by email (if you have an account) and by displaying a prominent notice on the Platform at least 14 days before the changes take effect.</P>
        <P>Your continued use of the Platform after the effective date of the updated Terms constitutes your acceptance of those Terms. If you do not agree to the updated Terms, you must stop using the Platform and delete your account before the effective date.</P>
      </div>
    ),
  },
  {
    id: 'misc',
    heading: '16. Miscellaneous',
    body: (
      <div className="space-y-3">
        <P><span className="font-black text-slate-950">Entire agreement, </span>these Terms, together with our Privacy Policy and Review Policy, constitute the entire agreement between you and Trust Cabbage regarding the Platform and supersede all prior agreements and understandings.</P>
        <P><span className="font-black text-slate-950">Severability, </span>if any provision of these Terms is found to be unenforceable, that provision will be modified to the minimum extent necessary to make it enforceable, and the remaining provisions will continue in full force and effect.</P>
        <P><span className="font-black text-slate-950">Waiver, </span>our failure to enforce any right or provision of these Terms will not constitute a waiver of that right or provision.</P>
        <P><span className="font-black text-slate-950">Assignment, </span>you may not assign or transfer your rights or obligations under these Terms without our prior written consent. We may assign our rights and obligations without restriction.</P>
        <P><span className="font-black text-slate-950">Force majeure, </span>we are not liable for any failure or delay in performance due to causes beyond our reasonable control, including natural disasters, acts of government, internet outages, or other circumstances outside our control.</P>
        <P><span className="font-black text-slate-950">Language, </span>these Terms are written in English. In case of any conflict between an English version and a translated version, the English version prevails.</P>
      </div>
    ),
  },
  {
    id: 'contact',
    heading: '17. Contact Us',
    body: (
      <div className="space-y-4">
        <P>For any questions about these Terms of Service:</P>
        <div className="text-sm text-slate-600 space-y-1">
          <p><span className="font-black text-slate-950">Email: </span><a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a></p>
          <p><span className="font-black text-slate-950">Website: </span>www.trustcabbage.com/contact</p>
        </div>
        <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
          <p className="font-black text-slate-950 text-sm mb-1.5">Grievance Officer (IT Act 2000)</p>
          <div className="text-sm text-slate-600 space-y-1">
            <p><span className="font-black text-slate-950">Phone: </span>9993802466</p>
            <p><span className="font-black text-slate-950">Response time: </span>Within 30 days of receipt</p>
          </div>
        </div>
      </div>
    ),
  },
]

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1e1b4b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-4">Legal</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Terms of Service
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed max-w-xl">
            The terms governing your use of Trust Cabbage. Please read them carefully before using the Platform.
          </p>
          <p className="text-slate-400 text-xs mt-6">Last updated: August 2026 &middot; Effective date: August 2026</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {sections.map((section, i) => (
          <div key={section.id} id={section.id} className={i > 0 ? 'border-t border-slate-200 pt-10' : ''}>
            <h2 className="text-lg font-black text-slate-950 mb-3">{section.heading}</h2>
            {section.body}
          </div>
        ))}
      </div>
    </div>
  )
}

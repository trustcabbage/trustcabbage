import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Trust Cabbage',
  description: 'How Trust Cabbage collects, uses, stores, and protects your personal information.',
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

const providers = [
  { name: 'Supabase', purpose: 'Database, authentication, file storage', shared: 'All platform data stored securely' },
  { name: 'Vercel', purpose: 'Website hosting and delivery', shared: 'Server logs, IP addresses' },
  { name: 'Resend', purpose: 'Transactional email delivery', shared: 'Email address, email content' },
  { name: 'Razorpay / PayU', purpose: 'Payment processing', shared: 'Name, email, payment amount' },
  { name: 'Google', purpose: 'OAuth sign-in', shared: 'Name, email (received from Google)' },
  { name: 'LinkedIn', purpose: 'OAuth sign-in', shared: 'Name, email (received from LinkedIn)' },
]

const sections: { id: string; heading: string; body: React.ReactNode }[] = [
  {
    id: 'who-we-are',
    heading: '1. Who We Are',
    body: (
      <div className="space-y-3">
        <P>Trust Cabbage is an online review and discovery platform for Indian B2B service companies, online brands, and retail stores. The Platform allows users to search for companies and brands, read and write verified reviews, and helps businesses build and manage their public reputation.</P>
        <P>For the purposes of this policy, Trust Cabbage is the Data Fiduciary responsible for determining how and why your personal data is processed.</P>
        <div className="text-sm text-slate-600 space-y-1">
          <p><span className="font-black text-slate-950">Grievance Officer: </span>see Section 15</p>
        </div>
      </div>
    ),
  },
  {
    id: 'information-we-collect',
    heading: '2. Information We Collect',
    body: (
      <div>
        <P>We collect different types of information depending on how you use the Platform.</P>

        <H3>2.1 Information You Give Us Directly</H3>
        <div className="space-y-3">
          <P><span className="font-black text-slate-950">When you create an account:</span></P>
          <Bullets items={[
            'Full name',
            'Email address',
            'Password (stored in encrypted form, we never store plain text passwords)',
            'Profile photo (optional)',
            'Role, whether you are signing up as a reviewer or a business',
          ]} />
          <P><span className="font-black text-slate-950">When you write a review:</span></P>
          <Bullets items={[
            'Your association with the company being reviewed (current client, past client, consumer, etc.)',
            'Your role in the engagement (decision maker, end user, procurement, etc.)',
            'The phase of engagement and duration',
            'Star ratings across multiple factors',
            'Written review content',
            'Whether you would recommend the company',
            'Any photos you upload of products received',
          ]} />
          <P><span className="font-black text-slate-950">When you upload proof of association:</span></P>
          <Bullets items={[
            'Documents such as invoices, agreements, order confirmations, or email screenshots',
            'These are stored securely and used only to verify your association with the company',
          ]} />
          <P><span className="font-black text-slate-950">When you create or claim a company page:</span></P>
          <Bullets items={[
            'Company name, website, description, city, state',
            'GST number or CIN number (for verification purposes)',
            'Company logo and cover image',
            'Details of products and services offered',
            'Proof of ownership documents (for claim verification)',
          ]} />
          <P><span className="font-black text-slate-950">When you contact us:</span></P>
          <Bullets items={['Your name, email address, and the content of your message']} />
        </div>

        <H3>2.2 Information We Collect Automatically</H3>
        <div className="space-y-3">
          <P>When you visit or use the Platform, we automatically collect:</P>
          <Bullets items={[
            'Device information, device type, operating system, browser type and version, screen resolution',
            'Usage information, pages visited, features used, time spent, clicks, search queries entered',
            'Log data, IP address, date and time of access, referring URLs, error logs',
            'Cookies and similar technologies, see Section 9 for full details',
          ]} />
        </div>

        <H3>2.3 Information From Third Parties</H3>
        <div className="space-y-3">
          <P><span className="font-black text-slate-950">Google OAuth, </span>if you choose to sign in with Google, we receive your name, email address, and profile photo from Google. We do not receive your Google password.</P>
          <P><span className="font-black text-slate-950">LinkedIn OAuth, </span>if you choose to sign in with LinkedIn, we receive your name, email address, and professional profile information you have made public on LinkedIn.</P>
          <P><span className="font-black text-slate-950">Payment providers, </span>if you subscribe to a paid plan, payment is processed by Razorpay or PayU. We do not store your card details. We receive confirmation of payment and your subscription status from the payment provider.</P>
        </div>
      </div>
    ),
  },
  {
    id: 'how-we-use',
    heading: '3. How We Use Your Information',
    body: (
      <div>
        <P>We use the information we collect for the following purposes:</P>

        <H3>3.1 To Provide the Platform</H3>
        <Bullets items={[
          'Creating and managing your account',
          'Publishing and displaying your reviews',
          'Displaying company profiles, ratings, and review content',
          'Enabling company claim and verification flows',
          'Sending review invite links and widgets on behalf of claimed companies',
          'Processing subscription payments',
        ]} />

        <H3>3.2 To Verify Identity and Prevent Fraud</H3>
        <Bullets items={[
          'Verifying your email address before publishing a review',
          'Detecting and preventing fake reviews, coordinated campaigns, and abusive behaviour',
          'Monitoring IP addresses and device fingerprints to identify suspicious patterns',
          'Verifying company ownership documents during the claim process',
        ]} />

        <H3>3.3 To Communicate With You</H3>
        <Bullets items={[
          'Sending email OTP codes for identity verification',
          'Sending review invite emails on behalf of companies you have a relationship with',
          'Sending notifications about activity on your reviews or company page',
          'Responding to your support queries and feedback',
          'Sending platform updates, policy changes, and important notices',
        ]} />

        <H3>3.4 To Improve the Platform</H3>
        <Bullets items={[
          'Analysing usage patterns to understand how the Platform is being used',
          'Identifying features that are working well and areas that need improvement',
          'Conducting research and analytics to inform product decisions',
          'Testing new features with subsets of users',
        ]} />

        <H3>3.5 Legal and Compliance Purposes</H3>
        <Bullets items={[
          'Complying with applicable Indian laws and regulations',
          'Responding to lawful requests from government authorities or courts',
          'Enforcing our Terms of Service and Review Policy',
          'Protecting the rights, property, or safety of Trust Cabbage, our users, and the public',
        ]} />
      </div>
    ),
  },
  {
    id: 'legal-basis',
    heading: '4. Legal Basis for Processing',
    body: (
      <div className="space-y-3">
        <P>Under the Digital Personal Data Protection Act, 2023, we process your personal data on the following lawful bases:</P>
        <P><span className="font-black text-slate-950">Consent, </span>where you have given us clear consent to process your data for a specific purpose, such as creating an account, writing a review, or receiving marketing communications.</P>
        <P><span className="font-black text-slate-950">Contractual necessity, </span>where processing is necessary to fulfil our agreement with you, for example, publishing your review, managing your company page, or processing your subscription.</P>
        <P><span className="font-black text-slate-950">Legitimate interests, </span>where processing is necessary for our legitimate business interests, such as fraud prevention, platform security, and improving our services, provided those interests do not override your rights.</P>
        <P><span className="font-black text-slate-950">Legal obligation, </span>where we are required by law to process your data, such as responding to lawful government requests.</P>
        <P>You have the right to withdraw consent at any time where consent is the basis for processing. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.</P>
      </div>
    ),
  },
  {
    id: 'how-we-share',
    heading: '5. How We Share Your Information',
    body: (
      <div>
        <div className="space-y-3">
          <P>We do not sell your personal data. We do not share your personal data with third parties for their own marketing purposes.</P>
          <P>We share your information only in the following circumstances:</P>
        </div>

        <H3>5.1 Information That Is Publicly Visible by Design</H3>
        <div className="space-y-3">
          <P>The following information is publicly visible on the Platform as part of its core function:</P>
          <Bullets items={[
            'Your display name (first name and city) alongside your reviews',
            'Your review content, ratings, and association declaration',
            'Your verified buyer or verified client badge, if applicable',
            'Your reviewer profile, if you have created one',
          ]} />
          <P>You understand and agree that reviews you publish on Trust Cabbage are public and may be seen by anyone, including the company being reviewed, other users, and search engines.</P>
        </div>

        <H3>5.2 Service Providers</H3>
        <div className="space-y-3">
          <P>We share data with trusted third-party service providers who help us operate the Platform:</P>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-100 text-slate-950">
                  <th className="px-4 py-2.5 font-black">Provider</th>
                  <th className="px-4 py-2.5 font-black">Purpose</th>
                  <th className="px-4 py-2.5 font-black">Data shared</th>
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <tr key={p.name} className={i > 0 ? 'border-t border-slate-200' : ''}>
                    <td className="px-4 py-2.5 text-slate-950 font-bold whitespace-nowrap">{p.name}</td>
                    <td className="px-4 py-2.5 text-slate-600">{p.purpose}</td>
                    <td className="px-4 py-2.5 text-slate-600">{p.shared}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <P>All service providers are bound by data processing agreements and are required to handle your data securely and only for the purposes we specify.</P>
        </div>

        <H3>5.3 Legal Requirements</H3>
        <P>We may disclose your information when required to do so by law, including in response to a court order, government request, or other legal process, or when we believe disclosure is necessary to protect our rights, prevent fraud, or ensure the safety of our users.</P>

        <H3>5.4 Business Transfers</H3>
        <P>If Trust Cabbage is involved in a merger, acquisition, or sale of assets, your personal data may be transferred as part of that transaction. We will notify you before your data is transferred and becomes subject to a different privacy policy.</P>
      </div>
    ),
  },
  {
    id: 'retention',
    heading: '6. Data Retention',
    body: (
      <div className="space-y-3">
        <P>We retain your personal data for as long as necessary to provide the Platform and fulfil the purposes described in this policy.</P>
        <P><span className="font-black text-slate-950">Account data, </span>retained for the duration of your account and for 3 years after account deletion, for legal and fraud prevention purposes.</P>
        <P><span className="font-black text-slate-950">Review content, </span>reviews are retained permanently as part of the public record of a company&apos;s reputation. If your account is deleted, your reviews remain published but your personal details are anonymised, your display name is replaced with &quot;Former Reviewer.&quot;</P>
        <P><span className="font-black text-slate-950">Proof of association documents, </span>retained for 1 year after the review is verified, then deleted.</P>
        <P><span className="font-black text-slate-950">Company verification documents, </span>retained for 3 years after the claim is approved or rejected.</P>
        <P><span className="font-black text-slate-950">Log data and IP addresses, </span>retained for 90 days for security and fraud detection purposes.</P>
        <P><span className="font-black text-slate-950">Payment records, </span>retained for 7 years as required by Indian tax and accounting law.</P>
      </div>
    ),
  },
  {
    id: 'security',
    heading: '7. Data Security',
    body: (
      <div className="space-y-3">
        <P>We take the security of your personal data seriously and implement appropriate technical and organisational measures to protect it.</P>
        <P><span className="font-black text-slate-950">Encryption, </span>all data transmitted between your browser and our servers is encrypted using TLS. Passwords are hashed using industry-standard algorithms and are never stored in plain text.</P>
        <P><span className="font-black text-slate-950">Access controls, </span>access to personal data within our organisation is restricted to people who need it to perform their job. All access is logged.</P>
        <P><span className="font-black text-slate-950">Row-level security, </span>our database enforces row-level security policies that prevent any user from accessing data they are not authorised to see.</P>
        <P><span className="font-black text-slate-950">Regular audits, </span>we conduct regular reviews of our security practices and update them as threats evolve.</P>
        <P>No method of electronic transmission or storage is 100% secure. While we take every reasonable precaution, we cannot guarantee absolute security. If you believe your account has been compromised, contact us immediately at <a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a>.</P>
      </div>
    ),
  },
  {
    id: 'rights',
    heading: '8. Your Rights Under the DPDP Act 2023',
    body: (
      <div className="space-y-3">
        <P>Under the Digital Personal Data Protection Act, 2023, you have the following rights regarding your personal data:</P>
        <P><span className="font-black text-slate-950">Right to access, </span>you have the right to know what personal data we hold about you and how it is being processed.</P>
        <P><span className="font-black text-slate-950">Right to correction, </span>you have the right to have inaccurate or incomplete personal data corrected.</P>
        <P><span className="font-black text-slate-950">Right to erasure, </span>you have the right to request deletion of your personal data in certain circumstances. Note that reviews you have published will be anonymised rather than deleted, as they form part of the public record.</P>
        <P><span className="font-black text-slate-950">Right to grievance redressal, </span>you have the right to have your grievances addressed promptly. See Section 15 for our Grievance Officer details.</P>
        <P><span className="font-black text-slate-950">Right to nominate, </span>you have the right to nominate another individual to exercise your rights on your behalf in the event of your death or incapacity.</P>
        <P><span className="font-black text-slate-950">Right to withdraw consent, </span>where we process your data based on consent, you may withdraw that consent at any time. This does not affect processing already carried out.</P>
        <P>To exercise any of these rights, contact our Grievance Officer at the details in Section 15. We will respond within 30 days of receiving your request.</P>
      </div>
    ),
  },
  {
    id: 'cookies',
    heading: '9. Cookies and Tracking Technologies',
    body: (
      <div>
        <P>Trust Cabbage uses cookies and similar tracking technologies to operate the Platform and improve your experience.</P>

        <H3>Types of Cookies We Use</H3>
        <div className="space-y-3">
          <P><span className="font-black text-slate-950">Essential cookies, </span>necessary for the Platform to function. These include session cookies that keep you logged in and security cookies that protect against cross-site request forgery. You cannot opt out of these.</P>
          <P><span className="font-black text-slate-950">Analytics cookies, </span>help us understand how users interact with the Platform, which pages are most visited, where users drop off, and how features are being used. We use this to improve the Platform. You can opt out via your cookie preferences.</P>
          <P><span className="font-black text-slate-950">Preference cookies, </span>remember your settings and preferences, such as your preferred language or display settings.</P>
        </div>

        <H3>Managing Cookies</H3>
        <div className="space-y-3">
          <P>You can manage or disable cookies through your browser settings. Note that disabling essential cookies will prevent you from using key features of the Platform, including logging in.</P>
          <P>A cookie consent banner is shown on your first visit to the Platform. You can update your cookie preferences at any time through the cookie settings link in the footer.</P>
        </div>
      </div>
    ),
  },
  {
    id: 'children',
    heading: "10. Children's Privacy",
    body: (
      <div className="space-y-3">
        <P>Trust Cabbage is not intended for use by anyone under the age of 18. We do not knowingly collect personal data from children under 18.</P>
        <P>If you are a parent or guardian and believe your child has provided us with personal data, please contact us at <a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a> and we will delete that information promptly.</P>
      </div>
    ),
  },
  {
    id: 'third-party-links',
    heading: '11. Links to Third-Party Websites',
    body: (
      <P>The Platform may contain links to third-party websites, company websites, or external resources. These links are provided for convenience and do not constitute an endorsement. We have no control over the content or privacy practices of those websites and are not responsible for them. We encourage you to read the privacy policy of every website you visit.</P>
    ),
  },
  {
    id: 'international-transfers',
    heading: '12. International Data Transfers',
    body: (
      <div className="space-y-3">
        <P>Trust Cabbage is an Indian platform and your data is primarily stored and processed in India. Some of our service providers, including Supabase, Vercel, and Resend, may process data in servers located outside India.</P>
        <P>Where data is transferred outside India, we ensure appropriate safeguards are in place in accordance with the DPDP Act and applicable regulations, including contractual clauses that require recipients to maintain the same standard of protection we apply.</P>
      </div>
    ),
  },
  {
    id: 'changes',
    heading: '13. Changes to This Policy',
    body: (
      <div className="space-y-3">
        <P>We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or for other operational reasons.</P>
        <P>When we make significant changes, we will notify you by email (if you have an account) and by displaying a prominent notice on the Platform. The updated policy will be effective from the date stated at the top of this page.</P>
        <P>Your continued use of the Platform after the effective date constitutes acceptance of the updated policy. If you do not agree with the changes, you should stop using the Platform and delete your account.</P>
      </div>
    ),
  },
  {
    id: 'contact',
    heading: '14. Contact Us',
    body: (
      <div className="space-y-1 text-sm text-slate-600">
        <P>For general privacy-related questions or concerns, contact us at:</P>
        <p className="mt-2"><span className="font-black text-slate-950">Email: </span><a href="mailto:info@trustcabbage.com" className="text-[#6d28d9] font-bold hover:underline">info@trustcabbage.com</a></p>
        <p><span className="font-black text-slate-950">Website: </span>www.trustcabbage.com/contact</p>
      </div>
    ),
  },
  {
    id: 'grievance',
    heading: '15. Grievance Officer',
    body: (
      <div className="space-y-3">
        <P>In accordance with the Information Technology Act, 2000 and the Digital Personal Data Protection Act, 2023, we have appointed a Grievance Officer to address any concerns or complaints regarding the processing of your personal data.</P>
        <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
          <div className="text-sm text-slate-600 space-y-1">
            <p><span className="font-black text-slate-950">Phone: </span>9993802466</p>
            <p><span className="font-black text-slate-950">Response time: </span>We will acknowledge your grievance within 24 hours and resolve it within 30 days of receipt.</p>
          </div>
        </div>
        <P>If you are not satisfied with our response, you may approach the Data Protection Board of India once constituted under the DPDP Act, 2023.</P>
      </div>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="bg-[#1e1b4b] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1e1b4b] via-[#2d2a6e] to-[#1e1b4b]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#6d28d9]" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <p className="text-[#a78bfa] text-xs font-black uppercase tracking-widest mb-4">Legal</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Privacy Policy
          </h1>
          <p className="text-slate-300 text-base mt-4 leading-relaxed max-w-xl">
            How we collect, use, store, and protect your personal information on Trust Cabbage.
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

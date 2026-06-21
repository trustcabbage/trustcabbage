# Trust Cabbage — Homepage Content Brief

---

## HERO SECTION
*Full-width, above the fold. Buyer-first messaging.*

**Headline:**
Find B2B companies you can actually trust.

**Subheadline:**
Real reviews from real businesses. No fluff, no paid opinions.
India's first detailed B2B review platform — built for companies that buy services, not just products.

**Primary CTA (for buyers):**
[ Search a company, service, or #hashtag ] — search bar, prominent, center

**Search bar — autocomplete dropdown behaviour:**
As the user types, a dropdown appears instantly (no submit needed) showing results grouped into labelled sections. All sections search in parallel from a single API call.

Dropdown sections and order:

**🏢 Companies** — matches on company name
Example: typing "razor" shows → Razorpay, Razor Infotech, Razor Logistics
Each result shows: company logo thumbnail + name + primary category + star rating
Click → goes to `/company/[slug]`

**🗂 Categories** — matches on top-level category names
Example: typing "pay" shows → Payment Solutions, Payroll Software
Each result shows: category icon + name + company count ("142 companies")
Click → goes to `/categories/[slug]`

**📁 Subcategories** — matches on subcategory names
Example: typing "upi" shows → UPI Integration (under Payment Solutions)
Each result shows: subcategory name + parent category name in muted text
Click → goes to `/categories/[parent-slug]/[sub-slug]`

**📦 Products & Services** — matches on product/service names listed by companies
Example: typing "ecommerce" shows → Ecommerce Website Development (by Pixel Republic), Ecommerce Marketing (by Growth Labs)
Each result shows: product/service name + company name below in muted text + category tag
Click → goes to `/company/[slug]` scrolled to that product/service

**🏷️ Hashtags** — matches on canonical service and technology tags
Example: typing "gate" shows → #PaymentGateway (used by 34 companies), #GatewayIntegration (used by 8 companies)
Each result shows: hashtag in green + usage count ("34 companies")
Click → goes to `/tags/[slug]`

**Dropdown UX rules:**
- Minimum 2 characters typed before dropdown appears
- Maximum 3 results shown per section to keep dropdown compact — "See all results for X →" link at the bottom of each section if more exist
- Sections only appear if they have at least 1 result — no empty section headers
- Keyboard navigation: arrow keys move between results, Enter selects, Escape closes
- If only one section has results, that section shows up to 6 results instead of 3
- Pressing Enter with text in the bar (no result selected) → goes to full `/search?q=` results page
- On mobile: dropdown appears above the keyboard, max 4 results total across all sections

**Placeholder text rotates every 3 seconds (subtle fade):**
"Search a company…" → "Search a service…" → "Search #PaymentGateway…" → "Search Digital Marketing…"

**Secondary CTA (for businesses, smaller, below search):**
Are you a business? → List your company free or Claim your page

**Trust signals bar (just below hero):**
◈ 4,200+ companies listed  ◈ 18,000+ verified reviews  ◈ 340+ service categories  ◈ Trusted by businesses across India

*(Start with aspirational numbers, update as platform grows)*

---

## SECTION 2 — BROWSE BY CATEGORY
*Helps buyers who don't know a specific company yet — they're browsing.*

**Section heading:**
What kind of service are you looking for?

**Category grid (2 rows of 5–6, with icons):**
- Web & App Development
- Digital Marketing
- Accounting & Finance
- Legal & Compliance
- HR & Recruitment
- Logistics & Supply Chain
- IT Infrastructure
- Business Consulting
- Ecommerce Services
- Creative & Design
- Customer Support / BPO
- Cloud & SaaS Tools

**Below grid:**
[ Browse all 340+ categories → ]

---

## SECTION 3 — HOW IT WORKS (FOR BUYERS)
*3 steps. Simple. Build confidence in 10 seconds.*

**Section heading:**
How Trust Cabbage works

**Step 1**
Icon: Search
Title: Search any B2B company, service, or hashtag
Body: Type a company name, a service you need, or a hashtag like #PaymentGateway. The search instantly shows matching companies, categories, products, and tags — all in one dropdown.

**Step 2**
Icon: Star / Reviews
Title: Read detailed, honest reviews
Body: Every review covers 6 factors — team behaviour, quality, communication, billing, after-sales support, and delivery. Written by actual clients, not anonymous strangers.

**Step 3**
Icon: Handshake
Title: Choose with confidence
Body: Compare companies side by side. See what real clients say before you sign a contract or transfer a rupee.

**CTA after steps:**
[ Start searching → ]

---

## SECTION 4 — FEATURED COMPANIES
*This is the primary ad placement on the homepage. Labeled honestly.*

**Section heading:**
Top-rated companies this month

**Sub-label (small text):**
Featured listings — companies with the highest verified review scores in their category

*(Each card shows: company logo, name, category, star rating, number of reviews, top 2 services, "Verified" badge if applicable, Sponsored label if paid featured)*

**Show 6–8 company cards in a grid**

[ See all top-rated companies → ]

---

## SECTION 5 — WHY TRUST CABBAGE IS DIFFERENT
*This section speaks to both audiences — buyers trust it, businesses want to be on it.*

**Section heading:**
Built for Indian B2B. Not adapted from somewhere else.

**3 columns:**

**Column 1 — For buyers**
Icon: Shield check
Title: Reviews you can verify
Body: Every reviewer confirms their identity before writing. Association type, engagement phase, and duration are all declared. You know exactly who wrote what and why.

**Column 2 — For businesses**
Icon: Chart line
Title: Your reputation, permanently visible
Body: A good track record should work for you even when you're not pitching. Trust Cabbage puts your best reviews in front of buyers actively searching for what you offer.

**Column 3 — For the ecosystem**
Icon: India map / handshake
Title: Raising the bar for Indian B2B
Body: Too many businesses win contracts on connections, not merit. Trust Cabbage shifts that — the best companies rise, regardless of network or marketing budget.

---

## SECTION 6 — RECENT REVIEWS (LIVE FEED)
*Social proof. Shows the platform is active.*

**Section heading:**
What businesses are saying right now

*(Show 4–6 recent published reviews in cards. Each card shows: reviewer's first name + city, company reviewed, star rating, one line from the review, "Verified buyer" badge if applicable, posted X days ago)*

**Example card copy:**
★★★★★
"Delivered the ecommerce website 2 weeks early and the post-launch support has been exceptional."
— Rajesh M., Mumbai · Reviewed: Pixel Republic Digital  · Verified client · 3 days ago

[ Read more reviews → ]

---

## SECTION 7 — FOR BUSINESSES CTA BAND
*Full-width band, contrasting background. Converts business owners who've been scrolling.*

**Headline:**
Your clients are looking for you. Make sure they find the real you.

**Body:**
List your company free. Claim your existing page. Start collecting verified reviews from your actual clients — and let your work speak for itself.

**Left CTA:** [ List my company — it's free ]
**Right CTA (secondary):** [ Search if your company is already listed → ]

**3 small proof points below CTAs:**
◈ Free to list  ◈ No review deletion — ever  ◈ GST-verified company pages

---

## SECTION 8 — STATS / SOCIAL PROOF
*Numbers build authority. Update quarterly.*

**Section heading:**
Trust Cabbage in numbers

4 large stat cards:
- 4,200+ Companies listed
- 18,000+ Reviews published
- 96% Reviewers email-verified
- 340+ Service categories

---

## SECTION 9 — FOOTER
**Links — Buyers column:**
Browse categories
Search companies
How reviews work
Write a review

**Links — Businesses column:**
List your company
Claim your page
For business owners
Pricing

**Links — Company column:**
About Trust Cabbage
Our review policy
Anti-fake review commitment
Blog
Contact us
Advertise with us

**Legal:**
Privacy Policy · Terms of Use · Cookie Policy

**Tagline under logo:**
Trust Cabbage — India's B2B trust layer.

---
---

# FOR BUSINESSES PAGE — full content

*Separate page. URL: /for-businesses*
*This page converts business owners into claimants and paid subscribers.*

---

## HERO

**Headline:**
Your reputation is your biggest sales tool. Start using it.

**Subheadline:**
Trust Cabbage gives Indian B2B companies a verified, permanent home for their client reviews — so buyers can find you and trust you before the first call.

**CTA:** [ Claim your company page — free ]
**Secondary:** [ See how it works for businesses → ]

---

## SECTION — THE PROBLEM WE SOLVE

**Heading:**
Winning new business shouldn't depend on who you know.

**Body:**
In Indian B2B, too much depends on referrals, LinkedIn connections, and who can shout the loudest on social media. Good companies with great track records lose to noisier competitors.

Trust Cabbage levels that. Your verified client reviews stay permanently on your page — searchable, Google-indexed, and visible to every buyer who looks you up.

---

## SECTION — WHAT YOUR PAGE GIVES YOU

**Heading:**
Everything a buyer needs to say yes to you.

**4 cards:**

**Card 1 — Your profile**
Company name, logo, description, founding year, team size, location, GST-verified badge, categories you operate in.

**Card 2 — Your services**
List exactly what you offer. Buyers can filter reviews by specific service — so someone evaluating your "web development" work only sees relevant reviews.

**Card 3 — Client reviews**
Detailed, multi-factor reviews from verified clients. Ratings across 6 dimensions. You can reply publicly to every review.

**Card 4 — Your rating**
A Trust Cabbage score (1–5) based on all your reviews. Shown in Google search results via structured data markup — buyers see your stars before they even click.

---

## SECTION — HOW TO GET ON TRUST CABBAGE

**Heading:**
Three ways to get started

**Step 1 — Already listed?**
Search your company name. If someone has already created your page, claim it. Submit your GST certificate or CIN number. We verify within 48 hours.

**Step 2 — Not listed yet?**
Create your company page in under 5 minutes. Free. Add your services, logo, and description. Start sending the review invite link to your clients.

**Step 3 — Start collecting reviews**
Share your unique review link over email, WhatsApp, or embed the review widget on your website. Your clients take 3 minutes to review. You benefit forever.

---

## SECTION — REVIEW COLLECTION TOOLS

**Heading:**
Make it easy for happy clients to say so publicly.

**Tool 1 — Review invite link**
A unique link for your company. Share it on WhatsApp, email, or in your client onboarding docs. Lands your client directly on your review form.

**Tool 2 — Email invites**
Upload your client list. We send branded invite emails on your behalf via Resend integration. Track who opened, who clicked, who reviewed.

**Tool 3 — Website widget**
A small badge for your website showing your Trust Cabbage rating. One line of code. Updates automatically as new reviews come in.

**Tool 4 — QR code**
Download your review QR code. Put it on proposals, invoice footers, presentations, or office reception. Clients scan and review instantly.

---

## SECTION — PRICING

**Heading:**
Start free. Upgrade when you're ready.

**3 plan cards:**

**Free**
- Company page listed
- Claim your page
- Unlimited reviews collected
- Review invite link
- Public reply to reviews
- Trust Cabbage badge (watermarked)
₹0 / month

**Starter — most popular**
- Everything in Free
- Clean embeddable widget (no watermark)
- Email invite tool (up to 100 invites/month)
- Basic analytics (total reviews, average rating trend)
- Verified company badge
- Priority claim processing
₹1,499 / month

**Growth**
- Everything in Starter
- Unlimited email invites + CSV upload
- Advanced analytics (sentiment, keyword trends, category ranking)
- API access to your rating data
- QR code generator
- Featured in category listing (1 category)
- Dedicated support
₹4,999 / month

**[ Get started free → ]  [ Talk to us about Growth → ]**

---

## SECTION — WHAT BUSINESSES CANNOT DO

**Heading:**
Our promise to buyers — and why it makes your reviews more valuable.

*This section builds trust in the platform itself, which makes a company's positive reviews worth more.*

◈ You cannot delete your company page once created
◈ You cannot delete or hide individual reviews
◈ You cannot edit what a reviewer wrote
◈ Paid plans do not affect your rating or review visibility
◈ You can flag factually incorrect reviews for admin review — but not remove them

**Body:**
These rules are non-negotiable. They're what makes a 4.6 on Trust Cabbage actually mean something — to you, and to every buyer who reads it.

---
---

# CATEGORY LISTING PAGE — content structure

*URL: /categories/[slug]  e.g. /categories/digital-marketing*

---

**Page title (H1):**
Digital Marketing Companies in India

**Subheading:**
{N} companies · Rated by verified B2B clients

**Filter bar (left sidebar or top bar):**
- Rating: 4★ and above / 3★ and above / All
- City: Mumbai / Delhi / Bangalore / Hyderabad / All India
- Company size: 1–10 / 11–50 / 50–200 / 200+
- Verified only: toggle
- Sort: Highest rated / Most reviewed / Recently active / Featured first

**Company card (each result):**
- Logo + company name
- "Verified" badge (if claimed + GST verified)
- Star rating (e.g. 4.3 ★) + review count (e.g. "127 reviews")
- Top 2 services listed
- City · Founded year
- One excerpt from their most helpful review
- [ View company → ] button
- "Sponsored" label if paid featured (top 3 cards only, visually distinct but not intrusive)

**Bottom of page — SEO content block:**
A 150–200 word paragraph about hiring digital marketing companies in India, what to look for, and why verified reviews matter. This is for Google, not primarily for readers.

---
---

# COMPANY PROFILE PAGE — content structure

*URL: /company/[slug]  e.g. /company/pixel-republic-digital*
*This is the most important page for SEO. Every section below should be server-rendered.*

---

**Above the fold:**
- Company logo + cover image
- Company name + "Verified" / "Unclaimed" badge
- Star rating (large, prominent) + total reviews + rating breakdown bars
- Category tags (e.g. Web Development · Digital Marketing)
- City, founded year, team size
- Website link
- [ Write a review ] button — always visible
- [ Claim this page ] button — if unclaimed

**Tab navigation:**
Overview | Reviews | Products & Services | About

---

**OVERVIEW TAB:**

Rating breakdown (6 factors with bar charts):
- Staff & team behaviour: 4.2
- Service / product quality: 4.5
- Communication & support: 3.8
- Monetary & billing: 4.1
- After-sales support: 3.6
- Delivery & timelines: 4.0

Review sentiment summary (auto-generated from review text):
"Clients frequently mention fast turnaround, responsive team, and strong technical skills. Some mention post-launch support could be more proactive."

Recent reviews (3 shown, with "See all reviews" link)

---

**REVIEWS TAB:**

Filter: By product/service | By rating | By association type | By date

Each review card shows:
- Reviewer: first name + city (e.g. "Ankit S., Pune")
- Association: "Past client · 1–3 years · Post-project phase"
- Product/service reviewed: "Web Development"
- Star rating (overall + 6 factor mini-bars)
- What went well (full text)
- What to improve (full text)
- Would recommend: Yes ✓
- Verified buyer badge (if applicable)
- Date posted
- Company reply (if any) — indented below, labeled "Response from [Company Name]"
- Helpful votes

**Sidebar on reviews tab:**
→ AD PLACEMENT: "Also consider" — 2 competitor company cards in same category (paid featured placement, labeled Sponsored)

---

**PRODUCTS & SERVICES TAB:**
Grid of service cards the company has listed — name, description, price range (if added), review count for that specific service.

---

**ABOUT TAB:**
Full company description, founding story, team size, locations, GST number (masked), certifications, awards, social links.

---
---

# SEARCH RESULTS PAGE — content structure

*URL: `/search?q=ecommerce+website+agency`*
*Also handles: `/search?q=%23paymentgateway` for hashtag searches*

**Heading:**
Results for "ecommerce website agency"
Showing 47 companies · 3 categories · 12 services · 8 tags

**Results are grouped into tabs across the top:**

**Tab 1 — Companies (default active tab)**
Shows company cards matching the query — by name, description, or tags.
Top result (if paid — 1 slot max): Sponsored · [Company card]
Organic results below: same company card format as category listing.

**Tab 2 — Categories & Subcategories**
Shows category and subcategory cards that match the search term.
Each card: category icon + name + company count + top 3 subcategory names
Clicking a card goes to the category listing page.

**Tab 3 — Products & Services**
Shows specific products/services from companies that match the query.
Each result: product/service name + company name + category + rating of that company
Clicking goes to the company page scrolled to that product/service.

**Tab 4 — #Tags**
Shows all canonical hashtags matching the query, sorted by usage count.
Each tag shown as a large chip: `#PaymentGateway — 34 companies · 218 reviews`
Clicking goes to `/tags/[slug]`

**Left sidebar filters (apply across all tabs):**
- Rating: 4★ and above / 3★ and above / All
- Category refinement (if search spans multiple categories)
- City / State
- Verified companies only (toggle)
- Sort: Most relevant / Highest rated / Most reviewed / Newest

**If no results on Companies tab:**
"We couldn't find a company matching '{query}'.
Would you like to create a page for them? → [ Add this company ]"
*(This is how the platform grows — users create unclaimed pages)*

**If query starts with # (hashtag search):**
Skip the tab UI entirely. Go straight to the Tags tab view — show the matching tag page inline.
URL becomes: `/tags/payment-gateway` (redirect) or shows tag results inline.
Heading: `Companies tagged #PaymentGateway — 34 companies`

---
---

# PAGE SUMMARY — who focuses on what

| Page | Primary audience | Ad slots | SEO priority |
|---|---|---|---|
| Homepage | Both (buyer-first) | Featured company cards (3–4) | High |
| /for-businesses | Business owners | None — conversion page | Medium |
| /categories | Buyers browsing | Sponsored cards top 3 | Very High |
| /company/[slug] | Buyers researching | Competitor sidebar (2 slots) | Highest |
| /search | Buyers searching | 1 sponsored result top | Medium |
| /pricing | Business owners | None | Low |
| /how-it-works | Both | None | Medium |
| /write-review | Reviewers | None — never | None needed |
| /dashboard | Company admins | None | None |
| /admin | Trust Cabbage team | None | None |

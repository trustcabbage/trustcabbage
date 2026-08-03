# Feedback & Resolution Plan (Post-Sales Service, Public)

Status: PLANNED, no code built yet.
Working name: **Service Desk** (public label: "Feedback & Resolutions").

## 1. Concept

Companies run their post-sales feedback and complaint process **through Trust Cabbage instead of a private inbox**, and the entire thread (feedback, complaint, company response, resolution) is publicly visible on their company page.

Why a company would want this (the pitch):
- A resolved complaint in public is stronger marketing than a 5-star review. It proves the company shows up after payment.
- Companies get a "Resolves issues in ~2 days" style badge and a Service score, which nobody can buy, only earn.
- It creates a structural reason to invite EVERY customer (not just happy ones), which feeds review volume too.

Why it fits Trust Cabbage: it is the anti-fake positioning extended to support. Fake reviews are easy; a public log of real complaints being resolved is nearly impossible to fake at scale.

Differentiation: Trustpilot/Google show reviews. Nobody in India shows a public, timestamped complaint-to-resolution timeline per company. This is closer to a public ticket system than a review system, and that is the point.

## 2. User flows

### 2.1 Company initiates (the automation)
1. Company admin opens **Dashboard → Service Desk → New request**.
2. Enters: customer name (required), customer email (required), and optional: product (picker from `products_services`), purchase date, order/invoice reference.
3. Platform sends an email via existing Resend infra: "How was your purchase from {Company}? Share feedback or raise an issue."
4. Bulk option: paste CSV lines (name,email,product,date) — same limits engine as email invites.
5. Later (Phase D): `POST /api/service-request` using the existing company API key infra from migration 014, so companies can trigger it automatically from their order system.
6. The existing review-invite tool (`dashboard/invites`) stays untouched as the simple blast tool; Service Desk requests are the richer per-customer flow. They may merge into one outreach surface later, cosmetically only.

### 2.2 Customer responds (no account needed, still verified)
1. Email link carries a unique token: `/service/{token}`.
2. Because the company sent the email to that customer's address, the token itself proves the customer relationship. No OTP needed to open, but submitting requires confirming via the tokened link (possession of the email = verification). This is consistent with the platform's "every entry tied to a verified identity" rule.
3. **Sentiment-first routing** (the customer never sees "review vs complaint" as a choice; their satisfaction answer routes them):
   - Landing page opens with one question: satisfaction 1–5.
   - **4–5** → review lane: standard review form prefilled with product + purchase context. Writes to `reviews`, affects star rating, exactly like an invite-link review today.
   - **1–3** → complaint lane: "What went wrong, and would you like {Company} to resolve it?" Issue category, description, expected resolution. Writes to `service_cases`.
   - Short neutral feedback (no full review, no complaint) → `service_cases` with type `feedback`; shows in the public feedback strip, never counted as a review.
4. **Anti-review-gating guarantees** (non-negotiable, this is what keeps the funnel legitimate where competitors' "reputation tools" are not):
   - The complaint lane is not a private diversion; it auto-publishes within 72h (section 5). Negative sentiment still surfaces publicly.
   - The complaint page always carries an "I'd rather just write a public review" link, and the case-closing email offers a review afterward. Unhappy customers are never steered away from reviewing.
   - No automatic crossover between tables: a review is only ever created by the customer explicitly filling the review form.
5. Submission creates a case or review accordingly (visibility rules in section 5).

### 2.3 Company resolves
1. Case lands in **Dashboard → Service Desk inbox** (same shape as the Q&A inbox built earlier: unanswered on top).
2. Company replies in-thread. Every reply is timestamped and public.
3. Company can mark "Resolution offered". Customer gets an email: "Did {Company} resolve your issue?" with Yes / No buttons (tokened, one click).
4. Customer confirms → case becomes **Resolved**, resolution time recorded. Customer says no → case stays open, thread continues.
5. Auto-close: if customer never responds to the resolution confirmation for 14 days, case shows "Resolution offered, awaiting customer" (never silently marked resolved — credibility rule).

## 3. Data model (migration 018)

```
service_requests
  id uuid pk
  company_id uuid → companies
  product_service_id uuid null → products_services
  customer_name text not null
  customer_email text not null
  purchase_date date null
  order_ref text null
  token text unique not null            -- link token
  status text: invited | opened | submitted | expired
  sent_by uuid → users
  resend_id text null
  created_at timestamptz

service_cases
  id uuid pk
  request_id uuid unique → service_requests
  company_id uuid (denorm for RLS/queries)
  product_service_id uuid null (denorm)
  type text: feedback | complaint
  category text null                    -- complaint category
  satisfaction int null (1..5)          -- feedback lane
  title text
  body text not null
  expected_resolution text null
  status text: open | resolution_offered | resolved | unresolved
  customer_display text                 -- "Rahul, Indore" style, derived at insert
  publish_at timestamptz not null      -- created_at + 72h for complaints, = created_at for feedback;
                                       -- public RLS reads filter on publish_at <= now();
                                       -- customer escalation sets it to now()
  created_at, first_company_reply_at, resolution_offered_at, resolved_at

service_case_events
  id uuid pk
  case_id uuid → service_cases
  author text: company | customer
  kind text: reply | resolution_offer | customer_confirm | customer_decline
  body text null
  created_at
```

Denormalized on `companies` (trigger-maintained, same pattern as `refresh_product_rating` in 014):
- `service_cases_total int`, `service_resolved_total int`, `service_avg_resolution_hours numeric`, `service_avg_first_reply_hours numeric`

RLS:
- Public `select` on `service_cases` + `service_case_events` (published/public rows).
- `service_requests` readable only by the owning company admin (contains raw customer email).
- All customer-side writes go through server actions that validate the token server-side (service role), mirroring how the review invite flow works. Company-side writes gated by the `getCompanyAdmin()` pattern already in `dashboard/invites/_actions.ts`.
- Dedup: unique `(company_id, order_ref, customer_email)` where order_ref not null, same as `api_invite_logs_dedup_idx`.

## 4. What we reuse (near-zero new infra)

| Existing piece | Reused for |
|---|---|
| Resend + `email-templates.ts` | 4 new templates: request, complaint ack/notify, reply notify, resolution confirm |
| `plan-limits.ts` + `invite_emails_this_month` RPC pattern | monthly service-request limits per plan |
| `getCompanyAdmin()` server-action guard | all dashboard actions |
| Q&A inbox layout (`dashboard/qa`) | Service Desk inbox UI, same two-section structure |
| API key infra (migration 014) | Phase D automation endpoint |
| Token-link pattern (`invite_token`) | per-customer request tokens |

## 5. Public visibility rules (the trust contract)

- **Complaints always publish; companies only control how good they look when it happens.** Every complaint auto-publishes after a fixed 72-hour grace window. During the window it is visible only to the company, giving them a private chance to fix the issue. Resolved-in-window cases still publish, already marked "Resolved in Xh", which is the adoption pitch. There is no "keep private" action anywhere in the product, and per-complaint visibility control must never exist (it would turn the feature into a curated testimonial wall).
- **Customer escalation valve:** if the company has not replied within 24 hours of submission, the customer may publish immediately from their tokened page. Prevents the window being used to stall.
- The 72h rule is disclosed publicly on the platform so readers and complainants both know nothing can be buried.
- Optional later: a company-wide (never per-case) setting to opt into "publish immediately", surfaced publicly as a transparency tag.
- Customer identity shown as first name + city style display, consistent with reviews. Raw email never public.
- Feedback-lane entries with satisfaction ≥ 4 show in a "Recent feedback" strip; complaints show in the "Issues & resolutions" timeline with status chips: Open (amber), Resolution offered (blue), Resolved (green), Unresolved (rose).
- Company page gets a **Service section** (new tab or section under reviews):
  - Header metrics: resolution rate, median time to resolve, median first-response time
  - Badge on company header when earned, e.g. "Resolves issues fast" (rules: ≥10 cases, ≥80% resolved, median < 72h)
- Complaints do NOT change the star rating (recommended). The star rating stays review-only; the Service score is its own axis. Mixing them would let unresolved complaints be double-punished and resolved ones gamed into rating boosts.
- Sitewide: cases are indexable pages (`/company/{slug}/service/{case-id}`), which is strong SEO surface ("{company} complaint" searches land on OUR resolved thread, not a consumer-court forum).

## 6. Dashboard UI

`/dashboard/service` (new):
- **Inbox**: open complaints first (with age indicator), then awaiting-customer, then resolved. Inline reply + "Offer resolution" button.
- **Send requests**: single + bulk form, remaining-quota indicator, log table (mirrors invites page).
- **Stats card**: resolution rate, median resolve time, how their badge status looks publicly.
- Dashboard home: add alert chip "N open complaints" (same pattern as unanswered-questions alert).

## 7. Anti-abuse & integrity

- Company cannot delete or edit customer submissions, ever (same as reviews).
- Rate limit: token single-use for submission; one case per request.
- Companies spamming requests to fake addresses gain nothing: unopened requests are invisible publicly and count against their quota.
- Blackmail protection: customer-side edits lock after first company reply (thread continues via events instead), so neither side can rewrite history.
- A complaint cannot be withdrawn silently; customer can mark "resolved" but the thread stays public.

## 8. Plan gating (monetization hook)

- Free: 20 service requests/month, public timeline included (visibility is never paywalled).
- Starter: 200/month + CSV bulk.
- Growth: unlimited + API endpoint + badge eligibility surfaced in widget/QR assets.
Numbers indicative; align with existing `emailInviteLimit` tiers when building.

## 9. Build order

- **Phase A (core loop)**: migration 018, send-request form + email, `/service/{token}` customer page (feedback + complaint lanes), case creation. Ship value: companies can start collecting.
- **Phase B (resolution loop)**: inbox, threaded events, resolution offer + confirm emails, status machine.
- **Phase C (public payoff)**: company-page Service section, per-case public pages, metrics trigger, badge logic, dashboard stats.
- **Phase D (automation)**: `POST /api/service-request` on the API-key infra, reminder emails, review-conversion prompt at end of feedback lane.

Each phase is independently shippable; A+B is the MVP, C is where the differentiation becomes visible, D is the retention hook.

## 10. Public UI spec (company page)

New **"Service" tab** on the company page, shown once the company has ≥1 published case. Design language: existing tokens (dark `#1e1b4b` heroes, `#6d28d9` accents, `font-black`, `rounded-xl`, slate palette).

### 10.1 Tab header: metrics strip
Three stat cards above the case list (only when ≥3 published cases, else hidden to avoid embarrassing small numbers):
- **Resolution rate**: "94% resolved" (green when ≥80, amber 50–79, rose <50)
- **Median time to resolve**: "~36 hours"
- **Open cases**: count with amber dot
Plus the earned badge chip ("Resolves issues fast") next to the company name in the page header, same placement pattern as VerifiedBadge.

### 10.2 Case card (list view)
Each published case renders as a card:
- Status chip top-left: `Open` (amber), `Resolution offered` (blue), `Resolved` (green), `Unresolved` (rose)
- For resolved: a second pill "Resolved in 41h ✓ confirmed by customer"
- Title + category chip (e.g. "Delivery", "Refund", "Quality") + product link when product-level
- Customer display ("Rahul, Indore") with a **Verified customer** mark — automatic, because the request was company-initiated to that customer's email; stronger than self-claimed reviews
- Complaint excerpt (2 lines) and, if present, latest company reply excerpt with company logo avatar
- Timestamp; click-through to the full thread page

### 10.3 Thread page `/company/{slug}/service/{caseId}`
- Indexable public page (SEO surface for "{company} complaint" queries)
- Resolution banner at top when resolved: green strip "Resolved in 41 hours, confirmed by the customer on {date}"
- Vertical timeline of events, each timestamped: complaint → company reply(s) → resolution offered → customer confirmation. Company events carry logo avatar, customer events an initial avatar.
- Footer disclosure line (also on the tab): "Complaints appear publicly no later than 72 hours after submission. Companies cannot delay or prevent publication."

### 10.4 How the 72h grace shows
- **Public:** cases inside the window simply do not exist yet (`publish_at > now()` filtered by RLS). No "hidden cases pending" counter — that would advertise suppression.
- **Customer (tokened page):** countdown "Your complaint goes public in 51h" + after 24h of company silence, an "Publish now" escalation button.
- **Company (dashboard):** the same countdown, framed as urgency: "Publishes in 51h — resolve it first and it publishes as Resolved."

### 10.5 Reviews integration
- Reviews that arrive via the happy lane use existing `review_source` (migration 009) with a new value `service`, and display the existing invited-review treatment.
- Because the company itself initiated the request to the customer's email, service-originated reviews automatically qualify for the **Verified buyer/client badge** without a proof upload. This is a real incentive for companies to route invites through Service Desk.

## 11. Company reply & resolution UI (dashboard)

`/dashboard/service`, same structural pattern as the Q&A inbox:
- **Sections in priority order:** Open complaints (countdown chip, amber → rose as publish time nears), Awaiting customer confirmation, Feedback, Resolved.
- Case row: customer, product, category, age, "customer waiting Xh" first-response timer, publish countdown.
- Expanded card: full thread + inline reply composer + **"Offer resolution"** button which requires a one-line resolution summary (this summary is what shows in the green banner publicly).
- Guardrails visible in UI: no delete, no hide; a short explainer "Everything here becomes public. Fast resolution is the only lever."
- Dashboard home: "N open complaints, earliest publishes in 9h" alert chip (same pattern as the unanswered-questions alert).

## 12. Analytics (dashboard stats for the company)

Section on `/dashboard/service` (Phase C), server-rendered like existing analytics:
- **Funnel:** requests sent → opened → responded, split into feedback / complaints / reviews written. Shows conversion value of the channel.
- **Resolution performance:** resolution rate and median resolve time, monthly trend (last 6 months), vs. platform median for their category (anonymous benchmark — a strong retention hook).
- **First-response time:** median hours to first reply.
- **Complaint categories breakdown:** top issue types with counts ("42% delivery, 25% refund…"). This is genuine ops intelligence companies can't get from reviews alone.
- **Badge progress:** "2 more resolved cases and median under 72h to earn the badge."
- **Review yield:** reviews generated via service requests (ties the feature to the metric companies already care about).

## 13. Email automation

All sends via existing Resend infra + `email-templates.ts`. Two trigger types:

**Event-triggered (inline in server actions, no scheduler needed):**
| Trigger | To | Email |
|---|---|---|
| Request created (manual, bulk, or API) | customer | "How was your experience with {Company}?" (tokened link) |
| Complaint submitted | customer | Ack: "{Company} has been notified and has 72h to respond before this goes public" |
| Complaint submitted | company admin | "New complaint from {name}. It publishes in 72h. Resolve it first." |
| Company replies | customer | "{Company} replied to your complaint" |
| Resolution offered | customer | "Did {Company} resolve your issue?" one-click Yes / No (tokened) |
| Customer confirms | company | "Case resolved in 41h, now public as resolved" |
| Case resolved or closed | customer | "Want to write a review reflecting your overall experience?" |

**Time-triggered (needs a daily scheduler — Vercel Cron hitting an internal route, or Supabase pg_cron; recommend Vercel Cron since we're on Vercel):**
- T+3d after request, not opened/submitted → one reminder to customer (one only, ever).
- T+7d after resolution offered, no customer response → one reminder.
- T+14d after offer, still silent → case auto-labels "Resolution offered, awaiting customer" (never auto-resolved).
- Note: the 72h publication itself needs NO cron — `publish_at <= now()` in the public read filter flips visibility live.

**Manual vs automated sends — same pipeline:** the dashboard single/bulk form, the CSV upload, and the Phase D API endpoint all just create `service_requests` rows; every downstream email, reminder, publication countdown, and analytics number is driven by the request/case records, never by how the request was created. So yes, manually-sent requests get the full automation identically.

**The old invite tools** (`dashboard/invites`, `/api/review-invite`) keep sending plain review links with no case tracking. They stay for companies that only want reviews. Once Service Desk is stable, we can point the invites UI at Service Desk requests by default and retire the old path (the verified-badge incentive in 10.5 gives companies a reason to prefer it anyway).

## 14. Development plan (file-level)

### Phase A: core loop (1 session) — ship: companies can send, customers can submit
| Item | Path |
|---|---|
| Migration 018: `service_requests`, `service_cases`, `service_case_events`, `publish_at`, RLS, company denorm columns + trigger | `supabase/migrations/018_service_desk.sql` |
| Request email template | extend `src/lib/email-templates.ts` |
| Dashboard: send form (single + bulk paste) + request log | `src/app/(public)/dashboard/service/page.tsx`, `_components/request-form.tsx` |
| Server actions: create request(s), plan-limit check (mirror `invites/_actions.ts`) | `src/app/(public)/dashboard/service/_actions.ts` |
| Customer landing: token lookup, satisfaction selector, routing | `src/app/(public)/service/[token]/page.tsx` + `_components/` |
| Case submission action (service role, token validation, sets `publish_at`) | `src/app/(public)/service/[token]/_actions.ts` |
| Happy-lane redirect to `write-review?product=…&src=service`; accept `service` as `review_source` | existing write-review page, no structural change |

### Phase B: resolution loop (1 session) — ship: full complaint→resolved cycle
- Inbox sections + thread view + reply composer on `/dashboard/service`
- Actions: `replyToCase`, `offerResolution` (requires summary line), event rows
- Customer confirm flow: tokened one-click Yes/No page
- Event emails: complaint ack, company notify, reply notify, resolution confirm, post-close review prompt
- Dashboard home alert chip ("N open complaints, earliest publishes in 9h")

### Phase C: public payoff (1–2 sessions) — ship: the differentiation
- Company page "Service" tab: metrics strip, case cards, status chips
- Public thread page `/company/[slug]/service/[caseId]` with SEO metadata; add to `sitemap.ts`
- `ServiceBadge` component (VerifiedBadge pattern) + badge eligibility logic
- Analytics section on `/dashboard/service` (funnel, trend, categories, badge progress, review yield)
- 72h disclosure copy on tab + `anti-fake-commitment` page update

### Phase D: automation & monetization (1 session)
- `POST /api/service-request` reusing `src/lib/api-auth.ts`
- `vercel.json` cron + `/api/cron/service-reminders` route (3d unopened reminder, 7d unconfirmed reminder, 14d auto-label)
- Plan-limit tiers in `src/lib/plan-limits.ts` + upgrade prompts
- Docs section on `/for-businesses/product-reviews` (API) for the new endpoint

Estimated total: 4–5 working sessions. A+B is the usable MVP; C is when marketing can start pointing at it.

## 15. Go-to-market plan

Positioning line (use everywhere): **"Reviews prove people bought from you. Service Desk proves you show up after they pay."**

### 15.1 Website
- **Feature landing page** `/for-businesses/service-desk`: hero ("Turn complaints into your best marketing"), 3-step how-it-works (send request → customer responds → resolve in public), the 72h rule explained as a feature ("your customers trust it because you cannot hide it"), badge showcase, metrics screenshot, free-tier CTA ("20 requests/month free").
- **For-businesses page**: add Service Desk card to the feature grid, top position while it's new.
- **Footer**: link under For businesses.
- **Anti-fake-commitment page**: add a section on the 72h publication guarantee, this page is the credibility anchor and Service Desk is its strongest proof point.
- **Company pages themselves are the ad**: every resolved thread is public, indexable proof. A "Powered by Trust Cabbage Service Desk" line on thread pages converts visiting companies.

### 15.2 LinkedIn (primary B2B channel)
Founder-voice posts, 2 per week around launch:
1. **Contrarian launch post**: "We built a feature that makes complaints about your company public. Companies are signing up for it. Here is why." Walks the 72h logic.
2. **Carousel**: "A resolved complaint converts better than a 5-star review", 6 slides, ends on badge.
3. **Build-in-public post**: why review-gating is the dirty secret of reputation tools and how sentiment routing stays clean when the complaint lane is also public.
4. **Case-study posts** (once real data exists): "This Indore brand resolved 94% of complaints in under 48 hours. Publicly." Tag the company, they will reshare.
5. **Badge announcements**: congratulate each company that earns "Resolves issues fast", free content + free flattery loop that recruits their competitors.

### 15.3 Social (Instagram / X, D2C-brand audience)
- Screenshot-style graphics of a real resolved thread: complaint → reply → "Resolved in 18h ✓". The artifact itself is the creative.
- Reel script: "Every brand says 'DM us'. This brand fixes it in public." 30s.
- Meme-adjacent: split image "Their Instagram comments: hidden. Their Trust Cabbage Service Desk: 94% resolved."
- For consumers: "Complained to a brand and got ghosted? If they are on Trust Cabbage, it cannot be buried."

### 15.4 Email
- **Existing claimed companies** (launch blast): subject "Your complaints are now your best marketing". Body: the badge, the 72h logic, 20 free requests, one CTA to `/dashboard/service`.
- **New-claim drip, day 3**: "You claimed your page. Now prove your after-sales service" with a 2-min setup walkthrough.
- **Monthly company digest** (Phase D): "Your Service Desk this month: 12 requests, 3 complaints, all resolved, median 31h. You are 2 cases from the badge."
- **Reviewer/consumer newsletter mention**: "Companies on Trust Cabbage can no longer ignore your complaint, here is how it works", drives complaint-lane usage which drives company FOMO.

### 15.5 Sequencing
1. Build A+B quietly, seed with 2–3 friendly claimed companies (Growkit etc.) to generate real threads.
2. Ship C, then publish the landing page and the LinkedIn launch post in the same week, pointing at real resolved threads, never mockups.
3. Email blast to claimed companies after the first public case exists.
4. Badge announcements and case-study posts become the recurring engine.

Copy rule (site-wide, from memory): no em-dashes in any user-facing copy, use commas in prose and "|" in titles.

## 16. Open decisions (recommendations inline)

1. ~~Complaints public immediately vs grace window?~~ **Decided: 72h auto-publish grace window** with 24h no-reply customer escalation (see section 5). Window length (48h vs 72h) can still be tuned before build.
2. Should resolved feedback convert into a review automatically? **Recommend prompt-only, never automatic** (review policy requires explicit authorship).
3. Separate nav tab on company page vs section under Reviews? **Recommend separate tab** ("Service") once ≥1 case exists, hidden otherwise.

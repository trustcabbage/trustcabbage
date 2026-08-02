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

### 2.2 Customer responds (no account needed, still verified)
1. Email link carries a unique token: `/service/{token}`.
2. Because the company sent the email to that customer's address, the token itself proves the customer relationship. No OTP needed to open, but submitting requires confirming via the tokened link (possession of the email = verification). This is consistent with the platform's "every entry tied to a verified identity" rule.
3. Customer picks a lane:
   - **Feedback** (positive/neutral): short text + satisfaction rating (1–5), optionally converts into a full product/company review at the end ("Want this to count as your public review? Takes 2 more minutes").
   - **Complaint**: issue category, description, what resolution they expect.
4. Submission creates a public case (see visibility rules, section 5).

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

- **Complaints are public from the moment of submission.** Companies cannot preview, delay, or suppress them. This is the whole product; if companies could hide complaints it becomes worthless.
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

## 10. Open decisions (recommendations inline)

1. Complaints public immediately vs after 48h company head-start? **Recommend immediate** (credibility > company comfort; the badge rewards fast responders anyway).
2. Should resolved feedback convert into a review automatically? **Recommend prompt-only, never automatic** (review policy requires explicit authorship).
3. Separate nav tab on company page vs section under Reviews? **Recommend separate tab** ("Service") once ≥1 case exists, hidden otherwise.

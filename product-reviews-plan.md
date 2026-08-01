# Product-Level Reviews — Feature Plan

> Status: Sessions A–E built (31 Jul 2026), not deployed. Marketing page live at
> `/for-businesses/product-reviews`. Read alongside `brief.md` and `CODEBASE.md`.

## Sending your own email instead of the invite API's email

A company can send their own branded review-invite email instead of using the one
`/api/review-invite` sends. The link to use:

```
https://trustcabbage.com/company/[company-slug]/write-review?product=[their-own-SKU]&src=email
```

`product` matches either the product's TC slug or its `external_id` (their own SKU) — no need to
know TC's internal slug. No `embed=1` (that's only for the widget's inline iframe).

**Requirement, documented not auto-fixed (user decision, 31 Jul 2026):** only
`/api/review-invite`'s handler auto-creates a product by `external_id`. Neither
`write-review/page.tsx` (looks up only) nor the widget (collect mode links to write-review;
display mode's `product-data` endpoint 404s if missing) create one. So the product must be
registered via at least one `/api/review-invite` call before a company's own custom email link,
or the widget, will resolve it.

**Design bug found and fixed (1 Aug 2026):** `customer_email` was a hard-required field, meaning
even a company that specifically wanted to send their own email (precisely to avoid handing any
customer PII to Trust Cabbage) was still forced to share at least one customer's email just to
register a product. This directly contradicted the stated privacy motivation for that use case.
**Fixed in `/api/review-invite/route.ts`: `customer_email` is now optional.**
- With `customer_email`: unchanged behavior — registers the product (if new) and sends TC's invite email.
- Without `customer_email`: registers the product only, returns `{ status: 'registered', write_review_url }`,
  no email sent, no row in `api_invite_logs` (nothing to log), dedup/daily-cap checks skipped
  (they're keyed off email sends). This is the correct call for a company that wants to register
  a product before sending their own email, with zero customer data ever touching Trust Cabbage.

**The exact 3-step flow (`/dashboard/api` renamed from "API access" to "Product Reviews API" and
rewritten 1 Aug 2026 for clarity — the original one-line footnote was flagged as unclear, and the
mandatory-email requirement was flagged as contradicting the privacy use case):**
1. Generate the API key (dashboard).
2. Call `POST /api/review-invite` once per `product_id` — with an email if you want TC to send the
   invite, without one if you just want it registered (see design fix above). Nothing else to set up.
3. From then on, for that `product_id`: keep calling the invite API (with or without email) for
   future customers, AND/OR embed the widget, AND/OR send a custom email linking to
   `/company/[slug]/write-review?product=[sku]` — all combinable once step 2 has run once.

Docs page now shows both call shapes (A: with email, B: without) side by side, and the dashboard
link + `/dashboard/widget`'s cross-reference were renamed to "Product Reviews API" to match.

## Post-build fixes (31 Jul, later same night)

Two issues found while the user tested the collect widget locally, both fixed:

1. **Embed mode showed TC's own hero banner inside the iframe.** `EmbedAwareChrome` (added
   during Session E) only hid the shared navbar/footer — `write-review/page.tsx` still
   unconditionally rendered its own "Write a review for [Company]" dark hero section even when
   `embed=1`. Fixed: hero now wrapped in `{!isEmbed && (...)}`, and content padding tightens in
   embed mode. This is very likely what read as "taking the user to TC's own flow" — the widget
   was always an inline iframe (no real navigation, URL never changes), but the TC-branded header
   made it visually feel like a handoff.
2. **Duplicate-review check was scoped to company, not product** — `write-review/page.tsx` blocked
   a reviewer from ever submitting a second review for the same company, regardless of product.
   This directly undercuts product-level reviews: a repeat customer who reviewed Product A could
   never review Product B from the same company. **User decision: scope by product.** Fixed —
   when `?product=` is present (`initialProductId`), the check is now
   `company_id + reviewer_id + product_service_id`; with no product in context, it falls back to
   the original `product_service_id IS NULL` check (one general/company-level review, unchanged
   behavior for the classic B2B flow). A customer can now review each distinct product once.

## What this is

## What this is

A product-level review collection system for ecommerce (B2C) and B2B companies. Companies embed
one script tag on their site; Trust Cabbage collects verified per-product reviews, hosts them
publicly (Google-indexed), and renders them back on the company's own product pages. Includes
product Q&A. Companies manage nothing — no catalogue uploads, no review infrastructure.

## Core decisions (settled)

1. **A product review IS a company review with a product attached** — it counts toward the
   company's `average_rating`. One aggregate per company, not a parallel rating system.
   (`reviews.product_service_id` FK already exists.)
2. **No product pre-registration.** Company passes their own SKU/product-id in the snippet.
   TC auto-creates the product on first sight, keyed by `(api_key → company_id, external_product_id)`.
   Needs a new `external_products` concept (either new table or extend `products_services` with
   `external_id` + `auto_created` columns).
3. **One script, two modes:**
   - `data-mode="collect"` → order confirmation pages → inline review form
   - `data-mode="display"` → product detail pages → renders that product's reviews + Q&A
4. **Existing infra reused:** `embed=1` + postMessage flow, `/api/widget/[slug].js` pattern,
   `ref_token` + `review_source` tracking, Resend email, Upstash rate limiting, `invite_email_logs`.
5. **Email invite path (alternative to widget):** company POSTs to `/api/review-invite` with
   `{ customer_email, product_id, order_id }` → TC sends branded email via Resend.
   `order_id` stored for dedup. Unsubscribe + bounce handling required (Resend webhooks).
6. **API auth:** per-company API key (hashed in DB), generated/rotated at `/dashboard/api`.
7. **Reviews via API/widget are marked verified-purchase** (order context present) and
   reviewer still authenticates via OTP. One review per customer per product.
8. **Additive to business model, not cannibalising:** new SKU above Growth plan later;
   free during early access to seed volume. Require claimed+complete profile to get API access.

## Integration snippet (target DX)

```html
<script
  src="https://trustcabbage.com/api/widget/product.js"
  data-api-key="tc_live_xxxxx"
  data-product-id="SKU-1042"          <!-- company's own SKU, any string -->
  data-product-name="Vitamin C Serum" <!-- used on auto-create -->
  data-order-id="ORD-9234"            <!-- collect mode: dedup + verified-purchase -->
  data-mode="collect"                 <!-- or "display" -->
></script>
```

- Shopify / WooCommerce plugins later (zero-code path; 60–70% of Indian D2C is Shopify).
- GTM path: one tag reads dataLayer (page type + product id) → picks mode automatically.

## New schema needed

| Table / column | Purpose |
|---|---|
| `companies.api_key` (hashed) + `api_key_created_at` | API auth |
| `products_services.external_id`, `.auto_created` (or new `external_products` table) | auto-registered products keyed by company + external id |
| `api_invite_logs` (`company_id, product_id, customer_email, order_id, sent_at`) | email invite dedup + rate limiting |
| `product_questions` (`id, product_id, asker_id, body, created_at, status`) | Q&A questions |
| `product_answers` (`id, question_id, answerer_id, body, is_company_answer, is_verified_buyer, created_at`) | Q&A answers |

## Public surfaces

- **TC product page** `/company/[slug]/product/[product-slug]` — SSR, Schema.org Product +
  AggregateRating + Review + QAPage markup. Reviews filtered by `product_service_id`, Q&A below.
- **Company page → Products tab** — per-product star rating, links to product page.
- **Display widget** — aggregate rating + recent excerpts + Q&A + "see all on TC" link.
  Watermark removable on paid plan.
- **Dashboard → Products** — auto-populated list: rating, review count, unanswered-question count.

## Q&A rules

- Anyone logged-in asks; reading is public.
- Answers: company (Official badge, shown first), verified buyers (badge), other users (Community).
- Dashboard flags unanswered questions.
- Q&A rendered on both TC product page and display widget.

## Build order (sessions)

| # | Deliverable |
|---|---|
| A | API key generation + `/dashboard/api` page |
| B | `/api/review-invite` endpoint + Resend email template + `api_invite_logs` |
| C | TC product page `/company/[slug]/product/[slug]` (SSR + Schema.org) + auto-create product logic |
| D | Q&A tables + UI (ask/answer on product page, dashboard unanswered alerts) |
| E | `product.js` widget — collect mode (inline form) + display mode (reviews + Q&A render) |
| — | Later: Shopify app, WooCommerce plugin, GTM template |

## Mobile app integration (companies with native Android/iOS apps)

Script tags don't exist in native apps. Two supported paths, no SDK needed at launch:

**Path 1: Server-side API call (recommended default)**
The company's backend calls `POST /api/review-invite` when an order is delivered:
`{ customer_email, product_id, product_name, order_id }` with `Authorization: Bearer tc_live_xxx`.
TC sends the review invite email; customer reviews in browser. Zero app changes,
works identically for app orders, web orders, WhatsApp commerce. App-first companies always
have a backend team, so this is actually the easiest segment to integrate.

**Path 2: In-app WebView (review form inside the app)**
Open the existing embed URL in a WebView on the order-success screen:
`/company/[slug]/write-review?embed=1&product=SKU-1042&ref=[token]`
`embed=1` already hides nav/footer and posts `tc-review-submitted` on completion;
the WebView listens for that message and closes itself (~20 lines of app code,
same pattern as payment gateway / KYC WebView flows).

**Displaying reviews in the app:** WebView of the TC product page, or (later)
`GET /api/products/[external_id]/reviews` JSON endpoint for native rendering.

**Native SDK (Flutter/React Native):** later nice-to-have, not a launch requirement.

## Infrastructure cost model (build requirements, not afterthoughts)

The display widget loads on every product page view of every integrated company's site.
That is the only meaningful cost driver. Three rules keep it near-zero:

1. **CDN-cache every widget response**: `Cache-Control: public, s-maxage=3600` (same as the
   existing company widget). Cache hit = bandwidth only, no function invocation, no DB query,
   no Supabase egress. A 1-hour-stale rating is acceptable.
2. **Denormalize product aggregates**: `products_services.rating_avg` + `.review_count`,
   updated on review insert. Widget cache-miss = one indexed single-row read, never AVG().
3. **Text-only display widget**: excerpts only (~2KB JSON), no images. Photos live on the TC
   product page only. Image egress is the one cost that can bite (prior Supabase egress pain
   is why `prefetch={false}` exists).

Guards: per-API-key rate limit (Upstash, fail-open), bot blocklist must cover widget/API routes.

Estimated infra at 50 integrated companies (~2.5M widget loads/mo): ~$65–90/mo total
(Vercel Pro + Supabase Pro + Resend 50k tier). At 500 companies: ~$150–250/mo.
Cost per paying company is under ₹40 against a ₹4,999 Growth plan.

## Build status

- [x] Session A: API key generation + `/dashboard/api` (built 31 Jul 2026, migration 014)
- [x] Session B: `POST /api/review-invite` + email template + `api_invite_logs` (built 31 Jul 2026)
- [x] Session C: TC product page + Schema.org (built 31 Jul 2026, migration 016)
- [x] Session D: Q&A tables + UI (built 31 Jul 2026, migration 017)
- [x] Session E: `product.js` widget (collect + display modes) (built 31 Jul 2026)

### Session D notes
- `product_questions` + `product_answers` tables, public read, authenticated insert-own via RLS.
- `is_company_answer` / `is_verified_buyer` computed **server-side** in the action (checks `users.role`/`company_id` and an existing published review), never trusted from the client.
- Q&A section lives on the product page, below reviews. Answer badges: Official (company) shown first, then Verified buyer, then Community.
- Dashboard shows an amber "N unanswered questions" alert (links to the company's Products tab) when any company-product question has no `is_company_answer=true` answer yet.

### Session E notes — deviated from the original snippet's `data-api-key`
The original snippet had `data-api-key` in the embeddable `<script>` tag. **Changed this**: the
`tc_live_` key is used server-side only (`/api/review-invite`) and must never appear in public
page source, anyone viewing it could call the invite API as that company. Instead, the product
widget is keyed by **company slug in the script URL** (`/api/widget/product/[slug].js`), matching
the existing company widget's pattern — no secret involved, since display data is public and
collect-mode review submission is already protected by reviewer OTP, not a company secret.

- `GET /api/widget/product-data?slug=&product=` — public, cached (`s-maxage=3600`), reads the
  denormalized `rating_avg`/`review_count` (no AVG query), returns name/rating/3 excerpts/3 Q&A/URLs.
  `product` param matches either the product's `slug` or `external_id`.
- `GET /api/widget/product/[slug].js` — cached script, reads `data-product-id` + `data-mode`
  (`collect`|`display`) from its own tag at runtime via `document.currentScript`, so one cached
  script serves every product of that company.
  - `collect`: injects an iframe at `/company/[slug]/write-review?product=X&embed=1&src=widget`.
  - `display`: fetches `product-data`, renders stars/rating/excerpts/Q&A/CTAs as plain HTML.
- **Found + fixed a real gap while building this**: `embed=1` only controlled the postMessage-on-
  submit behavior, it never actually hid the navbar/footer despite CODEBASE.md documenting that it
  does. Fixed via `EmbedAwareChrome` (client component using `useSearchParams()`, wrapped in
  `Suspense`) in `(public)/layout.tsx` — this also fixes the pre-existing `/review/[slug]?embed=1`
  invite-link flow, not just the new widget.
- Dashboard → Widget page now shows both product snippets (collect + display) with copy buttons.

### Session C notes
- `products_services.slug` added (migration 016), unique per `(company_id, slug)`, backfilled for existing rows.
- `review-invite` endpoint now generates + stores a slug when auto-creating a product.
- Public page: `/company/[slug]/product/[productSlug]/page.tsx` — SSR, Schema.org Product + AggregateRating + Review, reuses `ReviewCard` component (same response/tags fetch pattern as the company page).
- Company page: product cards (both the Products tab and the overview/reviews sidebar list) now link to the product page when a slug exists, and show the product's own rating if it has reviews.
- `?product=` on `/company/[slug]/write-review` resolves against either `slug` or `external_id` (covers both a click from the product page and a click from an invite email) and pre-selects that product in both the B2B and B2C review forms.
- Not built yet: the product page itself has no direct "post via API" or "fetch via API" — that's Session E's widget collect/display modes, and the `GET /api/products/[external_id]/reviews` endpoint mentioned in the mobile section.

## Email compliance notes

- Emails sent on behalf of companies must state "you're receiving this because you purchased from X".
- Mandatory unsubscribe; feed Resend bounce/unsubscribe webhooks back into `api_invite_logs`.
- High-volume senders: domain verification in Resend (send as `reviews@theircompany.com`).

## Positioning / marketing (page already live)

- Gap owned: public Google-indexed trust platform + product-level collection API, built for India.
  Self-hosted tools (Judge.me/Yotpo) = on-site only, not trusted, invisible to Google.
  Global platforms (Trustpilot) = no product API for SMBs, ₹15–50k/mo, Western.
- Credibility anchor: Government of India IS 19000:2022 review-integrity standard —
  TC principles (OTP-verified, verified purchase, no deletion by business) align with it.
- Key stats used on page (sources cited there): Spiegel/Northwestern 270%/380% lift,
  4.2–4.7 sweet spot, first-5-reviews effect; BrightLocal 46%/98%; PowerReviews 82% negative-seeking;
  Bazaarvoice ~2× Q&A conversion. Spot-check citations before running paid ads on these claims.
- GTM wedge: free API during early access → seed review volume → paid tier under Growth later.
  Priority channels: Shopify India ecosystem, D2C founder communities, SaaSBoomi.

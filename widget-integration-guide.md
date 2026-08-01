# Trust Cabbage — Website Widget & QR Code Integration Guide

This guide is for businesses who have claimed their company page on Trust Cabbage and want to
collect reviews using the website widget, QR code, or review invite link. All three tools are
live today and free during early access.

**Prerequisite:** your company page must be claimed. If you haven't claimed it yet, go to
[trustcabbage.com/for-businesses/add](https://trustcabbage.com/for-businesses/add), search your
company, and claim it with your GST or CIN.

---

## 1. Website Widget

### What it is

A small rating badge that sits on your website. It shows your live Trust Cabbage star rating
and review count, and when a visitor clicks it, a popup opens with your review form right there
on your site (like a Calendly popup). Visitors can write a review without leaving your page.

### What it looks like

```
┌──────────────────────────────────────────────────┐
│ [TC]  TRUST CABBAGE                              │
│       ★★★★★ 4.6  32 reviews  | Write a review   │
└──────────────────────────────────────────────────┘
```

Clicking anywhere on the badge (or the "Write a review" button) opens a centered popup with
your review form. The popup closes automatically when the review is submitted, or on
Escape / clicking outside.

### How to install

**Step 1.** Log in to your dashboard at trustcabbage.com/dashboard and open **Website widget**.

**Step 2.** Copy your snippet. It looks like this (replace `your-company-slug` with your actual
slug, shown on the dashboard page):

```html
<!-- Trust Cabbage widget -->
<script src="https://trustcabbage.com/api/widget/your-company-slug.js" async></script>
```

**Step 3.** Paste it into your website's HTML wherever you want the badge to appear.
The badge renders exactly where the script tag is placed. Common placements:

| Placement | Where to paste |
|---|---|
| Site footer | Inside your footer template, next to your social links |
| Homepage hero | Below your main headline / CTA |
| Contact or About page | Near your address and contact details |
| Order confirmation page | Below the "thank you" message (best for collecting reviews) |

**Step 4.** Done. There is no step 4.

### Platform-specific instructions

**WordPress:** Appearance → Widgets → add a "Custom HTML" block where you want the badge,
paste the snippet. Or use a footer-code plugin and paste it there.

**Shopify:** Online Store → Themes → Edit code → open `theme.liquid` (for site-wide footer)
or the specific template, paste the snippet where you want the badge.

**Wix:** Add → Embed Code → Embed HTML, paste the snippet in the HTML box, position the frame.

**Webflow:** Add an Embed element where you want the badge, paste the snippet.

**Google Tag Manager:** Create a Custom HTML tag with the snippet, trigger on the pages you
want. Note: with GTM the badge appears where GTM injects it (end of body), so direct HTML
placement is preferred for positioning control.

### Behaviour notes

- The badge auto-updates: rating and review count are fetched fresh (cached up to 1 hour).
  You never need to touch the snippet again.
- Reviews submitted through the widget are tagged with source "widget" so you can see in
  your dashboard analytics how many reviews the widget brings in.
- The reviewer verifies with an email OTP inside the popup, so widget reviews are
  authenticated like all other Trust Cabbage reviews.
- The snippet is `async` and ~4 KB. It does not slow your page down and does not load
  anything until the badge renders.
- Multiple badges on one page are fine (e.g. header and footer), they share one popup.

### Troubleshooting

| Problem | Fix |
|---|---|
| Badge doesn't appear | Check the slug in the src URL matches your dashboard exactly. View the browser console: if it says "company not found", the slug is wrong. |
| Badge shows a dash instead of rating | You have no published reviews yet. It will show your rating automatically after the first review. |
| Popup blocked / doesn't open | Make sure no other script is intercepting clicks on the badge container (`id` starts with `tc-widget-`). |
| Badge appears at the bottom of the page instead of where you want | The badge renders at the script tag's position. Move the script tag, don't use GTM if you need precise placement. |

---

## 2. QR Code

### What it is

A downloadable, print-ready QR code (600×600 PNG, high error-correction so it scans even when
printed small). Scanning it takes the person straight to your review form, with the review
automatically tagged as source "QR" in your analytics.

### How to get it

**Step 1.** Log in to your dashboard and open **QR code**.

**Step 2.** Click download. You get `trustcabbage-qr-your-company.png`.

Note: the download is tied to your login. Only the claimed company admin can download the
company's QR code.

### Where to use it

| Placement | Why it works |
|---|---|
| Invoice footers | The client just received the deliverable, the moment of proof |
| Proposal / pitch deck last slide | Prospects scan and read your reviews on the spot |
| Office / store reception | Walk-in clients and visitors |
| Product packaging inserts | For retail and D2C: reviews at the unboxing moment |
| Event standees and visiting cards | Turns every offline touchpoint into a review channel |
| WhatsApp business catalog images | Works digitally too, any screen can be scanned |

### Print guidance

- Minimum print size: 2 cm × 2 cm (the QR uses high error correction, level H)
- Keep the white margin around the code (it's part of the file), don't crop it
- Don't recolor the code, contrast is what makes it scannable
- Add a caption near it: "Scan to review us on Trust Cabbage", people scan more when told why

---

## 3. Review Invite Link (bonus, also live)

The simplest tool: a unique link, shown in your dashboard under **Share tools**, of the form:

```
https://trustcabbage.com/review/your-company-slug?ref=YOUR_TOKEN
```

Send it anywhere: WhatsApp, email signature, SMS, client onboarding docs. It lands the client
directly on your review form. Reviews via this link are tagged as source "invite link".

The dashboard also has a one-click **WhatsApp share** button that opens WhatsApp with a
pre-written message containing your link.

---

## 4. Email Invites (also live)

From **Dashboard → Email invites**, enter a client's email and we send a branded review
invitation on your behalf. 100 invites per month on the free tier during early access.
Invites are logged so you can see what was sent and when.

---

## Which tool should I use?

| Your situation | Best tool |
|---|---|
| You have a website with traffic | Widget (order/thank-you page placement converts best) |
| You send invoices or proposals | QR code in the footer |
| You have a physical location | QR code at reception + on printed material |
| You talk to clients on WhatsApp | Invite link via WhatsApp share |
| You have a client email list | Email invites |
| All of the above | Use all of them, each one tags its source so analytics shows you what works |

---

*Questions? Email hello@trustcabbage.com*

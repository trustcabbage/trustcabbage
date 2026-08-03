// Shared HTML email templates used by both the dashboard's manual invite tool
// (dashboard/invites/_actions.ts) and the company-level invite API
// (api/company-invite/route.ts), so both paths send an identical email.

// Secondary block appended to review-invite emails: the review CTA stays the
// primary action, but every invited customer also gets the Service Desk door.
// The company chooses the email's framing, never what the customer may raise.
function serviceDeskSection(companyName: string, serviceUrl: string): string {
  return `
        <div style="margin-top:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 20px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:900;color:#0f172a;">Ran into a problem instead?</p>
          <p style="margin:0 0 10px;color:#64748b;font-size:13px;line-height:1.5;">
            Raise it on ${companyName}'s Service Desk and they can resolve it with you directly.
            Complaints appear publicly on their Trust Cabbage page within 72 hours, they cannot be buried.
          </p>
          <a href="${serviceUrl}" style="font-size:13px;font-weight:900;color:#6d28d9;text-decoration:none;">Raise an issue →</a>
        </div>`
}

export function buildCompanyInviteEmail(companyName: string, inviteUrl: string, serviceUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#1e1b4b;border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0;color:#a78bfa;font-weight:900;font-size:18px;letter-spacing:-0.5px;">
          Trust <span style="color:#fff;">Cabbage</span>
        </p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
          Share your experience with ${companyName}
        </h1>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
          You've been invited to leave an honest review for <strong>${companyName}</strong> on Trust Cabbage, India's verified B2B review platform. It takes about 3 minutes.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#6d28d9;color:#fff;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          Write my review →
        </a>${serviceUrl ? serviceDeskSection(companyName, serviceUrl) : ''}
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          You received this because ${companyName} invited you to share your feedback on Trust Cabbage.
          Reviews are permanent and publicly visible. If you did not work with this company, you can ignore this email.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

// Shared shell for the Service Desk notification emails (same visual frame as
// the invite emails above, parameterized so each notification stays one call).
function buildServiceShellEmail(opts: {
  heading: string
  bodyHtml: string
  ctaLabel: string
  ctaUrl: string
  footnote: string
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#1e1b4b;border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0;color:#a78bfa;font-weight:900;font-size:18px;letter-spacing:-0.5px;">
          Trust <span style="color:#fff;">Cabbage</span>
        </p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
          ${opts.heading}
        </h1>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
          ${opts.bodyHtml}
        </p>
        <a href="${opts.ctaUrl}" style="display:inline-block;background:#6d28d9;color:#fff;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          ${opts.ctaLabel}
        </a>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          ${opts.footnote}
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

// To the customer right after they submit a complaint.
export function buildComplaintAckEmail(companyName: string, caseTitle: string, serviceUrl: string): string {
  return buildServiceShellEmail({
    heading: 'Your complaint has been submitted',
    bodyHtml: `<strong>${companyName}</strong> has been notified about &ldquo;${caseTitle}&rdquo; and can respond right away. Your complaint appears publicly on their Trust Cabbage page within 72 hours, resolved or not. We will email you when they respond.`,
    ctaLabel: 'Track my complaint →',
    ctaUrl: serviceUrl,
    footnote: `You received this because you submitted a complaint about ${companyName} on Trust Cabbage. Companies cannot delay or prevent publication.`,
  })
}

// To the company admin(s) when a complaint lands.
export function buildComplaintAlertEmail(customerDisplay: string, caseTitle: string, category: string, dashboardUrl: string): string {
  return buildServiceShellEmail({
    heading: `New complaint: ${caseTitle}`,
    bodyHtml: `${customerDisplay} raised a <strong>${category}</strong> complaint through your Service Desk. It publishes on your Trust Cabbage page in <strong>72 hours</strong>, no matter what. Resolve it before then and it publishes already marked as resolved, which is your best possible outcome.`,
    ctaLabel: 'Respond now →',
    ctaUrl: dashboardUrl,
    footnote: 'You received this because you manage this company on Trust Cabbage. Fast resolutions earn your company its public service metrics.',
  })
}

// To the customer when the company replies on their case.
export function buildCompanyReplyEmail(companyName: string, caseTitle: string, serviceUrl: string): string {
  return buildServiceShellEmail({
    heading: `${companyName} replied to your complaint`,
    bodyHtml: `There is a new reply on &ldquo;${caseTitle}&rdquo;. Read it and continue the conversation from your complaint page.`,
    ctaLabel: 'Read their reply →',
    ctaUrl: serviceUrl,
    footnote: `You received this because you have an open complaint with ${companyName} on Trust Cabbage.`,
  })
}

// To the customer when the company marks a resolution as offered.
export function buildResolutionOfferEmail(companyName: string, caseTitle: string, resolutionSummary: string, serviceUrl: string): string {
  return buildServiceShellEmail({
    heading: `Did ${companyName} resolve your issue?`,
    bodyHtml: `${companyName} says they have resolved &ldquo;${caseTitle}&rdquo;: <em>&ldquo;${resolutionSummary}&rdquo;</em>. Only you can confirm it. One click, and your answer becomes part of their public record.`,
    ctaLabel: 'Confirm or decline →',
    ctaUrl: serviceUrl,
    footnote: `You received this because ${companyName} offered a resolution on your complaint. If you do nothing, the case stays marked as awaiting your confirmation, it is never auto-resolved.`,
  })
}

// Cron: one-time nudge 3 days after an unanswered service request.
export function buildServiceReminderEmail(
  companyName: string,
  customerName: string | null,
  productName: string | null,
  serviceUrl: string
): string {
  const greeting = customerName ? `Hi ${customerName}` : 'Hi there'
  return buildServiceShellEmail({
    heading: productName
      ? `Still time to tell us about your ${productName}`
      : `Still time to share your experience with ${companyName}`,
    bodyHtml: `${greeting}, a few days ago ${companyName} asked how things went${productName ? ` with your <strong>${productName}</strong>` : ''}. Loved it, or ran into a problem? Either way it takes about 2 minutes, and what you share helps other buyers decide. This is the only reminder we will send.`,
    ctaLabel: 'Share my experience →',
    ctaUrl: serviceUrl,
    footnote: `You received this because ${companyName} uses Trust Cabbage to collect honest feedback and resolve issues publicly. If this wasn't you, you can safely ignore this email.`,
  })
}

// Cron: one-time nudge 7 days after an unanswered resolution offer.
export function buildConfirmReminderEmail(companyName: string, caseTitle: string, serviceUrl: string): string {
  return buildServiceShellEmail({
    heading: `Reminder: did ${companyName} resolve your issue?`,
    bodyHtml: `A week ago ${companyName} said they resolved &ldquo;${caseTitle}&rdquo;, and only you can confirm or decline it. Until you answer, the case stays publicly marked as awaiting your confirmation, it is never auto-resolved. This is the only reminder we will send.`,
    ctaLabel: 'Confirm or decline →',
    ctaUrl: serviceUrl,
    footnote: `You received this because ${companyName} offered a resolution on your complaint on Trust Cabbage.`,
  })
}

// To the company when the customer writes back on an open case.
export function buildCustomerReplyEmail(customerDisplay: string, caseTitle: string, dashboardUrl: string): string {
  return buildServiceShellEmail({
    heading: `${customerDisplay} replied on their complaint`,
    bodyHtml: `There is a new message from ${customerDisplay} on &ldquo;${caseTitle}&rdquo;. The conversation is public, keep it moving.`,
    ctaLabel: 'Read and respond →',
    ctaUrl: dashboardUrl,
    footnote: 'You received this because you manage this company on Trust Cabbage.',
  })
}

// To the company when the customer confirms the resolution.
export function buildCaseResolvedEmail(customerDisplay: string, caseTitle: string, dashboardUrl: string): string {
  return buildServiceShellEmail({
    heading: 'Resolution confirmed by the customer',
    bodyHtml: `${customerDisplay} confirmed that &ldquo;${caseTitle}&rdquo; is resolved. The case now shows publicly as resolved and counts toward your service metrics.`,
    ctaLabel: 'View your Service Desk →',
    ctaUrl: dashboardUrl,
    footnote: 'You received this because you manage this company on Trust Cabbage.',
  })
}

// Service Desk request: deliberately neutral. It never says "review" or
// "complaint" up front; the tokened page routes on the customer's sentiment.
export function buildServiceRequestEmail(
  companyName: string,
  customerName: string | null,
  productName: string | null,
  serviceUrl: string
): string {
  const greeting = customerName ? `Hi ${customerName}` : 'Hi there'
  const subjectLine = productName
    ? `How was your ${productName} from ${companyName}?`
    : `How was your experience with ${companyName}?`
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#1e1b4b;border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0;color:#a78bfa;font-weight:900;font-size:18px;letter-spacing:-0.5px;">
          Trust <span style="color:#fff;">Cabbage</span>
        </p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
          ${subjectLine}
        </h1>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
          ${greeting}, <strong>${companyName}</strong> would like to hear how things went${productName ? ` with your <strong>${productName}</strong>` : ''}.
          Loved it? Tell others. Ran into a problem? Raise it here and ${companyName} will work on resolving it, in the open, on Trust Cabbage.
          It takes about 2 minutes.
        </p>
        <a href="${serviceUrl}" style="display:inline-block;background:#6d28d9;color:#fff;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          Share my experience →
        </a>
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          You received this because ${companyName} uses Trust Cabbage to collect honest feedback and resolve issues publicly.
          What you submit is publicly visible. Complaints appear publicly no later than 72 hours after submission and companies cannot prevent that.
          If this wasn't you, you can safely ignore this email.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

export function buildProductInviteEmail(companyName: string, productName: string, inviteUrl: string, serviceUrl?: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;margin:0;padding:24px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;">
    <tr><td>
      <div style="background:#1e1b4b;border-radius:16px 16px 0 0;padding:28px 32px;">
        <p style="margin:0;color:#a78bfa;font-weight:900;font-size:18px;letter-spacing:-0.5px;">
          Trust <span style="color:#fff;">Cabbage</span>
        </p>
      </div>
      <div style="background:#fff;padding:32px;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
        <h1 style="margin:0 0 12px;font-size:22px;font-weight:900;color:#0f172a;line-height:1.2;">
          How was your ${productName}?
        </h1>
        <p style="margin:0 0 24px;color:#64748b;font-size:15px;line-height:1.6;">
          You recently purchased <strong>${productName}</strong> from <strong>${companyName}</strong>.
          Share your honest experience on Trust Cabbage, India's verified review platform.
          It takes about 3 minutes and helps other buyers decide.
        </p>
        <a href="${inviteUrl}" style="display:inline-block;background:#6d28d9;color:#fff;font-weight:900;font-size:15px;padding:14px 28px;border-radius:12px;text-decoration:none;">
          Review my purchase →
        </a>${serviceUrl ? serviceDeskSection(companyName, serviceUrl) : ''}
        <hr style="border:none;border-top:1px solid #f1f5f9;margin:28px 0;">
        <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
          You received this because you purchased from ${companyName}, who uses Trust Cabbage to
          collect verified reviews. Reviews are permanent and publicly visible.
          If this wasn't you, you can safely ignore this email.
        </p>
      </div>
    </td></tr>
  </table>
</body>
</html>`
}

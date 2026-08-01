// Shared HTML email templates used by both the dashboard's manual invite tool
// (dashboard/invites/_actions.ts) and the company-level invite API
// (api/company-invite/route.ts), so both paths send an identical email.

export function buildCompanyInviteEmail(companyName: string, inviteUrl: string): string {
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
        </a>
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

export function buildProductInviteEmail(companyName: string, productName: string, inviteUrl: string): string {
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
        </a>
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

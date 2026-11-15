/**
 * Shared pieces for AFK THEORY transactional emails: HTML escaping and the
 * branded card layout.
 */

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
}

/**
 * Escapes text before it is placed in an HTML email. Customer-entered values
 * (names, addresses, notes) must always go through this.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/**
 * Returns the URL only when it is a plain http(s) link, otherwise undefined,
 * so values such as `javascript:` can never become a link in an email.
 */
export function safeHttpUrl(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!/^https?:\/\//i.test(trimmed)) return undefined
  try {
    return new URL(trimmed).href
  } catch {
    return undefined
  }
}

export function formatMoney(amount: number | undefined, currencyCode: string | undefined): string {
  const currency = (currencyCode || "bdt").toUpperCase()
  return `${(amount || 0).toLocaleString()} ${currency}`
}

export type EmailLayoutInput = {
  /** Browser/inbox title (plain text). */
  title: string
  /** Small label above the heading (plain text). */
  badge: string
  /** Main heading (plain text). */
  heading: string
  /** Trusted, already-escaped HTML for the message body. */
  bodyHtml: string
  /** Optional trusted HTML block shown under the body (for example order items). */
  extraHtml?: string
}

const SUPPORT_EMAIL = () => process.env.RESEND_REPLY_TO || "support@afktheory.com"

export function renderEmailLayout({
  title,
  badge,
  heading,
  bodyHtml,
  extraHtml = "",
}: EmailLayoutInput): string {
  const support = escapeHtml(SUPPORT_EMAIL())

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EDE6DC; font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #EDE6DC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDE6DC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #292828; border: 1px solid #444444; max-width: 600px; width: 100%;">
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 2px solid #D8F452;">
              <h1 style="margin: 0; color: #EDE6DC; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">AFK THEORY</h1>
              <p style="margin: 4px 0 0; color: #D8F452; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">PAUSE THE GAME. KEEP YOUR STYLE.</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 20px;">
              <div style="display: inline-block; background-color: #1F1E1E; color: #D8F452; padding: 4px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; border: 1px solid #D8F452;">${escapeHtml(badge)}</div>
              <h2 style="margin: 0 0 8px; font-size: 22px; color: #EDE6DC; font-weight: 600;">${escapeHtml(heading)}</h2>
              <div style="color: #CCCCCC; font-size: 14px; line-height: 1.6;">${bodyHtml}</div>
            </td>
          </tr>
          ${extraHtml ? `<tr><td style="padding: 0 32px 24px;">${extraHtml}</td></tr>` : ""}
          <tr>
            <td style="padding: 28px 32px; text-align: center; background-color: #292828; border-top: 1px solid #444444;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #888888;">Questions about your order? Reply to this email or write to us.</p>
              <p style="margin: 0; font-size: 13px; font-weight: 600;"><a href="mailto:${support}" style="color: #D8F452; text-decoration: underline;">${support}</a></p>
              <p style="margin: 16px 0 0; font-size: 11px; color: #666666;">&copy; ${new Date().getFullYear()} AFK THEORY. All rights reserved. &bull; Dhaka, Bangladesh</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

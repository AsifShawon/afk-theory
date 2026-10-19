export type EmailVerificationTemplateData = {
  email: string
  token: string
  verificationUrl?: string
}

export function generateEmailVerificationEmail(data: EmailVerificationTemplateData): {
  subject: string
  html: string
  text: string
} {
  const { email, token, verificationUrl } = data
  const storefrontUrl = process.env.STORE_CORS?.split(",")[0] || "http://localhost:8000"
  const url = verificationUrl || `${storefrontUrl}/bd/verify-account?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - AFK THEORY</title>
</head>
<body style="margin: 0; padding: 0; background-color: #EDE6DC; font-family: 'Space Grotesk', 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #EDE6DC;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #EDE6DC; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #292828; border: 1px solid #444444; max-width: 600px; width: 100%;">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 2px solid #D8F452; background-color: #292828;">
              <h1 style="margin: 0; color: #EDE6DC; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">
                AFK THEORY
              </h1>
              <p style="margin: 4px 0 0; color: #D8F452; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase;">
                PAUSE THE GAME. KEEP YOUR STYLE.
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px 32px; color: #EDE6DC;">
              <h2 style="margin: 0 0 12px; font-size: 20px; color: #EDE6DC; font-weight: 600;">
                Verify Your Customer Account
              </h2>
              <p style="margin: 0 0 20px; color: #CCCCCC; font-size: 14px; line-height: 1.6;">
                Thank you for creating an account with AFK THEORY. Please verify your email address (<strong>${email}</strong>) to activate your account.
              </p>

              <div style="text-align: center; margin: 28px 0;">
                <a href="${url}" style="background-color: #D8F452; color: #292828; padding: 14px 32px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; display: inline-block;">
                  Verify Email Address &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; text-align: center; background-color: #1F1E1E; border-top: 1px solid #333333;">
              <p style="margin: 0; font-size: 12px; color: #888888;">
                Need assistance? Contact <a href="mailto:support@afktheory.com" style="color: #D8F452; text-decoration: underline;">support@afktheory.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`

  const text = `
AFK THEORY - VERIFY YOUR EMAIL
Please verify your email address (${email}) by clicking the link below:
${url}

Support: support@afktheory.com
`

  return {
    subject: "Verify Your Email - AFK THEORY",
    html,
    text,
  }
}

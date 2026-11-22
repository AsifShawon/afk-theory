/**
 * Sending email. Resend in production; a console provider for local runs so
 * an order can be tested end to end without sending anything.
 */

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text: string
  /** Where replies go, for example the customer for the owner's copy. */
  replyTo?: string
}

export type SendResult = { ok: true; id: string | null } | { ok: false; error: string }

export interface EmailProvider {
  readonly name: string
  send(message: EmailMessage): Promise<SendResult>
}

type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body: string; signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}>

const RESEND_ENDPOINT = "https://api.resend.com/emails"

/**
 * Resend's HTTP API. `from` must be on a domain verified in Resend, for
 * example "AFK THEORY <orders@afktheory.com>".
 */
export function resendEmailProvider(options: { apiKey: string; from: string; fetch?: FetchLike; timeoutMs?: number }): EmailProvider {
  const doFetch: FetchLike = options.fetch ?? (globalThis.fetch as unknown as FetchLike)
  const timeoutMs = options.timeoutMs ?? 8000
  return {
    name: "resend",
    async send(message) {
      const controller = typeof AbortController === "function" ? new AbortController() : null
      const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
      try {
        const response = await doFetch(RESEND_ENDPOINT, {
          method: "POST",
          headers: { Authorization: `Bearer ${options.apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: options.from,
            to: [message.to],
            subject: message.subject,
            html: message.html,
            text: message.text,
            ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          }),
          signal: controller?.signal,
        })
        if (!response.ok) {
          // Resend error bodies name the problem (for example an unverified domain), never the key.
          const detail = (await response.text().catch(() => "")).slice(0, 200)
          return { ok: false, error: `Resend HTTP ${response.status}${detail ? `: ${detail}` : ""}` }
        }
        const body = (await response.json().catch(() => null)) as { id?: unknown } | null
        return { ok: true, id: typeof body?.id === "string" ? body.id : null }
      } catch (err) {
        const aborted = err instanceof Error && err.name === "AbortError"
        return { ok: false, error: aborted ? `Resend timed out after ${timeoutMs} ms` : `Resend request failed: ${err instanceof Error ? err.message : String(err)}` }
      } finally {
        if (timer) clearTimeout(timer)
      }
    },
  }
}

/** Prints emails instead of sending them. Never use in production. */
export function consoleEmailProvider(log: (line: string) => void = console.log): EmailProvider {
  let n = 0
  return {
    name: "console",
    async send(message) {
      n++
      log(`[email ${n}] to ${message.to}${message.replyTo ? ` (reply to ${message.replyTo})` : ""}\nSubject: ${message.subject}\n\n${message.text}\n`)
      return { ok: true, id: `console-${n}` }
    },
  }
}

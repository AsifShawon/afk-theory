/**
 * HTTP handlers for the order endpoint. functions/api/*.ts (Cloudflare Pages
 * Functions) are thin wrappers around these; they use only web standard
 * Request and Response, so tests run them in Node.
 */
import { consoleEmailProvider, resendEmailProvider, type EmailProvider } from "./email-provider"
import { placeOrder, type PlaceOrderContext } from "./place-order"
import { createChallenge, sha256Hex, verifySolution } from "./proof-of-work"
import { supabaseOrderStore, type OrderStore } from "./store"

/**
 * Settings in Cloudflare Pages > Settings > Variables and secrets. Never put
 * these in the repository or in NEXT_PUBLIC_ variables.
 */
export interface OrderEndpointEnv {
  SUPABASE_URL?: string
  /** sb_secret_... (or the legacy service_role key). Server only. */
  SUPABASE_SECRET_KEY?: string
  /** Long random text. Signs the spam check and salts IP hashes. */
  ORDER_SECRET?: string
  RESEND_API_KEY?: string
  /** For example "AFK THEORY <orders@afktheory.com>", on a domain verified in Resend. */
  ORDER_EMAIL_FROM?: string
  /** The inbox that receives every order. */
  ORDER_NOTIFY_EMAIL?: string
  /** "console" prints emails instead of sending them. Local testing only. */
  EMAIL_PROVIDER?: string
}

/** Checkout bodies are small; anything bigger is not a real order. */
export const MAX_BODY_BYTES = 16 * 1024

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

const notConfigured = () =>
  json(503, { ok: false, error: "unavailable", message: "Online checkout is not available right now. Please order on WhatsApp instead." })

/** True when the request comes from a page on this same site. */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("Origin")
  if (!origin) return false
  try {
    return new URL(origin).origin === new URL(request.url).origin
  } catch {
    return false
  }
}

/** GET /api/challenge: a fresh spam-check puzzle. */
export async function handleChallengeRequest(request: Request, env: OrderEndpointEnv): Promise<Response> {
  if (!env.ORDER_SECRET) return notConfigured()
  // Browsers do not send Origin on same-site GET; refuse only cross-site use.
  const origin = request.headers.get("Origin")
  if (origin && !isSameOrigin(request)) return json(403, { ok: false, error: "forbidden" })
  return json(200, await createChallenge(env.ORDER_SECRET))
}

export interface OrderHandlerOverrides {
  store?: OrderStore
  email?: EmailProvider | null
  now?: () => Date
  log?: (line: string) => void
}

/** POST /api/order */
export async function handleOrderRequest(request: Request, env: OrderEndpointEnv, overrides: OrderHandlerOverrides = {}): Promise<Response> {
  if (!isSameOrigin(request)) return json(403, { ok: false, error: "forbidden" })
  if (!(request.headers.get("Content-Type") ?? "").toLowerCase().startsWith("application/json")) {
    return json(415, { ok: false, error: "unsupported" })
  }
  const declared = Number(request.headers.get("Content-Length") ?? "0")
  if (declared > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" })

  const secret = env.ORDER_SECRET
  const store = overrides.store ?? (env.SUPABASE_URL && env.SUPABASE_SECRET_KEY ? supabaseOrderStore({ url: env.SUPABASE_URL, secretKey: env.SUPABASE_SECRET_KEY }) : null)
  if (!secret || !store) return notConfigured()

  const raw = await request.text()
  if (raw.length > MAX_BODY_BYTES) return json(413, { ok: false, error: "too_large" })
  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { ok: false, error: "invalid", message: "Could not read the order.", fields: {} })
  }

  const ip = request.headers.get("CF-Connecting-IP")
  const ctx: PlaceOrderContext = {
    store,
    email: overrides.email !== undefined ? overrides.email : emailProviderFor(env),
    ownerEmail: env.ORDER_NOTIFY_EMAIL?.trim() || null,
    siteUrl: new URL(request.url).origin,
    verifyChallenge: async (payload) => {
      const result = await verifySolution(secret, payload, overrides.now?.())
      return result.ok ? result.id : null
    },
    ipHash: ip ? await sha256Hex(`${secret}:${ip}`) : null,
    now: overrides.now,
    log: overrides.log,
  }

  try {
    const result = await placeOrder(body, ctx)
    return json(result.status, result.body)
  } catch (err) {
    // Unexpected bug. Never send the stack to the browser.
    ;(overrides.log ?? console.error)(`[order] Unexpected error: ${err instanceof Error ? err.message : String(err)}`)
    return json(503, { ok: false, error: "unsaved", message: "We could not take your order online right now. Please send it on WhatsApp instead.", emailed: false })
  }
}

function emailProviderFor(env: OrderEndpointEnv): EmailProvider | null {
  if (env.EMAIL_PROVIDER === "console") return consoleEmailProvider()
  if (env.RESEND_API_KEY && env.ORDER_EMAIL_FROM) return resendEmailProvider({ apiKey: env.RESEND_API_KEY, from: env.ORDER_EMAIL_FROM })
  return null
}

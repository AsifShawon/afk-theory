import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"

/**
 * Small in-memory rate limiter for sensitive routes (sign-in, password reset,
 * registration, order placement).
 *
 * It keeps counters in the memory of one backend process, which fits the single
 * VPS deployment. If the backend is ever run as several instances, counters are
 * per instance: move them to Redis before relying on exact limits.
 */

export type RateLimitRule = {
  /** Used in the response and to keep separate counters per rule. */
  name: string
  windowMs: number
  max: number
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

type Counter = { count: number; resetAt: number }

export type RateLimiter = {
  check: (key: string) => RateLimitResult
  /** Number of tracked keys, for tests and monitoring. */
  size: () => number
}

export function createRateLimiter(
  rule: RateLimitRule,
  options: { now?: () => number; maxKeys?: number } = {}
): RateLimiter {
  const now = options.now ?? Date.now
  const maxKeys = options.maxKeys ?? 10_000
  const counters = new Map<string, Counter>()

  function prune(currentTime: number) {
    for (const [key, counter] of counters) {
      if (counter.resetAt <= currentTime) counters.delete(key)
    }
    // Still too many distinct clients (for example an attack): drop the oldest entries.
    while (counters.size > maxKeys) {
      const oldest = counters.keys().next().value
      if (oldest === undefined) break
      counters.delete(oldest)
    }
  }

  return {
    check(key: string): RateLimitResult {
      const currentTime = now()
      if (counters.size >= maxKeys) prune(currentTime)

      let counter = counters.get(key)
      if (!counter || counter.resetAt <= currentTime) {
        counter = { count: 0, resetAt: currentTime + rule.windowMs }
        counters.set(key, counter)
      }

      counter.count += 1
      const retryAfterSeconds = Math.max(1, Math.ceil((counter.resetAt - currentTime) / 1000))

      return {
        allowed: counter.count <= rule.max,
        remaining: Math.max(0, rule.max - counter.count),
        retryAfterSeconds,
      }
    },
    size: () => counters.size,
  }
}

type RequestLike = {
  ip?: string
  headers?: Record<string, string | string[] | undefined>
  socket?: { remoteAddress?: string }
}

/**
 * The address to count requests against.
 *
 * Behind a reverse proxy (Caddy, Nginx) every request appears to come from the
 * proxy, which would put all customers in one bucket. With
 * TRUST_PROXY_HEADERS=true the last X-Forwarded-For entry is used: that is the
 * address the proxy itself appended, so a visitor cannot fake it by sending
 * their own header. Only enable it when the backend is reachable through the
 * proxy only.
 */
export function getClientIp(
  req: RequestLike,
  env: NodeJS.ProcessEnv = process.env
): string {
  if (env.TRUST_PROXY_HEADERS === "true") {
    const header = req.headers?.["x-forwarded-for"]
    const raw = Array.isArray(header) ? header.join(",") : header
    const last = raw?.split(",").map((part) => part.trim()).filter(Boolean).pop()
    if (last) return last
  }

  return req.ip || req.socket?.remoteAddress || "unknown"
}

/**
 * Express-style middleware for defineMiddlewares. Rejects with 429 and a
 * Retry-After header once a client exceeds the rule.
 */
export function rateLimit(rule: RateLimitRule) {
  const limiter = createRateLimiter(rule)

  return (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
    const result = limiter.check(getClientIp(req as unknown as RequestLike))

    if (!result.allowed) {
      res.setHeader("Retry-After", String(result.retryAfterSeconds))
      res.status(429).json({
        type: "too_many_requests",
        message: `Too many attempts. Please wait ${Math.ceil(
          result.retryAfterSeconds / 60
        )} minute(s) and try again.`,
      })
      return
    }

    return next()
  }
}

/** Limits per route group. Counted per client IP. */
export const RATE_LIMITS = {
  /** Sign-in, registration and password reset requests (brute-force protection). */
  auth: { name: "auth", windowMs: 60_000, max: 10 },
  /** Password reset emails: stricter, each request sends an email. */
  passwordReset: { name: "password-reset", windowMs: 15 * 60_000, max: 5 },
  /** Creating customer accounts. */
  register: { name: "register", windowMs: 15 * 60_000, max: 10 },
  /** Placing orders: protects the Cash on Delivery flow from fake-order floods. */
  checkout: { name: "checkout", windowMs: 10 * 60_000, max: 10 },
} satisfies Record<string, RateLimitRule>

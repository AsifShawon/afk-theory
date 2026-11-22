/**
 * Spam check for checkout: a proof-of-work puzzle in the ALTCHA format
 * (https://altcha.org, MIT). The server hands out a signed puzzle; the browser
 * spends a second or two finding the answer while the customer fills in the
 * form. Bots placing many orders have to pay that cost every time. No cookies,
 * no tracking, no third-party service.
 *
 * Uses Web Crypto only, so the same code runs on Cloudflare, in Node and in
 * the browser.
 */

export interface Challenge {
  algorithm: "SHA-256"
  challenge: string
  /** Highest number the answer can be. */
  maxnumber: number
  /** Random part plus "?expires=<unix seconds>". */
  salt: string
  signature: string
}

export interface Solution {
  algorithm: "SHA-256"
  challenge: string
  number: number
  salt: string
  signature: string
}

/** Average work is half of this. About a second on a mid-range phone. */
export const DEFAULT_MAX_NUMBER = 60_000
/** A puzzle stays valid for 20 minutes: time to fill in the form. */
export const CHALLENGE_TTL_SECONDS = 20 * 60

const encoder = new TextEncoder()

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, "0")).join("")
}

export async function sha256Hex(text: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", encoder.encode(text)))
}

export async function hmacSha256Hex(key: string, text: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", encoder.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"])
  return hex(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(text)))
}

function randomHex(bytes: number): string {
  return hex(crypto.getRandomValues(new Uint8Array(bytes)).buffer as ArrayBuffer)
}

/** Constant-time string comparison, so signatures cannot be guessed byte by byte. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function createChallenge(
  secret: string,
  options: { maxNumber?: number; now?: Date; number?: number } = {}
): Promise<Challenge> {
  const maxnumber = options.maxNumber ?? DEFAULT_MAX_NUMBER
  const expires = Math.floor((options.now ?? new Date()).getTime() / 1000) + CHALLENGE_TTL_SECONDS
  const salt = `${randomHex(12)}?expires=${expires}`
  const number = options.number ?? (crypto.getRandomValues(new Uint32Array(1))[0] % (maxnumber + 1))
  const challenge = await sha256Hex(`${salt}${number}`)
  return { algorithm: "SHA-256", challenge, maxnumber, salt, signature: await hmacSha256Hex(secret, challenge) }
}

export type VerifyResult = { ok: true; id: string } | { ok: false; reason: "malformed" | "expired" | "wrong" }

/**
 * Checks a solution. `id` (the signature) is unique per puzzle: the order
 * database stores it so one solved puzzle can place only one order.
 */
export async function verifySolution(secret: string, payload: unknown, now: Date = new Date()): Promise<VerifyResult> {
  const solution = parseSolution(payload)
  if (!solution) return { ok: false, reason: "malformed" }
  const expires = Number(new URLSearchParams(solution.salt.split("?")[1] ?? "").get("expires"))
  if (!Number.isFinite(expires) || expires * 1000 < now.getTime()) return { ok: false, reason: "expired" }
  const [hash, signature] = await Promise.all([sha256Hex(`${solution.salt}${solution.number}`), hmacSha256Hex(secret, solution.challenge)])
  if (!safeEqual(hash, solution.challenge) || !safeEqual(signature, solution.signature)) return { ok: false, reason: "wrong" }
  return { ok: true, id: solution.signature }
}

/** Accepts the solution object or its base64 JSON form (what the ALTCHA widget sends). */
function parseSolution(payload: unknown): Solution | null {
  let value = payload
  if (typeof value === "string") {
    if (value.length > 2000) return null
    try {
      value = JSON.parse(atob(value))
    } catch {
      return null
    }
  }
  if (!value || typeof value !== "object") return null
  const s = value as Record<string, unknown>
  if (
    s.algorithm !== "SHA-256" ||
    typeof s.challenge !== "string" ||
    typeof s.salt !== "string" ||
    typeof s.signature !== "string" ||
    typeof s.number !== "number" ||
    !Number.isInteger(s.number) ||
    s.number < 0 ||
    s.salt.length > 200 ||
    !/^[0-9a-f]{64}$/.test(s.challenge) ||
    !/^[0-9a-f]{64}$/.test(s.signature)
  ) {
    return null
  }
  return { algorithm: "SHA-256", challenge: s.challenge, number: s.number, salt: s.salt, signature: s.signature }
}

/**
 * Finds the answer in the browser. Checks `shouldStop` between batches so a
 * page that is closed or reloaded stops working.
 */
export async function solveChallenge(challenge: Challenge, shouldStop: () => boolean = () => false): Promise<Solution | null> {
  for (let number = 0; number <= challenge.maxnumber; number++) {
    if (number % 500 === 0 && shouldStop()) return null
    if ((await sha256Hex(`${challenge.salt}${number}`)) === challenge.challenge) {
      return { algorithm: challenge.algorithm, challenge: challenge.challenge, number, salt: challenge.salt, signature: challenge.signature }
    }
  }
  return null
}

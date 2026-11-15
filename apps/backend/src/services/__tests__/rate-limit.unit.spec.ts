import {
  RATE_LIMITS,
  createRateLimiter,
  getClientIp,
  rateLimit,
} from "../../api/rate-limit"

describe("createRateLimiter", () => {
  const rule = { name: "test", windowMs: 60_000, max: 3 }

  it("allows requests up to the limit, then blocks", () => {
    let time = 1_000
    const limiter = createRateLimiter(rule, { now: () => time })

    expect(limiter.check("1.1.1.1")).toMatchObject({ allowed: true, remaining: 2 })
    expect(limiter.check("1.1.1.1")).toMatchObject({ allowed: true, remaining: 1 })
    expect(limiter.check("1.1.1.1")).toMatchObject({ allowed: true, remaining: 0 })

    const blocked = limiter.check("1.1.1.1")
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfterSeconds).toBe(60)

    time += 20_000
    expect(limiter.check("1.1.1.1").retryAfterSeconds).toBe(40)
  })

  it("counts each client separately", () => {
    const limiter = createRateLimiter(rule, { now: () => 0 })
    for (let i = 0; i < 5; i++) limiter.check("1.1.1.1")

    expect(limiter.check("1.1.1.1").allowed).toBe(false)
    expect(limiter.check("2.2.2.2").allowed).toBe(true)
  })

  it("lets a client back in when the window ends", () => {
    let time = 0
    const limiter = createRateLimiter(rule, { now: () => time })
    for (let i = 0; i < 4; i++) limiter.check("1.1.1.1")
    expect(limiter.check("1.1.1.1").allowed).toBe(false)

    time = 60_000
    expect(limiter.check("1.1.1.1")).toMatchObject({ allowed: true, remaining: 2 })
  })

  it("does not grow without bound", () => {
    let time = 0
    const limiter = createRateLimiter(rule, { now: () => time, maxKeys: 100 })

    for (let i = 0; i < 1_000; i++) limiter.check(`10.0.${Math.floor(i / 250)}.${i % 250}`)
    expect(limiter.size()).toBeLessThanOrEqual(101)

    // Expired entries are cleaned out the next time the table is full.
    time = 120_000
    for (let i = 0; i < 100; i++) limiter.check(`192.168.0.${i}`)
    limiter.check("172.16.0.1")
    expect(limiter.size()).toBeLessThanOrEqual(101)
  })
})

describe("getClientIp", () => {
  it("uses the connection address by default and ignores forwarded headers", () => {
    const req = { ip: "203.0.113.5", headers: { "x-forwarded-for": "9.9.9.9" } }
    expect(getClientIp(req, {} as NodeJS.ProcessEnv)).toBe("203.0.113.5")
  })

  it("uses the address the proxy appended when TRUST_PROXY_HEADERS is on", () => {
    const env = { TRUST_PROXY_HEADERS: "true" } as unknown as NodeJS.ProcessEnv
    // A visitor can send their own X-Forwarded-For; the proxy appends the real address last.
    const req = { ip: "127.0.0.1", headers: { "x-forwarded-for": "6.6.6.6, 198.51.100.7" } }
    expect(getClientIp(req, env)).toBe("198.51.100.7")
  })

  it("falls back to the connection address when the header is missing", () => {
    const env = { TRUST_PROXY_HEADERS: "true" } as unknown as NodeJS.ProcessEnv
    expect(getClientIp({ ip: "127.0.0.1", headers: {} }, env)).toBe("127.0.0.1")
    expect(getClientIp({ socket: { remoteAddress: "10.1.1.1" } }, {} as NodeJS.ProcessEnv)).toBe("10.1.1.1")
    expect(getClientIp({}, {} as NodeJS.ProcessEnv)).toBe("unknown")
  })
})

describe("rateLimit middleware", () => {
  function run(middleware: ReturnType<typeof rateLimit>, ip: string) {
    const res = {
      statusCode: 200,
      body: undefined as unknown,
      headers: {} as Record<string, string>,
      setHeader(name: string, value: string) {
        this.headers[name] = value
      },
      status(code: number) {
        this.statusCode = code
        return this
      },
      json(payload: unknown) {
        this.body = payload
      },
    }
    const next = jest.fn()
    middleware({ ip, headers: {} } as never, res as never, next)
    return { res, next }
  }

  it("passes requests through, then answers 429 with Retry-After", () => {
    const middleware = rateLimit({ name: "mw", windowMs: 60_000, max: 2 })

    expect(run(middleware, "1.2.3.4").next).toHaveBeenCalledTimes(1)
    expect(run(middleware, "1.2.3.4").next).toHaveBeenCalledTimes(1)

    const blocked = run(middleware, "1.2.3.4")
    expect(blocked.next).not.toHaveBeenCalled()
    expect(blocked.res.statusCode).toBe(429)
    expect(blocked.res.headers["Retry-After"]).toBeDefined()
    expect(blocked.res.body).toMatchObject({ type: "too_many_requests" })

    expect(run(middleware, "5.6.7.8").next).toHaveBeenCalledTimes(1)
  })

  it("ships sensible limits for sensitive routes", () => {
    expect(RATE_LIMITS.passwordReset.max).toBeLessThan(RATE_LIMITS.auth.max)
    expect(RATE_LIMITS.checkout.max).toBeGreaterThanOrEqual(3)
  })
})

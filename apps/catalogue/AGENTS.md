# AGENTS.md - apps/catalogue

Temporary public showcase for AFK THEORY while the Medusa store has no server. It is separate from Medusa: it never imports from `apps/backend` or `apps/storefront`, and Medusa guardrails in the root AGENTS.md still apply to those apps.

- **Static export only** (`output: "export"`). No route handlers, server actions, middleware or `next/image` optimization. Everything must render at build time. The only server code is the order endpoint in `functions/api/` at the repository root (Cloudflare Pages Functions); its logic lives in `packages/catalogue-core/src/orders/` with tests, and the function files stay thin wrappers.
- **Data:** `scripts/sync-catalogue.ts` reads published rows from Supabase with the publishable key, downloads images into `public/media/`, and writes `src/generated/catalogue.json`. Both outputs are gitignored. Pages read them through `src/lib/catalogue.ts`. With no Supabase env, the sync falls back to the starter catalogue in `@dtc/catalogue-core/seed` (local dev and CI). On a hosting provider (`CF_PAGES`, `VERCEL`, `NETLIFY`), missing env fails the build on purpose.
- **Ordering:** chat by default. `src/lib/order-message.ts` builds the message and the `wa.me` / `m.me` links. Keep it pure and keep `src/lib/__tests__/order-message.test.ts` passing (`pnpm --filter @dtc/catalogue test`). With `NEXT_PUBLIC_CHECKOUT=1` at build time (`src/lib/checkout.ts`), the order list becomes a cart and `/checkout/` posts to `/api/order`; WhatsApp stays as the fallback. Never trust prices from the browser: the endpoint reprices from Supabase. Orders hold personal data: no anon access, no phone numbers in logs.
- **Motion:** GSAP + ScrollTrigger via `src/lib/gsap.ts`, Lenis in `components/motion/smooth-scroll.tsx`. Build every animation inside `gsap.matchMedia()` with `MOTION_OK` so reduced-motion users get a static page. Never let a scroll timeline and an intro tween animate the same property on the same element.
- **Ports:** dev and preview run on 8100.

Commands (from the repo root):

```bash
pnpm catalogue:dev                      # sync + next dev on :8100
pnpm --filter @dtc/catalogue build      # sync + static export to apps/catalogue/out
pnpm --filter @dtc/catalogue preview    # serve out/ locally
pnpm --filter @dtc/catalogue test
```

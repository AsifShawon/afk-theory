# AGENTS.md - apps/catalogue

Temporary public showcase for AFK THEORY while the Medusa store has no server. It is separate from Medusa: it never imports from `apps/backend` or `apps/storefront`, and Medusa guardrails in the root AGENTS.md still apply to those apps.

- **Static export only** (`output: "export"`). No route handlers, server actions, middleware or `next/image` optimization. Everything must render at build time.
- **Data:** `scripts/sync-catalogue.ts` reads published rows from Supabase with the publishable key, downloads images into `public/media/`, and writes `src/generated/catalogue.json`. Both outputs are gitignored. Pages read them through `src/lib/catalogue.ts`. With no Supabase env, the sync falls back to the starter catalogue in `@dtc/catalogue-core/seed` (local dev and CI). On a hosting provider (`CF_PAGES`, `VERCEL`, `NETLIFY`), missing env fails the build on purpose.
- **Ordering** is chat only: `src/lib/order-message.ts` builds the message and the `wa.me` / `m.me` links. Keep it pure and keep `src/lib/__tests__/order-message.test.ts` passing (`pnpm --filter @dtc/catalogue test`).
- **Motion:** GSAP + ScrollTrigger via `src/lib/gsap.ts`, Lenis in `components/motion/smooth-scroll.tsx`. Build every animation inside `gsap.matchMedia()` with `MOTION_OK` so reduced-motion users get a static page. Never let a scroll timeline and an intro tween animate the same property on the same element.
- **Ports:** dev and preview run on 8100.

Commands (from the repo root):

```bash
pnpm catalogue:dev                      # sync + next dev on :8100
pnpm --filter @dtc/catalogue build      # sync + static export to apps/catalogue/out
pnpm --filter @dtc/catalogue preview    # serve out/ locally
pnpm --filter @dtc/catalogue test
```

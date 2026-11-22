# AGENTS.md - apps/catalogue-admin

LOCAL-ONLY admin for the showcase catalogue (`apps/catalogue`). It holds the Supabase secret key, which bypasses row level security. **Never deploy it, never add it to a hosting config, never expose it beyond 127.0.0.1.** This is not a replacement for Medusa Admin; the root guardrail against a custom admin applies to the Medusa store, and this app exists only until the store is hosted.

- Writes go through server actions in `src/app/actions/`. Validate every input with the zod schemas in `@dtc/catalogue-core` before touching Supabase.
- `src/lib/supabase-server.ts` imports `server-only`. Code shared with `scripts/seed.ts` (`src/lib/env.ts`, `src/lib/supabase.ts`, `src/lib/images.ts`) must not import it.
- Images: `src/lib/images.ts` converts uploads to webp at the widths in `IMAGE_WIDTHS` and stores them as `products/<productId>/<imageId>-<width>.webp`. File names are never reused, so the public site caches them forever.
- Schema changes: add a new file in `supabase/migrations/`; never edit one that may already have run. Update the row types in `@dtc/catalogue-core` to match.
- Orders (`/orders`): read and updated with the secret key through `src/lib/orders.ts` and `src/app/actions/orders.ts`. Customer emails go through the same `@dtc/catalogue-core/orders` templates as the order endpoint. Never log or export order data anywhere except the CSV the owner downloads.
- The layout shows a setup screen instead of crashing when env is missing, so `pnpm dev` at the root keeps working for people who never set up Supabase.

```bash
pnpm catalogue-admin:dev    # http://127.0.0.1:8200
pnpm catalogue-admin:seed   # load the starter product and settings
```

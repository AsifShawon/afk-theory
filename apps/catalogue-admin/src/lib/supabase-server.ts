import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { missingEnvKeys, readAdminEnv, type AdminEnv } from "./env"
import { createAdminClient } from "./supabase"

let cached: { env: AdminEnv; client: SupabaseClient } | null = null

/** Server-side admin client. Throws a readable error when env is missing. */
export function getAdmin(): { env: AdminEnv; client: SupabaseClient } {
  if (cached) {
    return cached
  }
  const env = readAdminEnv()
  const missing = missingEnvKeys(env)
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")} in apps/catalogue-admin/.env.local`)
  }
  cached = { env, client: createAdminClient(env) }
  return cached
}

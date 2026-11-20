import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { imageObjectKey, STORAGE_BUCKET } from "@dtc/catalogue-core"
import type { AdminEnv } from "./env"

/**
 * Supabase client with the secret key. It bypasses row level security, so it
 * may only ever run on this machine (server actions and scripts).
 */
export function createAdminClient(env: AdminEnv): SupabaseClient {
  return createClient(env.supabaseUrl, env.secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function publicImageUrl(env: AdminEnv, path: string, width: number): string {
  return `${env.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${imageObjectKey(path, width)}`
}

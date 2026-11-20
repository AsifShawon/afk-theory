import { createClient } from "@supabase/supabase-js"
import { imageObjectKey, STORAGE_BUCKET } from "@dtc/catalogue-core"

/**
 * Supabase settings for the public site. Only the publishable (anon) key is
 * used: row level security limits it to published products. These are read
 * at build time and in `next dev`; they are never sent to the browser.
 */
export interface SiteSupabaseEnv {
  url: string
  publishableKey: string
}

export function readSiteSupabaseEnv(source: NodeJS.ProcessEnv = process.env): SiteSupabaseEnv | null {
  const url = (source.SUPABASE_URL ?? "").trim().replace(/\/+$/, "")
  const publishableKey = (source.SUPABASE_PUBLISHABLE_KEY ?? source.SUPABASE_ANON_KEY ?? "").trim()
  return url && publishableKey ? { url, publishableKey } : null
}

export function createPublicClient(env: SiteSupabaseEnv) {
  return createClient(env.url, env.publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

export function storageObjectUrl(env: SiteSupabaseEnv, path: string, width: number): string {
  return `${env.url}/storage/v1/object/public/${STORAGE_BUCKET}/${imageObjectKey(path, width)}`
}

/** Where a synced image is served from in the static site. */
export function localMediaUrl(path: string, width: number): string {
  return `/media/${imageObjectKey(path, width)}`
}

import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { CUSTOM_DESIGNS_MIGRATION, isMissingColumn, isMissingTable, STORE_STRUCTURE_MIGRATION, TABLES } from "@dtc/catalogue-core"

export const STORE_MIGRATION_PATH = `apps/catalogue-admin/supabase/migrations/${STORE_STRUCTURE_MIGRATION}`
export const CUSTOM_DESIGNS_MIGRATION_PATH = `apps/catalogue-admin/supabase/migrations/${CUSTOM_DESIGNS_MIGRATION}`

export const STORE_MIGRATION_HINT = `This needs one more database step. In Supabase open the SQL editor, run ${STORE_MIGRATION_PATH}, then try again.`
export const CUSTOM_DESIGNS_MIGRATION_HINT = `Custom gallery needs one database step. In Supabase open the SQL editor, run ${CUSTOM_DESIGNS_MIGRATION_PATH}, then reload.`

/**
 * True once migration 20261122000000 has run. Every table and column in it
 * is created together, so the collections table stands for all of them.
 */
export async function storeStructureReady(client: SupabaseClient): Promise<boolean> {
  // A normal GET, not a HEAD request: only a response body says why it failed.
  const { error } = await client.from(TABLES.collections).select("id").limit(1)
  if (!error) return true
  if (isMissingTable(error)) return false
  throw new Error(error.message)
}

/**
 * True once migration 20261124000000 has added meta_content_id to products.
 */
export async function metaContentIdReady(client: SupabaseClient): Promise<boolean> {
  const { error } = await client.from(TABLES.products).select("meta_content_id").limit(1)
  if (!error) return true
  if (isMissingColumn(error)) return false
  return false
}

/** True once migration 20261128000000 has added the custom_designs table. */
export async function customDesignsReady(client: SupabaseClient): Promise<boolean> {
  const { error } = await client.from(TABLES.customDesigns).select("id").limit(1)
  if (!error) return true
  if (isMissingTable(error)) return false
  throw new Error(error.message)
}

/** Replaces database errors about the missing migration with the hint. */
export function storeError(err: unknown): Error {
  const error = err && typeof err === "object" && "message" in err ? (err as { message: string; code?: string }) : { message: String(err) }
  if (isMissingTable(error) || isMissingColumn(error)) {
    return new Error(STORE_MIGRATION_HINT)
  }
  return err instanceof Error ? err : new Error(error.message)
}

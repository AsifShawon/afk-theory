import "server-only"
import type { SupabaseClient } from "@supabase/supabase-js"
import { TABLES } from "@dtc/catalogue-core"

/**
 * Marks the site as changed so the Publish button shows "unpublished
 * changes" after edits that leave no updated_at of their own, such as
 * deleting a collection or changing menu picks.
 */
export async function markSiteChanged(client: SupabaseClient) {
  await client.from(TABLES.settings).update({ updated_at: new Date().toISOString() }).eq("id", 1)
}

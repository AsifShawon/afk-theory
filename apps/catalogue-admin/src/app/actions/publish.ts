"use server"

import { revalidatePath } from "next/cache"
import { TABLES } from "@dtc/catalogue-core"
import { fail, type ActionResult } from "@/lib/action-result"
import { getAdmin } from "@/lib/supabase-server"

/**
 * Asks the host (Cloudflare Pages, Netlify or Vercel) to rebuild the public
 * site. The build pulls the latest published products from Supabase.
 */
export async function publishSite(): Promise<ActionResult> {
  try {
    const { client, env } = getAdmin()
    if (!env.deployHookUrl) {
      return {
        ok: false,
        error:
          "No deploy hook set. Add CATALOGUE_DEPLOY_HOOK_URL to apps/catalogue-admin/.env.local, or build locally with: pnpm catalogue:build",
      }
    }
    const url = new URL(env.deployHookUrl)
    if (url.protocol !== "https:") {
      return { ok: false, error: "The deploy hook URL must start with https://" }
    }

    const response = await fetch(url, { method: "POST" })
    if (!response.ok) {
      return { ok: false, error: `The host rejected the deploy hook (HTTP ${response.status})` }
    }

    const { error } = await client
      .from(TABLES.settings)
      .update({ published_at: new Date().toISOString() })
      .eq("id", 1)
    if (error) throw new Error(error.message)

    revalidatePath("/", "layout")
    return { ok: true, data: undefined, message: "Rebuild started. The site updates in 1-2 minutes." }
  } catch (err) {
    return fail(err)
  }
}

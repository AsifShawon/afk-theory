"use server"

import { revalidatePath } from "next/cache"
import { homeSectionsInputSchema, sitePageInputSchema, TABLES } from "@dtc/catalogue-core"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { storeError } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

/** Creates or updates one content page (About, Delivery and returns, ...). */
export async function saveSitePage(input: unknown): Promise<ActionResult> {
  const parsed = sitePageInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const { client } = getAdmin()
    const page = parsed.data
    const { error } = await client.from(TABLES.pages).upsert(
      {
        slug: page.slug,
        title: page.title,
        html: page.html,
        seo_title: page.seoTitle,
        seo_description: page.seoDescription,
      },
      { onConflict: "slug" }
    )
    if (error) throw error
    revalidatePath("/site-pages")
    return { ok: true, data: undefined, message: page.html ? "Page saved" : "Saved. Empty pages are hidden on the site." }
  } catch (err) {
    return fail(storeError(err))
  }
}

/** Saves the homepage section order and which sections show. */
export async function saveHomeSections(input: unknown): Promise<ActionResult> {
  const parsed = homeSectionsInputSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid sections" }
  }
  try {
    const { client } = getAdmin()
    const { error } = await client.from(TABLES.settings).update({ home_sections: parsed.data }).eq("id", 1)
    if (error) throw error
    revalidatePath("/homepage")
    return { ok: true, data: undefined, message: "Homepage saved. Press Publish to update the site." }
  } catch (err) {
    return fail(storeError(err))
  }
}

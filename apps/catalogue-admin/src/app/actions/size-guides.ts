"use server"

import { revalidatePath } from "next/cache"
import { isMissingTable, sizeGuideInputSchema, TABLES } from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { getAdmin } from "@/lib/supabase-server"

const MIGRATION_HINT = "Size guides need the new database table. Run apps/catalogue-admin/supabase/migrations/20261121000000_size_guides_seo.sql in the Supabase SQL editor."

export async function saveSizeGuide(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = sizeGuideInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  const guide = parsed.data
  const sizes = guide.rows.map((r) => r.size.toUpperCase())
  if (new Set(sizes).size !== sizes.length) {
    return { ok: false, error: "Each size can appear only once in a guide" }
  }

  try {
    const { client } = getAdmin()
    const values = {
      name: guide.name,
      unit: guide.unit,
      note: guide.note,
      columns: guide.columns,
      // Every row gets exactly one value per column.
      rows: guide.rows.map((r) => ({ size: r.size, values: guide.columns.map((_, i) => r.values[i] ?? "") })),
    }

    let guideId = id
    if (guideId) {
      const { error } = await client.from(TABLES.sizeGuides).update(values).eq("id", guideId)
      if (error) throw error
      // Products using this guide show it on the site, so mark them changed.
      await client.from(TABLES.products).update({ updated_at: new Date().toISOString() }).eq("size_guide_id", guideId)
    } else {
      const { count } = await client.from(TABLES.sizeGuides).select("id", { count: "exact", head: true })
      const { data, error } = await client
        .from(TABLES.sizeGuides)
        .insert({ ...values, sort_order: count ?? 0 })
        .select("id")
        .single()
      if (error) throw error
      guideId = data.id as string
    }

    revalidatePath("/", "layout")
    return { ok: true, data: { id: guideId as string }, message: "Size guide saved" }
  } catch (err) {
    return fail(isMissingTable(err as { message: string }) ? new Error(MIGRATION_HINT) : toError(err))
  }
}

export async function deleteSizeGuide(id: string): Promise<ActionResult> {
  try {
    z.string().uuid().parse(id)
    const { client } = getAdmin()
    // Products that used it fall back to their own chart (the column is set null).
    const { error } = await client.from(TABLES.sizeGuides).delete().eq("id", id)
    if (error) throw error
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(toError(err))
  }
}

function toError(err: unknown): Error {
  if (err instanceof Error) return err
  if (err && typeof err === "object" && "message" in err) return new Error(String((err as { message: unknown }).message))
  return new Error(String(err))
}

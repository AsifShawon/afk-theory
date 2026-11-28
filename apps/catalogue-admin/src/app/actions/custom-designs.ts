"use server"

import { revalidatePath } from "next/cache"
import { customDesignInputSchema, TABLES, type CustomDesignRow } from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { convertAndUpload, MAX_UPLOAD_BYTES, removeImageObjects } from "@/lib/images"
import { markSiteChanged } from "@/lib/site-changes"
import { CUSTOM_DESIGNS_MIGRATION_HINT, customDesignsReady } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

const uuid = z.string().uuid()

function friendlyError(err: unknown): Error {
  return err instanceof Error ? err : new Error(String(err))
}

async function ensureReady() {
  const { client } = getAdmin()
  if (!(await customDesignsReady(client))) {
    throw new Error(CUSTOM_DESIGNS_MIGRATION_HINT)
  }
  return client
}

/** Creates or updates a custom design gallery example. */
export async function saveCustomDesign(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = customDesignInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const client = await ensureReady()
    const d = parsed.data

    let existing: CustomDesignRow | null = null
    if (id) {
      uuid.parse(id)
      const { data, error } = await client.from(TABLES.customDesigns).select("*").eq("id", id).single()
      if (error) throw new Error(error.message)
      existing = data as CustomDesignRow
    }

    if (d.status === "published") {
      if (!existing?.image_path || !existing.image_widths?.length) {
        return { ok: false, error: "Upload a main garment photo before publishing." }
      }
      if (!d.imageAlt.trim()) {
        return {
          ok: false,
          error: "Add descriptive alt text for the main garment photo before publishing.",
          fieldErrors: { imageAlt: "Descriptive alt text is required to publish" },
        }
      }
    }

    const values = {
      title: d.title,
      garment_type: d.garmentType,
      status: d.status,
      is_featured: d.isFeatured,
      image_alt: d.imageAlt,
      detail_image_alt: d.detailImageAlt,
    }

    let designId = id
    if (id) {
      const { error } = await client.from(TABLES.customDesigns).update(values).eq("id", id)
      if (error) throw new Error(error.message)
    } else {
      const { count } = await client.from(TABLES.customDesigns).select("id", { count: "exact", head: true })
      const { data, error } = await client
        .from(TABLES.customDesigns)
        .insert({ ...values, sort_order: count ?? 0 })
        .select("id")
        .single()
      if (error) throw new Error(error.message)
      designId = data.id as string
    }

    if (d.isFeatured && designId) {
      await client.from(TABLES.customDesigns).update({ is_featured: false }).neq("id", designId).eq("is_featured", true)
    }

    revalidatePath("/custom-designs")
    revalidatePath("/", "layout")
    return { ok: true, data: { id: designId as string }, message: "Custom example saved" }
  } catch (err) {
    return fail(friendlyError(err))
  }
}

export async function deleteCustomDesign(id: string): Promise<ActionResult> {
  try {
    const client = await ensureReady()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.customDesigns).select("*").eq("id", id).maybeSingle()
    if (readError) throw new Error(readError.message)
    const row = data as CustomDesignRow | null
    const { error } = await client.from(TABLES.customDesigns).delete().eq("id", id)
    if (error) throw new Error(error.message)

    const toRemove = [
      ...(row?.image_path && row.image_widths?.length ? [{ path: row.image_path, widths: row.image_widths }] : []),
      ...(row?.detail_image_path && row.detail_image_widths?.length ? [{ path: row.detail_image_path, widths: row.detail_image_widths }] : []),
    ]
    if (toRemove.length > 0) {
      await removeImageObjects(client, toRemove)
    }

    await markSiteChanged(client)
    revalidatePath("/custom-designs")
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendlyError(err))
  }
}

export async function reorderCustomDesigns(ids: string[]): Promise<ActionResult> {
  try {
    const client = await ensureReady()
    const parsed = z.array(uuid).max(200).parse(ids)
    for (const [index, itemId] of parsed.entries()) {
      const { error } = await client.from(TABLES.customDesigns).update({ sort_order: index }).eq("id", itemId)
      if (error) throw new Error(error.message)
    }
    await markSiteChanged(client)
    revalidatePath("/custom-designs")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendlyError(err))
  }
}

export async function uploadCustomDesignImage(id: string, slot: "main" | "detail", formData: FormData): Promise<ActionResult> {
  try {
    const client = await ensureReady()
    uuid.parse(id)
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image" }
    if (!file.type.startsWith("image/")) return { ok: false, error: `${file.name} is not an image` }
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is larger than 15 MB` }

    const { data, error: readError } = await client.from(TABLES.customDesigns).select("*").eq("id", id).single()
    if (readError) throw new Error(readError.message)
    const previous = data as CustomDesignRow

    const stored = await convertAndUpload(client, Buffer.from(await file.arrayBuffer()), `custom-designs/${id}`)
    const patch =
      slot === "main"
        ? { image_path: stored.path, image_widths: stored.widths, image_width: stored.width, image_height: stored.height }
        : { detail_image_path: stored.path, detail_image_widths: stored.widths, detail_image_width: stored.width, detail_image_height: stored.height }

    const { error } = await client.from(TABLES.customDesigns).update(patch).eq("id", id)
    if (error) {
      await removeImageObjects(client, [stored])
      throw new Error(error.message)
    }

    const oldPath = slot === "main" ? previous.image_path : previous.detail_image_path
    const oldWidths = slot === "main" ? previous.image_widths : previous.detail_image_widths
    if (oldPath && oldWidths?.length) {
      await removeImageObjects(client, [{ path: oldPath, widths: oldWidths }])
    }

    revalidatePath("/custom-designs")
    revalidatePath("/", "layout")
    return { ok: true, data: undefined, message: slot === "main" ? "Main garment photo uploaded" : "Detail photo uploaded" }
  } catch (err) {
    return fail(friendlyError(err))
  }
}

export async function removeCustomDesignImage(id: string, slot: "main" | "detail"): Promise<ActionResult> {
  try {
    const client = await ensureReady()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.customDesigns).select("*").eq("id", id).single()
    if (readError) throw new Error(readError.message)
    const row = data as CustomDesignRow

    const patch =
      slot === "main"
        ? {
            image_path: null,
            image_widths: [],
            image_width: null,
            image_height: null,
            // Never leave a published gallery item without a main garment photo.
            status: "draft" as const,
          }
        : { detail_image_path: null, detail_image_widths: [], detail_image_width: null, detail_image_height: null }

    const { error } = await client.from(TABLES.customDesigns).update(patch).eq("id", id)
    if (error) throw new Error(error.message)

    const oldPath = slot === "main" ? row.image_path : row.detail_image_path
    const oldWidths = slot === "main" ? row.image_widths : row.detail_image_widths
    if (oldPath && oldWidths?.length) {
      await removeImageObjects(client, [{ path: oldPath, widths: oldWidths }])
    }

    revalidatePath("/custom-designs")
    revalidatePath("/", "layout")
    return {
      ok: true,
      data: undefined,
      message: slot === "main" && row.status === "published" ? "Main photo removed (reverted to draft)" : "Photo removed",
    }
  } catch (err) {
    return fail(friendlyError(err))
  }
}

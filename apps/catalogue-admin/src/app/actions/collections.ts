"use server"

import { revalidatePath } from "next/cache"
import { collectionInputSchema, TABLES, type CollectionRow } from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { convertAndUpload, MAX_UPLOAD_BYTES, removeImageObjects } from "@/lib/images"
import { markSiteChanged } from "@/lib/site-changes"
import { storeError } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

const uuid = z.string().uuid()

function friendly(err: unknown): Error {
  const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err)
  if (message.includes("collections_slug_key")) return new Error("Another collection already uses this slug")
  return storeError(err)
}

/** Creates or updates a collection and replaces its product list, in order. */
export async function saveCollection(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = collectionInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const { client } = getAdmin()
    const c = parsed.data
    const values = {
      name: c.name,
      slug: c.slug,
      description: c.description,
      show_on_home: c.showOnHome,
      seo_title: c.seoTitle,
      seo_description: c.seoDescription,
    }

    let collectionId = id
    if (id) {
      const { error } = await client.from(TABLES.collections).update(values).eq("id", id)
      if (error) throw error
    } else {
      const { count } = await client.from(TABLES.collections).select("id", { count: "exact", head: true })
      const { data, error } = await client
        .from(TABLES.collections)
        .insert({ ...values, sort_order: count ?? 0 })
        .select("id")
        .single()
      if (error) throw error
      collectionId = data.id as string
    }

    const { error: deleteError } = await client.from(TABLES.productCollections).delete().eq("collection_id", collectionId)
    if (deleteError) throw deleteError
    if (c.productIds.length > 0) {
      const { error } = await client
        .from(TABLES.productCollections)
        .insert(c.productIds.map((productId, index) => ({ product_id: productId, collection_id: collectionId, sort_order: index })))
      if (error) throw error
    }

    revalidatePath("/", "layout")
    return { ok: true, data: { id: collectionId as string }, message: "Collection saved" }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function deleteCollection(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.collections).select("*").eq("id", id).maybeSingle()
    if (readError) throw readError
    const row = data as CollectionRow | null
    const { error } = await client.from(TABLES.collections).delete().eq("id", id)
    if (error) throw error
    if (row?.image_path && row.image_widths.length) {
      await removeImageObjects(client, [{ path: row.image_path, widths: row.image_widths }])
    }
    await markSiteChanged(client)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function reorderCollections(ids: string[]): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const parsed = z.array(uuid).max(200).parse(ids)
    for (const [index, id] of parsed.entries()) {
      const { error } = await client.from(TABLES.collections).update({ sort_order: index }).eq("id", id)
      if (error) throw error
    }
    revalidatePath("/collections")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function uploadCollectionImage(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image" }
    if (!file.type.startsWith("image/")) return { ok: false, error: `${file.name} is not an image` }
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is larger than 15 MB` }

    const { data, error: readError } = await client.from(TABLES.collections).select("*").eq("id", id).single()
    if (readError) throw readError
    const previous = data as CollectionRow

    const stored = await convertAndUpload(client, Buffer.from(await file.arrayBuffer()), `collections/${id}`)
    const { error } = await client
      .from(TABLES.collections)
      .update({ image_path: stored.path, image_widths: stored.widths, image_width: stored.width, image_height: stored.height })
      .eq("id", id)
    if (error) {
      await removeImageObjects(client, [stored])
      throw error
    }
    if (previous.image_path && previous.image_widths.length) {
      await removeImageObjects(client, [{ path: previous.image_path, widths: previous.image_widths }])
    }
    revalidatePath("/collections")
    return { ok: true, data: undefined, message: "Banner uploaded" }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function removeCollectionImage(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.collections).select("*").eq("id", id).single()
    if (readError) throw readError
    const row = data as CollectionRow
    const { error } = await client
      .from(TABLES.collections)
      .update({ image_path: null, image_widths: [], image_width: null, image_height: null })
      .eq("id", id)
    if (error) throw error
    if (row.image_path && row.image_widths.length) {
      await removeImageObjects(client, [{ path: row.image_path, widths: row.image_widths }])
    }
    revalidatePath("/collections")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

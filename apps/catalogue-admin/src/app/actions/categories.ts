"use server"

import { revalidatePath } from "next/cache"
import { categoryInputSchema, menuProductsSchema, resolveParents, TABLES, type CategoryInput, type CategoryRow } from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { convertAndUpload, MAX_UPLOAD_BYTES, removeImageObjects } from "@/lib/images"
import { markSiteChanged } from "@/lib/site-changes"
import { storeError, storeStructureReady } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

const uuid = z.string().uuid()

function toRow(input: CategoryInput) {
  const row: Record<string, unknown> = { name: input.name, slug: input.slug }
  // The store structure fields are sent only when the form has them.
  if (input.parentId !== undefined) row.parent_id = input.parentId
  if (input.description !== undefined) row.description = input.description
  if (input.showInMenu !== undefined) row.show_in_menu = input.showInMenu
  if (input.seoTitle !== undefined) row.seo_title = input.seoTitle
  if (input.seoDescription !== undefined) row.seo_description = input.seoDescription
  return row
}

function friendly(err: unknown): Error {
  const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : String(err)
  if (message.includes("categories_slug_key")) return new Error("Another category already uses this slug")
  if (message.includes("categories_parent_not_self")) return new Error("A category cannot be inside itself")
  return storeError(err)
}

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = categoryInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const { client } = getAdmin()
    const data = parsed.data

    if (id && data.parentId) {
      // Moving a category under itself or one of its subcategories would make a loop.
      const { data: rows, error } = await client.from(TABLES.categories).select("*")
      if (error) throw error
      const parentOf = resolveParents(rows as CategoryRow[])
      let current: string | null | undefined = data.parentId
      let loops = false
      for (let steps = 0; current && steps <= parentOf.size; steps++) {
        if (current === id) {
          loops = true
          break
        }
        current = parentOf.get(current)
      }
      if (loops) {
        return { ok: false, error: "A category cannot be inside one of its own subcategories", fieldErrors: { parentId: "Pick a different parent" } }
      }
    }

    let categoryId = id
    if (id) {
      const { error } = await client.from(TABLES.categories).update(toRow(data)).eq("id", id)
      if (error) throw error
    } else {
      const { count } = await client.from(TABLES.categories).select("id", { count: "exact", head: true })
      const { data: created, error } = await client
        .from(TABLES.categories)
        .insert({ ...toRow(data), sort_order: count ?? 0 })
        .select("id")
        .single()
      if (error) throw error
      categoryId = created.id as string
    }
    revalidatePath("/", "layout")
    return { ok: true, data: { id: categoryId as string }, message: "Category saved" }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.categories).select("*").eq("id", id).maybeSingle()
    if (readError) throw readError
    const row = data as CategoryRow | null
    // Products keep existing without a category; subcategories move to the top level.
    const { error } = await client.from(TABLES.categories).delete().eq("id", id)
    if (error) throw error
    if (row?.image_path && row.image_widths?.length) {
      await removeImageObjects(client, [{ path: row.image_path, widths: row.image_widths }])
    }
    await markSiteChanged(client)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Saves the order of categories that share a parent. */
export async function reorderCategories(ids: string[]): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const parsed = z.array(uuid).max(200).parse(ids)
    for (const [index, id] of parsed.entries()) {
      const { error } = await client.from(TABLES.categories).update({ sort_order: index }).eq("id", id)
      if (error) throw error
    }
    await markSiteChanged(client)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function uploadCategoryImage(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    if (!(await storeStructureReady(client))) throw storeError({ message: "Could not find the table", code: "PGRST205" })
    const file = formData.get("file")
    if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image" }
    if (!file.type.startsWith("image/")) return { ok: false, error: `${file.name} is not an image` }
    if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: `${file.name} is larger than 15 MB` }

    const { data, error: readError } = await client.from(TABLES.categories).select("*").eq("id", id).single()
    if (readError) throw readError
    const previous = data as CategoryRow

    const stored = await convertAndUpload(client, Buffer.from(await file.arrayBuffer()), `categories/${id}`)
    const { error } = await client
      .from(TABLES.categories)
      .update({ image_path: stored.path, image_widths: stored.widths, image_width: stored.width, image_height: stored.height })
      .eq("id", id)
    if (error) {
      await removeImageObjects(client, [stored])
      throw error
    }
    // New file names every upload, so the old files can go.
    if (previous.image_path && previous.image_widths?.length) {
      await removeImageObjects(client, [{ path: previous.image_path, widths: previous.image_widths }])
    }
    revalidatePath("/categories")
    return { ok: true, data: undefined, message: "Image uploaded" }
  } catch (err) {
    return fail(friendly(err))
  }
}

export async function removeCategoryImage(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    uuid.parse(id)
    const { data, error: readError } = await client.from(TABLES.categories).select("*").eq("id", id).single()
    if (readError) throw readError
    const row = data as CategoryRow
    const { error } = await client
      .from(TABLES.categories)
      .update({ image_path: null, image_widths: [], image_width: null, image_height: null })
      .eq("id", id)
    if (error) throw error
    if (row.image_path && row.image_widths?.length) {
      await removeImageObjects(client, [{ path: row.image_path, widths: row.image_widths }])
    }
    revalidatePath("/categories")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(friendly(err))
  }
}

/** Replaces a category's menu picks (at most 2, in order). */
export async function saveMenuProducts(categoryId: string, productIds: unknown): Promise<ActionResult> {
  const parsed = menuProductsSchema.safeParse(productIds)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid menu products" }
  }
  try {
    const { client } = getAdmin()
    uuid.parse(categoryId)
    const { error: deleteError } = await client.from(TABLES.menuProducts).delete().eq("category_id", categoryId)
    if (deleteError) throw deleteError
    if (parsed.data.length > 0) {
      const { error } = await client
        .from(TABLES.menuProducts)
        .insert(parsed.data.map((productId, index) => ({ category_id: categoryId, product_id: productId, sort_order: index })))
      if (error) throw error
    }
    await markSiteChanged(client)
    revalidatePath("/categories")
    return { ok: true, data: undefined, message: "Menu products saved" }
  } catch (err) {
    return fail(friendly(err))
  }
}

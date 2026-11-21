"use server"

import { revalidatePath } from "next/cache"
import {
  colorInputSchema,
  designInputSchema,
  productInputSchema,
  TABLES,
  type ColorInput,
  type DesignInput,
  type ProductImageRow,
  type ProductInput,
} from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { removeImageObjects } from "@/lib/images"
import { storeError, storeStructureReady } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

function toRow(input: ProductInput, storeReady: boolean) {
  return {
    // Sent only once migration 20261122000000 has added the columns.
    ...(storeReady ? { badge: input.badge, design_group: input.designGroup.trim() } : {}),
    name: input.name,
    slug: input.slug,
    tagline: input.tagline,
    description: input.description,
    price_bdt: input.priceBdt,
    compare_at_bdt: input.compareAtBdt,
    category_id: input.categoryId,
    status: input.status,
    is_featured: input.isFeatured,
    sizes: input.sizes,
    sold_out_sizes: input.soldOutSizes.filter((s) => input.sizes.includes(s)),
    details: Object.fromEntries(Object.entries(input.details).filter(([, v]) => v && v.trim())),
    // A shared guide replaces the product's own chart, so clear it to avoid stale data.
    size_chart: input.sizeGuideId ? { columns: [], rows: [] } : input.sizeChart,
    size_guide_id: input.sizeGuideId,
    seo_title: input.seoTitle,
    seo_description: input.seoDescription,
  }
}

/**
 * Creates or updates a product and replaces its colors. Designs and
 * collections are saved too once the store structure migration has run;
 * pass `designs` as null to leave them unchanged.
 */
export async function saveProduct(
  id: string | null,
  product: unknown,
  colors: unknown,
  designs: unknown = null
): Promise<ActionResult<{ id: string }>> {
  const parsed = productInputSchema.safeParse(product)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  const parsedColors = z.array(colorInputSchema).max(12).safeParse(colors)
  if (!parsedColors.success) {
    return zodFail(parsedColors.error)
  }
  const parsedDesigns = z.array(designInputSchema).max(12).nullable().safeParse(designs)
  if (!parsedDesigns.success) {
    return zodFail(parsedDesigns.error, "designs")
  }

  try {
    const { client } = getAdmin()
    const storeReady = await storeStructureReady(client)
    const row = toRow(parsed.data, storeReady)
    let productId = id

    if (productId) {
      const { error } = await client.from(TABLES.products).update(row).eq("id", productId)
      if (error) throw new Error(friendlyDbError(error.message))
    } else {
      const { data: last } = await client
        .from(TABLES.products)
        .select("sort_order")
        .order("sort_order", { ascending: false })
        .limit(1)
        .maybeSingle()
      const { data, error } = await client
        .from(TABLES.products)
        .insert({ ...row, sort_order: (last?.sort_order ?? -1) + 1 })
        .select("id")
        .single()
      if (error) throw new Error(friendlyDbError(error.message))
      productId = data.id as string
    }

    await syncColors(productId as string, parsedColors.data)
    if (storeReady) {
      if (parsedDesigns.data) await syncDesigns(productId as string, parsedDesigns.data)
      await syncCollections(productId as string, parsed.data.collectionIds)
    }
    revalidatePath("/", "layout")
    return { ok: true, data: { id: productId as string }, message: "Saved" }
  } catch (err) {
    return fail(err)
  }
}

async function syncColors(productId: string, colors: ColorInput[]) {
  const { client } = getAdmin()
  const keepIds = colors.map((c) => c.id).filter((v): v is string => Boolean(v))

  let removeQuery = client.from(TABLES.colors).delete().eq("product_id", productId)
  if (keepIds.length > 0) {
    removeQuery = removeQuery.not("id", "in", `(${keepIds.join(",")})`)
  }
  const { error: removeError } = await removeQuery
  if (removeError) throw new Error(`Could not update colors: ${removeError.message}`)

  for (const [index, color] of colors.entries()) {
    const values = {
      product_id: productId,
      name: color.name,
      hex: color.hex.toUpperCase(),
      in_stock: color.inStock,
      sort_order: index,
    }
    const { error } = color.id
      ? await client.from(TABLES.colors).update(values).eq("id", color.id).eq("product_id", productId)
      : await client.from(TABLES.colors).insert(values)
    if (error) throw new Error(`Could not save color ${color.name}: ${error.message}`)
  }
}

async function syncDesigns(productId: string, designs: DesignInput[]) {
  const { client } = getAdmin()
  const keepIds = designs.map((d) => d.id).filter((v): v is string => Boolean(v))

  // Photos of a removed design become shared photos (design_id is set null).
  let removeQuery = client.from(TABLES.designs).delete().eq("product_id", productId)
  if (keepIds.length > 0) {
    removeQuery = removeQuery.not("id", "in", `(${keepIds.join(",")})`)
  }
  const { error: removeError } = await removeQuery
  if (removeError) throw storeError(removeError)

  for (const [index, design] of designs.entries()) {
    const values = { product_id: productId, name: design.name, in_stock: design.inStock, sort_order: index }
    const { error } = design.id
      ? await client.from(TABLES.designs).update(values).eq("id", design.id).eq("product_id", productId)
      : await client.from(TABLES.designs).insert(values)
    if (error) throw new Error(`Could not save design ${design.name}: ${error.message}`)
  }
}

/** Keeps the product's place in collections it stays in; new ones add it at the end. */
async function syncCollections(productId: string, collectionIds: string[]) {
  const { client } = getAdmin()
  const { data, error } = await client.from(TABLES.productCollections).select("collection_id").eq("product_id", productId)
  if (error) throw storeError(error)
  const current = new Set((data ?? []).map((r) => r.collection_id as string))
  const wanted = new Set(collectionIds)

  const removed = [...current].filter((cid) => !wanted.has(cid))
  if (removed.length > 0) {
    const { error: removeError } = await client
      .from(TABLES.productCollections)
      .delete()
      .eq("product_id", productId)
      .in("collection_id", removed)
    if (removeError) throw storeError(removeError)
  }

  for (const collectionId of [...wanted].filter((cid) => !current.has(cid))) {
    const { data: last } = await client
      .from(TABLES.productCollections)
      .select("sort_order")
      .eq("collection_id", collectionId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    const { error: insertError } = await client
      .from(TABLES.productCollections)
      .insert({ product_id: productId, collection_id: collectionId, sort_order: (last?.sort_order ?? -1) + 1 })
    if (insertError) throw new Error(`Could not add the product to a collection: ${insertError.message}`)
  }
}

function friendlyDbError(message: string): string {
  if (message.includes("products_slug_key")) {
    return "Another product already uses this slug"
  }
  if (/size_guide_id|seo_title|seo_description/.test(message)) {
    return "The database needs one more step for size guides and SEO. In Supabase open the SQL editor and run apps/catalogue-admin/supabase/migrations/20261121000000_size_guides_seo.sql, then save again."
  }
  return message
}

export async function setProductFlags(
  id: string,
  flags: { status?: "draft" | "published"; isFeatured?: boolean }
): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const update: Record<string, unknown> = {}
    if (flags.status) update.status = flags.status
    if (typeof flags.isFeatured === "boolean") update.is_featured = flags.isFeatured
    const { error } = await client.from(TABLES.products).update(update).eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

export async function reorderProducts(ids: string[]): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const parsed = z.array(z.string().uuid()).parse(ids)
    for (const [index, id] of parsed.entries()) {
      const { error } = await client.from(TABLES.products).update({ sort_order: index }).eq("id", id)
      if (error) throw new Error(error.message)
    }
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const { data: images, error } = await client
      .from(TABLES.images)
      .select("path, widths")
      .eq("product_id", id)
    if (error) throw new Error(error.message)
    await removeImageObjects(client, (images ?? []) as Pick<ProductImageRow, "path" | "widths">[])
    const { error: deleteError } = await client.from(TABLES.products).delete().eq("id", id)
    if (deleteError) throw new Error(deleteError.message)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

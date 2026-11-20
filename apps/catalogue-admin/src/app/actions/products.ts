"use server"

import { revalidatePath } from "next/cache"
import {
  colorInputSchema,
  productInputSchema,
  TABLES,
  type ColorInput,
  type ProductImageRow,
  type ProductInput,
} from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { removeImageObjects } from "@/lib/images"
import { getAdmin } from "@/lib/supabase-server"

function toRow(input: ProductInput) {
  return {
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

/** Creates or updates a product and replaces its colors. */
export async function saveProduct(
  id: string | null,
  product: unknown,
  colors: unknown
): Promise<ActionResult<{ id: string }>> {
  const parsed = productInputSchema.safeParse(product)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  const parsedColors = z.array(colorInputSchema).max(12).safeParse(colors)
  if (!parsedColors.success) {
    return zodFail(parsedColors.error)
  }

  try {
    const { client } = getAdmin()
    const row = toRow(parsed.data)
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

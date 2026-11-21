"use server"

import { revalidatePath } from "next/cache"
import { IMAGE_ROLES, imageUpdateSchema, TABLES, type ImageRole, type ProductImageRow } from "@dtc/catalogue-core"
import { z } from "zod"
import { fail, type ActionResult } from "@/lib/action-result"
import { MAX_UPLOAD_BYTES, processAndUploadImage, removeImageObjects } from "@/lib/images"
import { storeStructureReady } from "@/lib/store-structure"
import { getAdmin } from "@/lib/supabase-server"

/** Marks the product as changed so the admin shows "unpublished changes". */
async function touchProduct(productId: string) {
  const { client } = getAdmin()
  await client.from(TABLES.products).update({ updated_at: new Date().toISOString() }).eq("id", productId)
}

export async function uploadImages(
  productId: string,
  formData: FormData
): Promise<ActionResult<{ uploaded: number; failed: string[] }>> {
  try {
    const { client } = getAdmin()
    z.string().uuid().parse(productId)
    const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0)
    if (files.length === 0) {
      return { ok: false, error: "Choose at least one image" }
    }

    const roleValue = String(formData.get("role") ?? "detail")
    const role: ImageRole = (IMAGE_ROLES as readonly string[]).includes(roleValue) ? (roleValue as ImageRole) : "detail"
    const colorValue = String(formData.get("colorId") ?? "")
    const colorId = z.string().uuid().safeParse(colorValue).success ? colorValue : null
    const designValue = String(formData.get("designId") ?? "")
    const designId = z.string().uuid().safeParse(designValue).success && (await storeStructureReady(client)) ? designValue : null

    const { data: product, error: productError } = await client
      .from(TABLES.products)
      .select("name")
      .eq("id", productId)
      .single()
    if (productError) throw new Error(productError.message)

    const { data: last } = await client
      .from(TABLES.images)
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()
    let sortOrder = (last?.sort_order ?? -1) + 1

    let uploaded = 0
    const failed: string[] = []
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        failed.push(`${file.name}: not an image`)
        continue
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        failed.push(`${file.name}: larger than 15 MB`)
        continue
      }
      try {
        await processAndUploadImage(client, Buffer.from(await file.arrayBuffer()), {
          productId,
          colorId,
          designId,
          role,
          alt: `${product.name}`,
          sortOrder: sortOrder++,
        })
        uploaded++
      } catch (err) {
        failed.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    await touchProduct(productId)
    revalidatePath(`/products/${productId}`)
    return { ok: true, data: { uploaded, failed } }
  } catch (err) {
    return fail(err)
  }
}

export async function updateImage(input: unknown): Promise<ActionResult> {
  const parsed = imageUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid image details" }
  }
  try {
    const { client } = getAdmin()
    const { data, error } = await client
      .from(TABLES.images)
      .update({
        color_id: parsed.data.colorId,
        // Left out until the store structure migration adds the column.
        ...(parsed.data.designId !== undefined ? { design_id: parsed.data.designId } : {}),
        role: parsed.data.role,
        alt: parsed.data.alt,
      })
      .eq("id", parsed.data.id)
      .select("product_id")
      .single()
    if (error) throw new Error(error.message)
    await touchProduct(data.product_id as string)
    revalidatePath(`/products/${data.product_id}`)
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

export async function reorderImages(productId: string, ids: string[]): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const parsed = z.array(z.string().uuid()).parse(ids)
    for (const [index, id] of parsed.entries()) {
      const { error } = await client
        .from(TABLES.images)
        .update({ sort_order: index })
        .eq("id", id)
        .eq("product_id", productId)
      if (error) throw new Error(error.message)
    }
    await touchProduct(productId)
    revalidatePath(`/products/${productId}`)
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

export async function deleteImage(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    const { data, error } = await client.from(TABLES.images).select("*").eq("id", id).single()
    if (error) throw new Error(error.message)
    const image = data as ProductImageRow
    await removeImageObjects(client, [image])
    const { error: deleteError } = await client.from(TABLES.images).delete().eq("id", id)
    if (deleteError) throw new Error(deleteError.message)
    await touchProduct(image.product_id)
    revalidatePath(`/products/${image.product_id}`)
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

import { randomUUID } from "crypto"
import sharp from "sharp"
import type { SupabaseClient } from "@supabase/supabase-js"
import {
  IMAGE_WIDTHS,
  imageObjectKey,
  STORAGE_BUCKET,
  TABLES,
  type ImageRole,
  type ProductImageRow,
} from "@dtc/catalogue-core"

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024
const WEBP_QUALITY = 82

/**
 * Picks the widths to generate. Never upscales. Keeps the original width as
 * an extra step when it is clearly larger than the biggest standard width.
 */
export function pickWidths(originalWidth: number): number[] {
  const widths: number[] = IMAGE_WIDTHS.filter((w) => w <= originalWidth)
  const largest = widths[widths.length - 1] ?? 0
  if (widths.length === 0 || (originalWidth > largest * 1.15 && largest < IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1])) {
    widths.push(Math.min(originalWidth, IMAGE_WIDTHS[IMAGE_WIDTHS.length - 1]))
  }
  return widths
}

export interface UploadImageOptions {
  productId: string
  colorId: string | null
  /** Only set once the store structure migration has run. */
  designId?: string | null
  role: ImageRole
  alt: string
  sortOrder: number
}

/** One image stored in every generated width. */
export interface StoredWebp {
  /** Storage path without the width suffix. */
  path: string
  widths: number[]
  /** Size of the largest width. */
  width: number
  height: number
}

/**
 * Converts one image to webp at several widths and uploads every width under
 * `<prefix>/<new id>`. Returns the stored image; on failure nothing is left behind.
 */
export async function convertAndUpload(client: SupabaseClient, input: Buffer, prefix: string): Promise<StoredWebp & { id: string }> {
  // rotate() applies EXIF orientation from phone photos before resizing.
  const base = sharp(input, { failOn: "error" }).rotate()
  const meta = await base.metadata()
  const orientedWidth = meta.autoOrient?.width ?? meta.width
  const orientedHeight = meta.autoOrient?.height ?? meta.height
  if (!orientedWidth || !orientedHeight) {
    throw new Error("Could not read the image size")
  }

  const id = randomUUID()
  const path = `${prefix}/${id}`
  const widths = pickWidths(orientedWidth)
  const uploaded: string[] = []

  try {
    for (const width of widths) {
      const data = await base.clone().resize({ width, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toBuffer()
      const key = imageObjectKey(path, width)
      const { error } = await client.storage.from(STORAGE_BUCKET).upload(key, data, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      })
      if (error) {
        throw new Error(`Upload failed: ${error.message}`)
      }
      uploaded.push(key)
    }
  } catch (err) {
    if (uploaded.length > 0) {
      await client.storage.from(STORAGE_BUCKET).remove(uploaded)
    }
    throw err
  }

  const largest = widths[widths.length - 1]
  return { id, path, widths, width: largest, height: Math.round((largest * orientedHeight) / orientedWidth) }
}

/**
 * Converts one product photo to webp at several widths, uploads every width
 * to Supabase Storage and records the image row.
 */
export async function processAndUploadImage(
  client: SupabaseClient,
  input: Buffer,
  options: UploadImageOptions
): Promise<ProductImageRow> {
  const stored = await convertAndUpload(client, input, `products/${options.productId}`)
  const row: ProductImageRow = {
    id: stored.id,
    product_id: options.productId,
    color_id: options.colorId,
    // Sent only when set, so uploads keep working before the design column exists.
    ...(options.designId ? { design_id: options.designId } : {}),
    path: stored.path,
    widths: stored.widths,
    width: stored.width,
    height: stored.height,
    alt: options.alt,
    role: options.role,
    sort_order: options.sortOrder,
  }
  const { error } = await client.from(TABLES.images).insert(row)
  if (error) {
    await removeImageObjects(client, [stored])
    throw new Error(`Could not save the image: ${error.message}`)
  }
  return row
}

export async function removeImageObjects(client: SupabaseClient, images: Pick<ProductImageRow, "path" | "widths">[]) {
  const keys = images.flatMap((img) => img.widths.map((w) => imageObjectKey(img.path, w)))
  if (keys.length === 0) {
    return
  }
  const { error } = await client.storage.from(STORAGE_BUCKET).remove(keys)
  if (error) {
    throw new Error(`Could not delete image files: ${error.message}`)
  }
}

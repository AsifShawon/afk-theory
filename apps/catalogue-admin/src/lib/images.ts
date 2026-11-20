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
  role: ImageRole
  alt: string
  sortOrder: number
}

/**
 * Converts one image to webp at several widths, uploads every width to
 * Supabase Storage and records the image row.
 */
export async function processAndUploadImage(
  client: SupabaseClient,
  input: Buffer,
  options: UploadImageOptions
): Promise<ProductImageRow> {
  // rotate() applies EXIF orientation from phone photos before resizing.
  const base = sharp(input, { failOn: "error" }).rotate()
  const meta = await base.metadata()
  const orientedWidth = meta.autoOrient?.width ?? meta.width
  const orientedHeight = meta.autoOrient?.height ?? meta.height
  if (!orientedWidth || !orientedHeight) {
    throw new Error("Could not read the image size")
  }

  const id = randomUUID()
  const path = `products/${options.productId}/${id}`
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

    const largest = widths[widths.length - 1]
    const row: ProductImageRow = {
      id,
      product_id: options.productId,
      color_id: options.colorId,
      path,
      widths,
      width: largest,
      height: Math.round((largest * orientedHeight) / orientedWidth),
      alt: options.alt,
      role: options.role,
      sort_order: options.sortOrder,
    }
    const { error } = await client.from(TABLES.images).insert(row)
    if (error) {
      throw new Error(`Could not save the image: ${error.message}`)
    }
    return row
  } catch (err) {
    if (uploaded.length > 0) {
      await client.storage.from(STORAGE_BUCKET).remove(uploaded)
    }
    throw err
  }
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

import path from "path"
import { MedusaError } from "@medusajs/framework/utils"
import {
  HEIF_UNSUPPORTED_MESSAGE,
  isHeifBuffer,
  optimizeImageBuffer,
  validateImageBuffer,
} from "./image-optimization"

/**
 * Decodes file content handed to a file provider (base64 string, binary string
 * or Buffer) into a Buffer.
 */
export function decodeFileContent(
  content: string | Buffer,
  mimeType?: string
): Buffer {
  if (Buffer.isBuffer(content)) {
    return content
  }
  if (typeof content !== "string") {
    return Buffer.from(content as unknown as Uint8Array)
  }

  // 1. Check if the string directly decodes into a recognized image format
  const decodedBase64 = Buffer.from(content, "base64")
  const validation = validateImageBuffer(decodedBase64)
  if (validation.valid) {
    return decodedBase64
  }

  // 2. Exact base64 match check
  if (decodedBase64.toString("base64") === content) {
    return decodedBase64
  }

  const isTextContent =
    mimeType?.startsWith("text/") ||
    mimeType?.includes("csv") ||
    mimeType?.includes("json") ||
    mimeType?.includes("xml")
  return isTextContent
    ? Buffer.from(content, "utf8")
    : Buffer.from(content, "binary")
}

export type ImageConversionOptions = {
  maxWidth?: number
  quality?: number
}

export type ConvertedUpload = {
  content: Buffer
  filename: string
  mimeType: string
  /** True when the upload was an image and was re-encoded as WebP. */
  converted: boolean
}

/**
 * Replaces the extension of a file name (keeping any directory part) with .webp.
 */
export function toWebpFilename(filename: string): string {
  const normalized = filename.replace(/\\/g, "/")
  const parsed = path.posix.parse(normalized)
  return path.posix.join(parsed.dir, `${parsed.name}.webp`)
}

function slugifySegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036F]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Makes an uploaded file name safe and readable in a URL: lower case, accents
 * removed, spaces and punctuation turned into single hyphens, and a lower-case
 * extension. Directory parts are cleaned the same way. Search engines read image
 * file names, so "Drop Shoulder Tee (Black).PNG" becomes "drop-shoulder-tee-black.png".
 */
export function toSeoFilename(filename: string): string {
  const normalized = filename.replace(/\\/g, "/")
  const parsed = path.posix.parse(normalized)

  const name = slugifySegment(parsed.name).slice(0, 80) || "image"
  const ext = parsed.ext.toLowerCase().replace(/[^a-z0-9.]/g, "")
  const dir = parsed.dir
    .split("/")
    .map(slugifySegment)
    .filter(Boolean)
    .join("/")

  return path.posix.join(dir, `${name}${ext}`)
}

/**
 * Converts an uploaded image to WebP. Non-image content (CSV imports, PDFs,
 * and so on) is returned untouched. If an image cannot be converted, the
 * original is returned and the failure is reported through onError so that an
 * upload is never lost because of an optimisation problem. HEIC/HEIF photos are
 * rejected with a clear message, because they cannot be shown in browsers.
 */
export async function convertImageUploadToWebp(
  content: Buffer,
  filename: string,
  mimeType: string,
  options: ImageConversionOptions = {},
  onError?: (error: unknown) => void
): Promise<ConvertedUpload> {
  const unchanged: ConvertedUpload = {
    content,
    filename,
    mimeType,
    converted: false,
  }

  if (isHeifBuffer(content)) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, HEIF_UNSUPPORTED_MESSAGE)
  }

  if (!validateImageBuffer(content).valid) {
    return unchanged
  }

  try {
    const optimized = await optimizeImageBuffer(content, {
      maxWidth: options.maxWidth ?? 2048,
      quality: options.quality ?? 85,
      format: "webp",
      preserveTransparency: true,
    })

    return {
      content: optimized.buffer,
      filename: toWebpFilename(filename),
      mimeType: "image/webp",
      converted: true,
    }
  } catch (error) {
    onError?.(error)
    return unchanged
  }
}

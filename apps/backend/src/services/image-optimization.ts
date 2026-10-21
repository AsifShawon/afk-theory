import sharp from "sharp"
import { MedusaError } from "@medusajs/framework/utils"

export interface OptimizeImageOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: "webp" | "avif" | "png" | "jpeg"
  preserveTransparency?: boolean
}

export interface OptimizedResult {
  buffer: Buffer
  format: string
  width: number
  height: number
  size: number
  originalSize: number
}

export interface ResponsiveVariants {
  main: OptimizedResult
  card?: OptimizedResult
  thumbnail?: OptimizedResult
}

export type MediaCategory = "hero" | "product" | "category" | "general"

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/avif",
  "image/gif",
])

/**
 * Validate input image buffer by magic numbers to prevent MIME spoofing
 */
export function validateImageBuffer(buffer: Buffer): { valid: boolean; detectedMime?: string; error?: string } {
  if (!buffer || buffer.length < 12) {
    return { valid: false, error: "Buffer is too small to be a valid image" }
  }

  // Check magic numbers
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { valid: true, detectedMime: "image/jpeg" }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { valid: true, detectedMime: "image/png" }
  }

  // WebP: RIFF .... WEBP
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { valid: true, detectedMime: "image/webp" }
  }

  // AVIF: .... ftypavif
  const ftypSlice = buffer.subarray(4, 12).toString("ascii")
  if (ftypSlice.includes("ftyp")) {
    return { valid: true, detectedMime: "image/avif" }
  }

  // GIF: GIF87a or GIF89a
  const gifHeader = buffer.subarray(0, 3).toString("ascii")
  if (gifHeader === "GIF") {
    return { valid: true, detectedMime: "image/gif" }
  }

  return { valid: false, error: "Unsupported or unrecognized image header" }
}

/**
 * Optimizes an arbitrary image upload:
 * - Normalizes EXIF orientation
 * - Retains essential ICC color profile while stripping unsafe metadata
 * - Converts to WebP while respecting transparency
 * - Resizes responsibly without upscale enlargement
 */
export async function optimizeImageBuffer(
  inputBuffer: Buffer,
  options: OptimizeImageOptions = {}
): Promise<OptimizedResult> {
  const originalSize = inputBuffer.length
  const validation = validateImageBuffer(inputBuffer)
  if (!validation.valid) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      `Invalid image payload: ${validation.error}`
    )
  }

  const {
    maxWidth = 2048,
    maxHeight,
    quality = 82,
    format = "webp",
    preserveTransparency = true,
  } = options

  let pipeline = sharp(inputBuffer)

  // 1. Auto-rotate based on EXIF before stripping metadata
  pipeline = pipeline.rotate()

  // 2. Fetch metadata to evaluate transparency and dimensions
  const metadata = await pipeline.metadata()

  // 3. Keep ICC color profile for accurate textile color fidelity while stripping privacy EXIF
  pipeline = pipeline.withMetadata({ orientation: 1 })

  // 4. Resize if bounds specified
  if (maxWidth || maxHeight) {
    pipeline = pipeline.resize({
      width: maxWidth,
      height: maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    })
  }

  // 5. Output format encoding
  if (format === "webp") {
    const hasAlpha = metadata.hasAlpha && preserveTransparency
    pipeline = pipeline.webp({
      quality,
      effort: 4,
      lossless: false,
      alphaQuality: hasAlpha ? 90 : 0,
      smartSubsample: true,
    })
  } else if (format === "avif") {
    pipeline = pipeline.avif({
      quality,
      effort: 4,
    })
  } else if (format === "png") {
    pipeline = pipeline.png({
      compressionLevel: 8,
      adaptiveFiltering: true,
    })
  } else {
    pipeline = pipeline.jpeg({
      quality,
      mozjpeg: true,
    })
  }

  const { data: outputBuffer, info } = await pipeline.toBuffer({ resolveWithObject: true })

  return {
    buffer: outputBuffer,
    format: info.format,
    width: info.width,
    height: info.height,
    size: outputBuffer.length,
    originalSize,
  }
}

/**
 * Generate standard fashion e-commerce responsive derivatives
 */
export async function generateResponsiveVariants(
  inputBuffer: Buffer,
  category: MediaCategory = "product"
): Promise<ResponsiveVariants> {
  let mainMax = 1920
  let cardMax = 800
  let thumbMax = 400
  let quality = 82

  if (category === "hero") {
    mainMax = 2560
    cardMax = 1200
    thumbMax = 640
    quality = 85
  } else if (category === "category") {
    mainMax = 1440
    cardMax = 800
    thumbMax = 400
    quality = 82
  }

  const [main, card, thumbnail] = await Promise.all([
    optimizeImageBuffer(inputBuffer, { maxWidth: mainMax, quality }),
    optimizeImageBuffer(inputBuffer, { maxWidth: cardMax, quality: quality - 2 }),
    optimizeImageBuffer(inputBuffer, { maxWidth: thumbMax, quality: quality - 4 }),
  ])

  return {
    main,
    card,
    thumbnail,
  }
}

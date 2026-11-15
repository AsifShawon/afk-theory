import s3FileProvider from "@medusajs/medusa/file-s3"
import {
  FileTypes,
  Logger,
  S3FileServiceOptions,
} from "@medusajs/framework/types"
import { AbstractFileProviderService } from "@medusajs/framework/utils"
import {
  convertImageUploadToWebp,
  decodeFileContent,
  toSeoFilename,
} from "../../services/upload-conversion"

type S3FileServiceBase = new (
  dependencies: { logger: Logger },
  options: S3FileServiceOptions
) => AbstractFileProviderService & { logger_: Logger }

// Medusa's own S3 provider (also used for Cloudflare R2 and other S3-compatible
// storage), taken from the public module entry point rather than build internals.
export const S3FileService = s3FileProvider.services[0] as unknown as S3FileServiceBase

export type OptimizedS3FileServiceOptions = S3FileServiceOptions & {
  max_width?: number
  quality?: number
}

/**
 * Medusa's S3 provider with automatic WebP conversion, so production uploads
 * follow the same rule as the local development provider: every image is
 * stored as WebP.
 */
export default class OptimizedS3FileService extends S3FileService {
  static identifier = "s3"

  protected maxWidth_: number
  protected quality_: number

  constructor(
    dependencies: { logger: Logger },
    options: OptimizedS3FileServiceOptions
  ) {
    super(dependencies, options)
    this.maxWidth_ = options?.max_width || 2048
    this.quality_ = options?.quality || 85
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file?.filename) {
      // Let the base provider raise its standard validation errors.
      return super.upload(file)
    }

    const original = decodeFileContent(file.content, file.mimeType)

    const result = await convertImageUploadToWebp(
      original,
      file.filename,
      file.mimeType,
      { maxWidth: this.maxWidth_, quality: this.quality_ },
      (error) => {
        this.logger_.warn(
          `[ImageOptimization] WebP conversion failed for ${file.filename}, storing original: ${
            error instanceof Error ? error.message : String(error)
          }`
        )
      }
    )

    // URL-friendly, SEO-readable file name (the base provider adds a unique suffix)
    const filename = toSeoFilename(result.filename)

    if (!result.converted) {
      return super.upload({ ...file, filename })
    }

    return super.upload({
      ...file,
      filename,
      mimeType: result.mimeType,
      content: result.content.toString("base64"),
    })
  }
}

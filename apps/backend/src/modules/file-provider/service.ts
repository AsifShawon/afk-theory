import { AbstractFileProviderService, MedusaError } from "@medusajs/framework/utils"
import { FileTypes } from "@medusajs/framework/types"
import fs from "fs"
import { createReadStream } from "fs"
import path from "path"
import { Readable } from "stream"
import { randomBytes } from "crypto"
import {
  convertImageUploadToWebp,
  decodeFileContent,
  toSeoFilename,
} from "../../services/upload-conversion"

export interface OptimizedFileServiceOptions {
  upload_dir?: string
  private_upload_dir?: string
  backend_url?: string
  max_width?: number
  quality?: number
}

export default class OptimizedLocalFileService extends AbstractFileProviderService {
  static identifier = "local"

  protected uploadDir_: string
  protected privateUploadDir_: string
  protected backendUrl_: string
  protected maxWidth_: number
  protected quality_: number

  constructor(_: unknown, options: OptimizedFileServiceOptions) {
    super()
    this.uploadDir_ = options?.upload_dir
      ? path.resolve(options.upload_dir)
      : path.join(process.cwd(), "static")
    this.privateUploadDir_ = options?.private_upload_dir
      ? path.resolve(options.private_upload_dir)
      : path.join(process.cwd(), "static")
    this.backendUrl_ = options?.backend_url || "http://localhost:9000/static"
    this.maxWidth_ = options?.max_width || 2048
    this.quality_ = options?.quality || 85
  }

  protected getUploadFilePath = (baseDir: string, fileKey: string) => {
    const resolvedBase = path.resolve(baseDir)
    const resolved = path.resolve(resolvedBase, fileKey)
    const relative = path.relative(resolvedBase, resolved)
    if (
      relative === ".." ||
      relative.startsWith(`..${path.sep}`) ||
      path.isAbsolute(relative)
    ) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Invalid file key: ${fileKey}`
      )
    }
    return resolved
  }

  protected getUploadFileUrl = (fileKey: string) => {
    const baseUrl = new URL(this.backendUrl_)
    baseUrl.pathname = path.posix.join(
      baseUrl.pathname,
      fileKey.replace(/\\/g, "/")
    )
    return baseUrl.href
  }

  async upload(
    file: FileTypes.ProviderUploadFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    if (!file) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No file provided")
    }
    if (!file.filename) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "No filename provided")
    }

    const original = decodeFileContent(file.content, file.mimeType)

    // Convert images to WebP (HEIC is rejected, non-images pass through unchanged)
    const converted = await convertImageUploadToWebp(
      original,
      file.filename,
      file.mimeType,
      { maxWidth: this.maxWidth_, quality: this.quality_ },
      (err) => {
        console.warn(
          "[ImageOptimization] Auto-conversion to WebP failed, storing original:",
          err
        )
      }
    )

    // URL-friendly, SEO-readable name plus a short suffix so uploads never collide
    const parsedFilename = path.posix.parse(toSeoFilename(converted.filename))
    const baseDir =
      file.access === "public" ? this.uploadDir_ : this.privateUploadDir_
    await this.ensureDirExists(baseDir, parsedFilename.dir)

    const uniqueSuffix = randomBytes(4).toString("hex")
    const fileKey = path.posix.join(
      parsedFilename.dir,
      `${file.access === "public" ? "" : "private-"}${parsedFilename.name}-${uniqueSuffix}${parsedFilename.ext}`
    )
    const content = converted.content

    const filePath = this.getUploadFilePath(baseDir, fileKey)
    const fileUrl = this.getUploadFileUrl(fileKey)

    await fs.promises.writeFile(filePath, content)

    return {
      key: fileKey,
      url: fileUrl,
    }
  }

  async delete(
    files: FileTypes.ProviderDeleteFileDTO | FileTypes.ProviderDeleteFileDTO[]
  ): Promise<void> {
    const fileList = Array.isArray(files) ? files : [files]
    await Promise.all(
      fileList.map(async (file) => {
        const baseDir = file.fileKey.startsWith("private-")
          ? this.privateUploadDir_
          : this.uploadDir_
        const filePath = this.getUploadFilePath(baseDir, file.fileKey)
        try {
          await fs.promises.access(filePath, fs.constants.W_OK)
          await fs.promises.unlink(filePath)
        } catch (e: unknown) {
          if ((e as { code?: string }).code !== "ENOENT") {
            throw e
          }
        }
      })
    )
  }

  async getDownloadStream(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<Readable> {
    const baseDir = file.fileKey.startsWith("private-")
      ? this.privateUploadDir_
      : this.uploadDir_
    const filePath = this.getUploadFilePath(baseDir, file.fileKey)
    return createReadStream(filePath)
  }

  async getAsBuffer(file: FileTypes.ProviderGetFileDTO): Promise<Buffer> {
    const baseDir = file.fileKey.startsWith("private-")
      ? this.privateUploadDir_
      : this.uploadDir_
    const filePath = this.getUploadFilePath(baseDir, file.fileKey)
    return fs.promises.readFile(filePath)
  }

  async getPresignedDownloadUrl(
    file: FileTypes.ProviderGetFileDTO
  ): Promise<string> {
    const isPrivate = file.fileKey.startsWith("private-")
    const baseDir = isPrivate ? this.privateUploadDir_ : this.uploadDir_
    const filePath = this.getUploadFilePath(baseDir, file.fileKey)
    try {
      await fs.promises.access(filePath, fs.constants.F_OK)
    } catch {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `File with key ${file.fileKey} not found`
      )
    }
    return this.getUploadFileUrl(file.fileKey)
  }

  async getPresignedUploadUrl(
    fileData: FileTypes.ProviderGetFileDTO
  ): Promise<FileTypes.ProviderFileResultDTO> {
    const filename = (fileData as unknown as { filename?: string })?.filename || fileData.fileKey
    if (!filename) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "No filename provided"
      )
    }
    return {
      url: "/admin/uploads",
      key: filename,
    }
  }

  protected async ensureDirExists(baseDir: string, dirPath: string) {
    const relativePath = path.join(baseDir, dirPath)
    try {
      await fs.promises.access(relativePath, fs.constants.F_OK)
    } catch {
      await fs.promises.mkdir(relativePath, { recursive: true })
    }
    return relativePath
  }
}

import sharp from "sharp"
import OptimizedS3FileService, { S3FileService } from "../service"

sharp.cache(false)

describe("OptimizedS3FileService", () => {
  const logger = {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }

  let service: OptimizedS3FileService
  let baseUpload: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    baseUpload = jest
      .spyOn(S3FileService.prototype, "upload")
      .mockResolvedValue({ url: "https://cdn.example.com/key.webp", key: "key.webp" })

    service = new OptimizedS3FileService({ logger } as never, {
      file_url: "https://cdn.example.com",
      access_key_id: "test-access-key",
      secret_access_key: "test-secret-key",
      region: "auto",
      bucket: "test-bucket",
      endpoint: "https://example.r2.cloudflarestorage.com",
    })
  })

  afterEach(() => {
    baseUpload.mockRestore()
  })

  async function pngBuffer(width = 3200, height = 2400) {
    return sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 216, g: 244, b: 82, alpha: 1 },
      },
    })
      .png()
      .toBuffer()
  }

  it("converts a PNG upload to a resized WebP before it reaches S3", async () => {
    const png = await pngBuffer()

    await service.upload({
      filename: "products/oversized tee.png",
      content: png.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })

    expect(baseUpload).toHaveBeenCalledTimes(1)
    const forwarded = baseUpload.mock.calls[0][0]
    expect(forwarded.filename).toBe("products/oversized-tee.webp")
    expect(forwarded.mimeType).toBe("image/webp")

    const stored = Buffer.from(forwarded.content, "base64")
    const metadata = await sharp(stored).metadata()
    expect(metadata.format).toBe("webp")
    expect(metadata.width).toBeLessThanOrEqual(2048)
    expect(stored.length).toBeLessThan(png.length)
  })

  it("converts a JPEG upload to WebP", async () => {
    const jpeg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#20241F" },
    })
      .jpeg()
      .toBuffer()

    await service.upload({
      filename: "campaign.jpg",
      content: jpeg.toString("base64"),
      mimeType: "image/jpeg",
      access: "public",
    })

    const forwarded = baseUpload.mock.calls[0][0]
    expect(forwarded.filename).toBe("campaign.webp")
    expect(forwarded.mimeType).toBe("image/webp")
    const metadata = await sharp(Buffer.from(forwarded.content, "base64")).metadata()
    expect(metadata.format).toBe("webp")
  })

  it("passes non-image uploads through untouched", async () => {
    const csv = Buffer.from("sku,qty\nAFK-1,5\n", "utf8")
    const file = {
      filename: "inventory.csv",
      content: csv.toString("base64"),
      mimeType: "text/csv",
      access: "private" as const,
    }

    await service.upload(file)

    expect(baseUpload).toHaveBeenCalledTimes(1)
    expect(baseUpload.mock.calls[0][0]).toEqual(file)
  })

  it("stores the original and logs a warning when an image cannot be converted", async () => {
    // Valid PNG signature followed by garbage: passes header validation, fails in sharp.
    const corrupt = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      Buffer.from("this is not a real png body"),
    ])
    const file = {
      filename: "broken.png",
      content: corrupt.toString("base64"),
      mimeType: "image/png",
      access: "public" as const,
    }

    await service.upload(file)

    expect(baseUpload.mock.calls[0][0]).toEqual(file)
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("WebP conversion failed for broken.png")
    )
  })

  it("gives uploads a clean, URL-friendly file name", async () => {
    const png = await pngBuffer(400, 300)

    await service.upload({
      filename: "Drop Shoulder Tee (Black) FRONT.PNG",
      content: png.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })

    expect(baseUpload.mock.calls[0][0].filename).toBe("drop-shoulder-tee-black-front.webp")
  })

  it("rejects HEIC photos instead of storing a file browsers cannot show", async () => {
    const heic = Buffer.alloc(64)
    heic.writeUInt32BE(32, 0)
    heic.write("ftypheic", 4, "ascii")

    await expect(
      service.upload({
        filename: "IMG_2041.HEIC",
        content: heic.toString("base64"),
        mimeType: "image/heic",
        access: "public",
      })
    ).rejects.toThrow(/HEIC\/HEIF photos are not supported/)

    expect(baseUpload).not.toHaveBeenCalled()
  })
})

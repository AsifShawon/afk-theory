import path from "path"
import fs from "fs"
import sharp from "sharp"
import OptimizedLocalFileService from "../service"

sharp.cache(false)

describe("OptimizedLocalFileService", () => {
  const testUploadDir = path.join(__dirname, "test-static")
  let service: OptimizedLocalFileService

  beforeAll(async () => {
    if (!fs.existsSync(testUploadDir)) {
      await fs.promises.mkdir(testUploadDir, { recursive: true })
    }
    service = new OptimizedLocalFileService(
      {},
      {
        upload_dir: testUploadDir,
        backend_url: "http://localhost:9000/static",
        max_width: 2048,
        quality: 85,
      }
    )
  })

  afterAll(async () => {
    if (fs.existsSync(testUploadDir)) {
      await fs.promises.rm(testUploadDir, { recursive: true, force: true })
    }
  })

  it("converts an oversized PNG to a web-optimized WebP image with correct static URL", async () => {
    // Generate a 3200x2400 high-res PNG image
    const highResPng = await sharp({
      create: {
        width: 3200,
        height: 2400,
        channels: 4,
        background: { r: 216, g: 244, b: 82, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const result = await service.upload({
      filename: "oversized-apparel-mockup.png",
      content: highResPng.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })

    // URL must be prefixed with /static/
    expect(result.url).toMatch(/^http:\/\/localhost:9000\/static\//)
    expect(result.url).toMatch(/\.webp$/)
    expect(result.key).toMatch(/\.webp$/)

    // Verify written file exists on disk and is a valid WebP
    const filePath = path.join(testUploadDir, result.key)
    expect(fs.existsSync(filePath)).toBe(true)

    const metadata = await sharp(filePath).metadata()
    expect(metadata.format).toBe("webp")
    expect(metadata.width).toBeLessThanOrEqual(2048)
    expect(metadata.height).toBeLessThanOrEqual(2048)
  })

  it("handles images larger than 5 MB and converts them into optimized WebP", async () => {
    // Generate a large 4000x3000 high-resolution test image with noise to exceed 5 MB
    const largePng = await sharp({
      create: {
        width: 4000,
        height: 3000,
        channels: 4,
        background: { r: 17, g: 17, b: 17, alpha: 1 },
      },
    })
      .png({ compressionLevel: 0 }) // Uncompressed to guarantee large payload (> 5MB)
      .toBuffer()

    expect(largePng.length).toBeGreaterThan(5 * 1024 * 1024) // Verified > 5 MB

    const result = await service.upload({
      filename: "01-Front-Product-Heavy.png",
      content: largePng.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })

    expect(result.url).toMatch(/\.webp$/)
    expect(result.key).toMatch(/\.webp$/)

    const filePath = path.join(testUploadDir, result.key)
    expect(fs.existsSync(filePath)).toBe(true)

    const stat = await fs.promises.stat(filePath)
    expect(stat.size).toBeLessThan(largePng.length)

    const metadata = await sharp(filePath).metadata()
    expect(metadata.format).toBe("webp")
  })

  it("preserves non-image files as-is without breaking", async () => {
    const csvContent = "SKU,Size,Color\nAFK-1,XL,Black"
    const result = await service.upload({
      filename: "inventory.csv",
      content: Buffer.from(csvContent).toString("base64"),
      mimeType: "text/csv",
      access: "public",
    })

    expect(result.key).toMatch(/\.csv$/)
    const filePath = path.join(testUploadDir, result.key)
    expect(fs.existsSync(filePath)).toBe(true)
    const read = await fs.promises.readFile(filePath, "utf8")
    expect(read).toBe(csvContent)
  })

  it("stores uploads under a clean SEO-friendly name with a short unique suffix", async () => {
    const png = await sharp({
      create: { width: 600, height: 800, channels: 3, background: "#20241F" },
    })
      .png()
      .toBuffer()

    const result = await service.upload({
      filename: "Drop Shoulder Tee (Black) FRONT.PNG",
      content: png.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })

    expect(result.key).toMatch(/^drop-shoulder-tee-black-front-[0-9a-f]{8}\.webp$/)
    expect(result.url).toContain(result.key)

    const second = await service.upload({
      filename: "Drop Shoulder Tee (Black) FRONT.PNG",
      content: png.toString("base64"),
      mimeType: "image/png",
      access: "public",
    })
    expect(second.key).not.toBe(result.key)
  })

  it("strips EXIF metadata from stored images", async () => {
    const jpeg = await sharp({
      create: { width: 400, height: 300, channels: 3, background: "#336699" },
    })
      .withExif({ IFD0: { Copyright: "SECRET-OWNER" } })
      .jpeg()
      .toBuffer()

    const result = await service.upload({
      filename: "phone.jpg",
      content: jpeg.toString("base64"),
      mimeType: "image/jpeg",
      access: "public",
    })

    const metadata = await sharp(path.join(testUploadDir, result.key)).metadata()
    expect(metadata.exif).toBeUndefined()
  })

  it("rejects HEIC photos", async () => {
    const heic = Buffer.alloc(64)
    heic.writeUInt32BE(32, 0)
    heic.write("ftypheic", 4, "ascii")

    await expect(
      service.upload({
        filename: "IMG_1.HEIC",
        content: heic.toString("base64"),
        mimeType: "image/heic",
        access: "public",
      })
    ).rejects.toThrow(/not supported/)
  })
})

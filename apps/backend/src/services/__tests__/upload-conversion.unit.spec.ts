import sharp from "sharp"
import {
  convertImageUploadToWebp,
  toSeoFilename,
  toWebpFilename,
} from "../upload-conversion"
import { isHeifBuffer, validateImageBuffer } from "../image-optimization"

sharp.cache(false)

function isoBaseMedia(brand: string, compatible = ""): Buffer {
  const buf = Buffer.alloc(64)
  buf.writeUInt32BE(32, 0)
  buf.write("ftyp", 4, "ascii")
  buf.write(brand, 8, "ascii")
  buf.write(compatible, 16, "ascii")
  return buf
}

describe("convertImageUploadToWebp", () => {
  it("removes EXIF metadata such as owner and location from converted photos", async () => {
    const jpeg = await sharp({
      create: { width: 800, height: 600, channels: 3, background: "#336699" },
    })
      .withExif({
        IFD0: { Copyright: "SECRET-OWNER", Artist: "Phone Owner" },
        IFD3: { GPSLatitudeRef: "N", GPSLongitudeRef: "E" },
      })
      .jpeg()
      .toBuffer()

    expect((await sharp(jpeg).metadata()).exif).toBeDefined()

    const result = await convertImageUploadToWebp(jpeg, "phone-photo.jpg", "image/jpeg")

    expect(result.converted).toBe(true)
    const metadata = await sharp(result.content).metadata()
    expect(metadata.format).toBe("webp")
    expect(metadata.exif).toBeUndefined()
  })

  it("keeps animated GIFs animated", async () => {
    const frame = (background: string) =>
      sharp({ create: { width: 40, height: 40, channels: 3, background } })
        .png()
        .toBuffer()
    const frames = await Promise.all(["#ff0000", "#00ff00", "#0000ff"].map(frame))
    const gif = await sharp(frames, { join: { animated: true } })
      .gif({ loop: 0, delay: [100, 100, 100] })
      .toBuffer()

    const result = await convertImageUploadToWebp(gif, "spin.gif", "image/gif")

    expect(result.converted).toBe(true)
    expect(result.filename).toBe("spin.webp")
    const metadata = await sharp(result.content, { animated: true }).metadata()
    expect(metadata.format).toBe("webp")
    expect(metadata.pages).toBe(3)
  })

  it("rejects HEIC photos with a clear message", async () => {
    const heic = isoBaseMedia("heic")
    expect(isHeifBuffer(heic)).toBe(true)

    await expect(
      convertImageUploadToWebp(heic, "IMG_0001.HEIC", "image/heic")
    ).rejects.toThrow(/HEIC\/HEIF photos are not supported/)

    // HEIF identified through compatible brands of a generic mif1 file
    const mif1Heic = isoBaseMedia("mif1", "mif1heic")
    await expect(
      convertImageUploadToWebp(mif1Heic, "IMG_0002.heif", "image/heif")
    ).rejects.toThrow(/not supported/)
  })

  it("does not mistake MP4 video for an image", async () => {
    const mp4 = isoBaseMedia("isom", "isomiso2avc1mp41")
    expect(validateImageBuffer(mp4).valid).toBe(false)

    const result = await convertImageUploadToWebp(mp4, "clip.mp4", "video/mp4")
    expect(result.converted).toBe(false)
    expect(result.content).toBe(mp4)
    expect(result.filename).toBe("clip.mp4")
  })

  it("still accepts real AVIF images", async () => {
    const avif = await sharp({
      create: { width: 64, height: 64, channels: 3, background: "#D8F452" },
    })
      .avif()
      .toBuffer()

    expect(validateImageBuffer(avif)).toMatchObject({
      valid: true,
      detectedMime: "image/avif",
    })

    const result = await convertImageUploadToWebp(avif, "swatch.avif", "image/avif")
    expect(result.converted).toBe(true)
    expect((await sharp(result.content).metadata()).format).toBe("webp")
  })

  it("returns non-image content untouched", async () => {
    const csv = Buffer.from("sku,qty\nAFK-1,5\n")
    const result = await convertImageUploadToWebp(csv, "stock.csv", "text/csv")
    expect(result).toEqual({
      content: csv,
      filename: "stock.csv",
      mimeType: "text/csv",
      converted: false,
    })
  })
})

describe("file name helpers", () => {
  it("toWebpFilename swaps the extension and keeps the folder", () => {
    expect(toWebpFilename("products/tee.PNG")).toBe("products/tee.webp")
  })

  it("toSeoFilename produces readable, URL-safe names", () => {
    expect(toSeoFilename("Drop Shoulder Tee (Black).PNG")).toBe(
      "drop-shoulder-tee-black.png"
    )
    expect(toSeoFilename("ChatGPT Image Oct 21, 2026, 02_17_46 PM-2.webp")).toBe(
      "chatgpt-image-oct-21-2026-02-17-46-pm-2.webp"
    )
    expect(toSeoFilename("Café Étoile.jpg")).toBe("cafe-etoile.jpg")
    expect(toSeoFilename("My Folder\\Sub Folder/Front View.png")).toBe(
      "my-folder/sub-folder/front-view.png"
    )
  })

  it("toSeoFilename never returns an empty name", () => {
    expect(toSeoFilename("###.png")).toBe("image.png")
    expect(toSeoFilename("....")).toMatch(/^image/)
  })

  it("toSeoFilename removes path traversal and odd extension characters", () => {
    expect(toSeoFilename("../../etc/passwd")).toBe("etc/passwd")
    expect(toSeoFilename("photo.J P G")).toBe("photo.jpg")
  })
})

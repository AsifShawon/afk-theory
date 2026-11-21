import { slugify } from "@dtc/catalogue-core"

/**
 * Product gallery ordering. Every photo of the product sits in one strip,
 * grouped by design, then color, so swiping walks through the colors and the
 * selection can follow the photo in view.
 */

export interface GalleryImageLike {
  id: string
  colorId: string | null
  /** Optional design option; products without designs leave it unset. */
  designId?: string | null
}

export interface GallerySlide<T extends GalleryImageLike> {
  image: T
  index: number
  colorId: string | null
  designId: string | null
}

export interface GalleryGroup {
  colorId: string | null
  designId: string | null
  start: number
  count: number
}

/**
 * Orders images: by design, then by color (in the product's color order).
 * Photos with no color that come before any colored photo stay at the front
 * (the cover); later ones move to the end of their design group.
 */
export function buildGallery<T extends GalleryImageLike>(
  images: T[],
  colorIds: string[],
  designIds: string[] = []
): { slides: GallerySlide<T>[]; groups: GalleryGroup[] } {
  const colorRank = new Map(colorIds.map((id, i) => [id, i]))
  const designRank = new Map(designIds.map((id, i) => [id, i]))
  const firstColored = images.findIndex((img) => img.colorId && colorRank.has(img.colorId))

  const keyed = images.map((image, original) => {
    const design = image.designId && designRank.has(image.designId) ? (designRank.get(image.designId) as number) : designIds.length
    let color: number
    if (image.colorId && colorRank.has(image.colorId)) {
      color = colorRank.get(image.colorId) as number
    } else {
      color = firstColored === -1 || original < firstColored ? -1 : colorIds.length
    }
    return { image, original, design, color }
  })
  keyed.sort((a, b) => a.design - b.design || a.color - b.color || a.original - b.original)

  const slides = keyed.map(({ image }, index) => ({
    image,
    index,
    colorId: image.colorId && colorRank.has(image.colorId) ? image.colorId : null,
    designId: image.designId && designRank.has(image.designId) ? image.designId : null,
  }))

  const groups: GalleryGroup[] = []
  for (const slide of slides) {
    const last = groups[groups.length - 1]
    if (last && last.colorId === slide.colorId && last.designId === slide.designId) {
      last.count++
    } else {
      groups.push({ colorId: slide.colorId, designId: slide.designId, start: slide.index, count: 1 })
    }
  }
  return { slides, groups }
}

/** Index of the first photo of a color (within a design when given), or -1. */
export function firstSlideFor<T extends GalleryImageLike>(slides: GallerySlide<T>[], colorId: string | null, designId?: string | null): number {
  const exact = slides.findIndex((s) => s.colorId === colorId && (designId === undefined || s.designId === designId))
  if (exact !== -1 || designId === undefined) return exact
  // The design has no photo in this color: fall back to any photo of the color.
  return slides.findIndex((s) => s.colorId === colorId)
}

/** URL value for an option, e.g. "Bottle Green" -> "bottle-green". */
export function optionParam(name: string): string {
  return slugify(name)
}

/** Finds the option whose name matches a URL value. */
export function findByParam<T extends { name: string }>(options: T[], value: string | null): T | undefined {
  if (!value) return undefined
  const wanted = value.toLowerCase()
  return options.find((o) => optionParam(o.name) === wanted)
}

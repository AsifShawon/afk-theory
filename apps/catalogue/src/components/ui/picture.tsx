import type { CSSProperties } from "react"
import type { CatalogueImage } from "@dtc/catalogue-core"

/**
 * Responsive <img> built from the pre-generated webp widths. `sizes` should
 * describe how wide the image renders so the browser picks the right file.
 */
export function Picture({
  image,
  sizes,
  className,
  priority = false,
  style,
}: {
  image: CatalogueImage
  sizes: string
  className?: string
  priority?: boolean
  style?: CSSProperties
}) {
  const largest = image.sources[image.sources.length - 1]
  return (
    <img
      src={largest.src}
      srcSet={image.sources.map((s) => `${s.src} ${s.width}w`).join(", ")}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={image.alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      draggable={false}
      className={className}
      style={style}
    />
  )
}

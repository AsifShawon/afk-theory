"use client"

import { Link } from "next-view-transitions"
import { useState } from "react"
import { clsx } from "clsx"
import { formatBdt, type CatalogueProduct, type ProductBadge } from "@dtc/catalogue-core"
import { Picture } from "@/components/ui/picture"
import { optionParam } from "@/lib/gallery"

export function productTransitionName(slug: string): string {
  return `product-${slug}`
}

const BADGE_LABEL: Record<ProductBadge, string> = {
  "sold-out": "Sold out",
  sale: "Sale",
  new: "New",
  bestseller: "Bestseller",
}

const BADGE_STYLE: Record<ProductBadge, string> = {
  "sold-out": "bg-brand-graphite text-brand-bone",
  sale: "bg-brand-accent text-brand-graphite",
  new: "bg-brand-bone text-brand-graphite",
  bestseller: "bg-brand-graphite text-brand-accent",
}

const MAX_SWATCHES = 5

/**
 * Collection card. Color swatches preview that color's photo (hover on
 * desktop, tap on phones) and the link opens the product on that color.
 * Hovering swaps to an on-model photo; the corner brackets close in like a
 * reticle. The cover image morphs into the product page.
 */
export function ProductCard({ product, sizes, tone = "light" }: { product: CatalogueProduct; sizes: string; tone?: "light" | "dark" }) {
  const [previewId, setPreviewId] = useState<string | null>(null)

  const cover = product.images[0]
  const preview = previewId ? product.colors.find((c) => c.id === previewId) ?? null : null
  const previewImage = preview ? product.images.find((img) => img.colorId === preview.id) ?? null : null
  const shown = previewImage ?? cover
  const alternate = previewImage ? null : product.images.find((img) => img.id !== cover.id && img.role === "model") ?? product.images[1]
  const href = `/products/${product.slug}/${preview ? `?color=${optionParam(preview.name)}` : ""}`

  const colors = product.colors.slice(0, MAX_SWATCHES)
  const extraColors = product.colors.length - colors.length
  const badges = product.badges.slice(0, 2)
  const dark = tone === "dark"

  return (
    <article className="group/card">
      <Link href={href} className="group block focus-visible:outline-offset-4">
        <div
          className={clsx(
            "hud-frame relative aspect-[4/5] overflow-hidden bg-brand-stone",
            "before:scale-150 before:opacity-0 after:scale-150 after:opacity-0",
            "group-hover:before:scale-100 group-hover:before:opacity-100 group-hover:after:scale-100 group-hover:after:opacity-100",
            "text-brand-accent"
          )}
        >
          <Picture
            key={shown.id}
            image={shown}
            sizes={sizes}
            className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
            style={shown.id === cover.id ? { viewTransitionName: productTransitionName(product.slug) } : undefined}
          />
          {alternate && (
            <Picture
              image={alternate}
              sizes={sizes}
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
          {badges.length > 0 && (
            <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
              {badges.map((badge) => (
                <span key={badge} className={clsx("font-hud px-2 py-1 text-[10px]", BADGE_STYLE[badge])}>
                  {BADGE_LABEL[badge]}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className={clsx("mt-4 flex items-start justify-between gap-4", dark ? "text-brand-bone" : "text-brand-graphite")}>
          <h3 className="display line-clamp-2 min-w-0 text-lg leading-[0.95] md:text-2xl">{product.name}</h3>
          <p className="font-hud shrink-0 text-right text-sm tracking-normal">
            {formatBdt(product.priceBdt)}
            {product.compareAtBdt && <span className="block text-[11px] text-brand-olive line-through">{formatBdt(product.compareAtBdt)}</span>}
          </p>
        </div>
      </Link>

      {(colors.length > 1 || product.designs.length > 1) && (
        <div className={clsx("mt-2 flex items-center justify-between gap-3", dark ? "text-brand-bone/60" : "text-brand-olive")}>
          {colors.length > 1 ? (
            <div role="group" aria-label={`${product.name} colors`} className="-ml-1.5 flex items-center" onMouseLeave={() => setPreviewId(null)}>
              {colors.map((color) => {
                const active = previewId === color.id
                return (
                  <button
                    key={color.id}
                    type="button"
                    onMouseEnter={() => setPreviewId(color.id)}
                    onFocus={() => setPreviewId(color.id)}
                    onClick={() => setPreviewId(active ? null : color.id)}
                    aria-pressed={active}
                    aria-label={`Show ${color.name}${color.inStock ? "" : " (coming soon)"}`}
                    title={color.name}
                    className="flex h-8 w-8 items-center justify-center"
                  >
                    <span
                      className={clsx(
                        "block h-4 w-4 border transition-transform duration-200",
                        active ? "scale-125 border-current" : "border-black/20",
                        !color.inStock && "opacity-35"
                      )}
                      style={{ backgroundColor: color.hex }}
                    />
                  </button>
                )
              })}
              {extraColors > 0 && <span className="font-hud ml-1 text-[10px]">+{extraColors}</span>}
            </div>
          ) : (
            <span />
          )}
          {product.designs.length > 1 && <span className="font-hud shrink-0 text-[10px]">{product.designs.length} designs</span>}
        </div>
      )}
    </article>
  )
}

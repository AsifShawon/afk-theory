import { Link } from "next-view-transitions"
import { clsx } from "clsx"
import { formatBdt, type CatalogueProduct } from "@dtc/catalogue-core"
import { Picture } from "@/components/ui/picture"

export function productTransitionName(slug: string): string {
  return `product-${slug}`
}

/**
 * Collection card. Hovering swaps to an on-model photo; the corner brackets
 * close in like a reticle. The cover image morphs into the product page.
 */
export function ProductCard({ product, sizes, tone = "light" }: { product: CatalogueProduct; sizes: string; tone?: "light" | "dark" }) {
  const cover = product.images[0]
  const alternate = product.images.find((img) => img.id !== cover.id && img.role === "model") ?? product.images[1]
  const visibleColors = product.colors.slice(0, 5)

  return (
    <Link href={`/products/${product.slug}/`} className="group block focus-visible:outline-offset-4">
      <div
        className={clsx(
          "hud-frame relative aspect-[4/5] overflow-hidden bg-brand-stone",
          "before:scale-150 before:opacity-0 after:scale-150 after:opacity-0",
          "group-hover:before:scale-100 group-hover:before:opacity-100 group-hover:after:scale-100 group-hover:after:opacity-100",
          "text-brand-accent"
        )}
      >
        <Picture
          image={cover}
          sizes={sizes}
          className="h-full w-full object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03]"
          style={{ viewTransitionName: productTransitionName(product.slug) }}
        />
        {alternate && (
          <Picture
            image={alternate}
            sizes={sizes}
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <div className="absolute left-3 top-3 flex gap-1.5">
          {product.soldOut && <span className="font-hud bg-brand-graphite px-2 py-1 text-[10px] text-brand-bone">Sold out</span>}
          {!product.soldOut && product.compareAtBdt && <span className="font-hud bg-brand-accent px-2 py-1 text-[10px] text-brand-graphite">Sale</span>}
        </div>
      </div>
      <div className={clsx("mt-4 flex items-start justify-between gap-4", tone === "dark" ? "text-brand-bone" : "text-brand-graphite")}>
        <div className="min-w-0">
          <h3 className="display line-clamp-2 text-lg leading-[0.95] md:text-2xl">{product.name}</h3>
          {visibleColors.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5" aria-label={`${product.colors.length} colors`}>
              {visibleColors.map((color) => (
                <span
                  key={color.id}
                  title={color.inStock ? color.name : `${color.name} (coming soon)`}
                  className={clsx("h-3 w-3 border border-black/20", !color.inStock && "opacity-35")}
                  style={{ backgroundColor: color.hex }}
                />
              ))}
            </div>
          )}
        </div>
        <p className="font-hud shrink-0 text-right text-sm tracking-normal">
          {formatBdt(product.priceBdt)}
          {product.compareAtBdt && <span className="block text-[11px] text-brand-olive line-through">{formatBdt(product.compareAtBdt)}</span>}
        </p>
      </div>
    </Link>
  )
}

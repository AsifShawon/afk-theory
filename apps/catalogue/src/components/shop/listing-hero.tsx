import { Link } from "next-view-transitions"
import type { CatalogueImage } from "@dtc/catalogue-core"
import { Picture } from "@/components/ui/picture"

export interface Crumb {
  name: string
  href: string
}

export interface Tile {
  name: string
  href: string
  count: number
  image: CatalogueImage | null
}

/**
 * Top of a shop, category or collection page: breadcrumb, title, optional
 * description and banner photo, then tiles for subcategories.
 */
export function ListingHero({
  eyebrow,
  title,
  description,
  crumbs,
  image,
  tiles = [],
}: {
  eyebrow?: string
  title: string
  description?: string
  crumbs: Crumb[]
  image?: CatalogueImage | null
  tiles?: Tile[]
}) {
  return (
    <header className="pb-10">
      <nav aria-label="Breadcrumb" className="font-hud text-[11px] text-brand-olive">
        <ol className="flex flex-wrap items-center gap-1.5">
          {crumbs.map((crumb) => (
            <li key={crumb.href} className="flex items-center gap-1.5">
              <Link href={crumb.href} className="hover:text-brand-graphite">
                {crumb.name}
              </Link>
              <span aria-hidden>/</span>
            </li>
          ))}
          <li aria-current="page" className="text-brand-graphite">
            {title}
          </li>
        </ol>
      </nav>

      <div className={image ? "mt-6 grid items-end gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,420px)]" : "mt-6"}>
        <div>
          {eyebrow && <p className="font-hud text-[11px] text-brand-olive">{eyebrow}</p>}
          <h1 className="display mt-2 text-5xl md:text-7xl lg:text-8xl">{title}</h1>
          {description && <p className="mt-5 max-w-xl text-brand-olive">{description}</p>}
        </div>
        {image && (
          <div className="hud-frame relative aspect-[16/10] overflow-hidden bg-brand-stone text-brand-graphite md:aspect-[4/3]">
            <Picture image={image} sizes="(min-width: 768px) 420px, 100vw" priority className="h-full w-full object-cover" />
          </div>
        )}
      </div>

      {tiles.length > 0 && (
        <ul className="no-scrollbar -mx-5 mt-10 flex gap-3 overflow-x-auto px-5 md:mx-0 md:grid md:grid-cols-4 md:gap-4 md:overflow-visible md:px-0">
          {tiles.map((tile) => (
            <li key={tile.href} className="w-40 shrink-0 md:w-auto">
              <Link href={tile.href} className="group block">
                <div className="relative aspect-square overflow-hidden bg-brand-stone">
                  {tile.image && (
                    <Picture image={tile.image} sizes="(min-width: 768px) 22vw, 160px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-brand-bone">
                    <p className="display text-lg leading-none">{tile.name}</p>
                    <p className="font-hud mt-1 text-[10px] text-brand-bone/70">
                      {tile.count} {tile.count === 1 ? "item" : "items"}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  )
}

/** The bone-colored page body every listing page shares. */
export function ListingShell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-brand-bone pb-28 pt-24 text-brand-graphite md:pt-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">{children}</div>
    </section>
  )
}

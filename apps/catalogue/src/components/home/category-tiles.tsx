import { Link } from "next-view-transitions"
import type { CatalogueImage } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"
import { ArrowIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"
import { SectionHeading } from "./section-heading"

export interface CategoryTile {
  id: string
  name: string
  href: string
  count: number
  image: CatalogueImage | null
}

/** Shop by category: one tall tile per top-level category. */
export function CategoryTiles({ tiles }: { tiles: CategoryTile[] }) {
  return (
    <section aria-labelledby="home-categories" className="grain relative bg-brand-graphite-dark py-24 text-brand-bone md:py-32">
      <div className="relative mx-auto max-w-editorial px-5 md:px-10">
        <Reveal>
          <SectionHeading id="home-categories" eyebrow="Shop by category" title="Pick your lane" href="/shop/" linkLabel="Shop all" tone="dark" />
        </Reveal>
        <ul className={tiles.length >= 3 ? "mt-12 grid gap-4 md:grid-cols-3" : "mt-12 grid gap-4 md:grid-cols-2"}>
          {tiles.map((tile, i) => (
            <Reveal as="li" key={tile.id} delay={i * 0.08}>
              <Link href={tile.href} className="group relative block overflow-hidden bg-brand-graphite">
                <div className="aspect-[4/5] overflow-hidden md:aspect-[3/4]">
                  {tile.image && (
                    <Picture
                      image={tile.image}
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="h-full w-full object-cover opacity-85 transition-[transform,opacity] duration-700 ease-out-expo group-hover:scale-105 group-hover:opacity-100"
                    />
                  )}
                </div>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-5 pt-20 md:p-6">
                  <div>
                    <p className="font-hud text-[10px] text-brand-accent">
                      {tile.count} {tile.count === 1 ? "piece" : "pieces"}
                    </p>
                    <h3 className="display mt-2 text-3xl md:text-4xl">{tile.name}</h3>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/30 transition-colors group-hover:border-brand-accent group-hover:bg-brand-accent group-hover:text-brand-graphite">
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

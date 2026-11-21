import { Link } from "next-view-transitions"
import { formatBdt, type CatalogueCollection, type CatalogueImage, type CatalogueProduct } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"
import { ArrowIcon } from "@/components/ui/icons"
import { Picture } from "@/components/ui/picture"

/** A banner for one collection set to "show on home", with a few of its pieces. */
export function CollectionSpotlight({
  collection,
  image,
  products,
}: {
  collection: CatalogueCollection
  image: CatalogueImage | null
  products: CatalogueProduct[]
}) {
  const preview = products.slice(0, 3)
  return (
    <section aria-labelledby="home-spotlight" className="bg-brand-graphite text-brand-bone">
      <div className="mx-auto grid max-w-editorial md:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden md:aspect-auto md:min-h-[640px]">
          {image && <Picture image={image} sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-brand-graphite/70 to-transparent md:hidden" />
        </div>
        <Reveal className="flex flex-col justify-center px-5 py-16 md:px-14 md:py-20">
          <p className="font-hud text-[11px] text-brand-accent">
            Collection · {products.length} {products.length === 1 ? "piece" : "pieces"}
          </p>
          <h2 id="home-spotlight" className="display mt-4 text-5xl md:text-7xl">
            {collection.name}
          </h2>
          {collection.description && <p className="mt-5 max-w-md text-brand-bone/75">{collection.description}</p>}

          {preview.length > 0 && (
            <ul className="mt-10 grid grid-cols-3 gap-3">
              {preview.map((p) => {
                const img = p.images[0]
                return (
                  <li key={p.id}>
                    <Link href={`/products/${p.slug}/`} className="group block">
                      <div className="aspect-[4/5] overflow-hidden bg-brand-stone">
                        {img && <Picture image={img} sizes="160px" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                      </div>
                      <p className="font-hud mt-2 text-[10px] tracking-normal text-brand-bone/60">{formatBdt(p.priceBdt)}</p>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}

          <Link href={collection.href} className="btn-signal mt-10 self-start">
            Shop the collection <ArrowIcon />
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

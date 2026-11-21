import type { Metadata } from "next"
import { Link } from "next-view-transitions"
import { ListingHero, ListingShell } from "@/components/shop/listing-hero"
import { Picture } from "@/components/ui/picture"
import { getCatalogue } from "@/lib/catalogue"
import { coverImage, productsBySlugs } from "@/lib/store"

export const metadata: Metadata = {
  title: "Collections",
  description: "AFK THEORY drops and edits, each in one place.",
  alternates: { canonical: "/collections/" },
}

export default async function CollectionsPage() {
  const catalogue = await getCatalogue()
  const collections = catalogue.collections
    .map((c) => ({ collection: c, products: productsBySlugs(catalogue, c.productSlugs) }))
    .filter((entry) => entry.products.length > 0)

  return (
    <ListingShell>
      <ListingHero title="Collections" crumbs={[{ name: "Home", href: "/" }, { name: "Shop", href: "/shop/" }]} />
      {collections.length === 0 ? (
        <p className="border border-brand-graphite/15 p-10 text-center text-brand-olive">No collections yet. Browse everything in the shop.</p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {collections.map(({ collection, products }) => {
            const image = coverImage(collection.image, products)
            return (
              <li key={collection.id}>
                <Link href={collection.href} className="group relative block overflow-hidden bg-brand-graphite text-brand-bone">
                  <div className="aspect-[4/3] overflow-hidden">
                    {image && (
                      <Picture image={image} sizes="(min-width: 768px) 50vw, 100vw" className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                    <p className="font-hud text-[11px] text-brand-accent">
                      {products.length} {products.length === 1 ? "piece" : "pieces"}
                    </p>
                    <h2 className="display mt-2 text-4xl">{collection.name}</h2>
                    {collection.description && <p className="mt-2 max-w-md text-sm text-brand-bone/75">{collection.description}</p>}
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </ListingShell>
  )
}

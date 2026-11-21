import type { CatalogueProduct } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"
import { ProductCard } from "@/components/product/product-card"
import { SectionHeading } from "./section-heading"

/** Products marked Bestseller (or Featured) in the admin. */
export function BestSellers({ products }: { products: CatalogueProduct[] }) {
  return (
    <section aria-labelledby="home-bestsellers" className="border-t border-brand-graphite/10 bg-brand-bone py-20 text-brand-graphite md:py-28">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <Reveal>
          <SectionHeading id="home-bestsellers" eyebrow="Most ordered" title="Best sellers" href="/shop/" linkLabel="Shop all" />
        </Reveal>
        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-12 md:gap-x-6 lg:grid-cols-4">
          {products.map((product, i) => (
            <Reveal as="li" key={product.id} delay={(i % 4) * 0.06}>
              <ProductCard product={product} sizes="(min-width: 1024px) 24vw, 50vw" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}

import { Fragment } from "react"
import { Link } from "next-view-transitions"
import type { HomeSectionId } from "@dtc/catalogue-core"
import { ArrowIcon } from "@/components/ui/icons"
import { BestSellers } from "@/components/home/best-sellers"
import { CategoryTiles } from "@/components/home/category-tiles"
import { Collection } from "@/components/home/collection"
import { CollectionSpotlight } from "@/components/home/collection-spotlight"
import { Faq } from "@/components/home/faq"
import { FeaturedStory } from "@/components/home/featured-story"
import { HowToOrder } from "@/components/home/how-to-order"
import { Lookbook } from "@/components/home/lookbook"
import { Marquee } from "@/components/home/marquee"
import { PauseHero } from "@/components/home/pause-hero"
import { ProductRail } from "@/components/home/product-rail"
import { TrustStrip } from "@/components/home/trust-strip"
import { getCatalogue, getFeatured, getLookbook } from "@/lib/catalogue"
import { coverImage, productsBySlugs, productsInCategory } from "@/lib/store"

// The share image is src/app/opengraph-image.jpg: JPEG previews work in every chat app.
export const metadata = {
  alternates: { canonical: "/" },
}

const HOME_FAQ_LIMIT = 4

/**
 * The PAUSED hero, marquee and item inspect always open the page. The rest
 * follows the order and on/off switches set in the admin's Homepage screen.
 * A section with nothing to show is skipped.
 */
export default async function HomePage() {
  const catalogue = await getCatalogue()
  const featured = getFeatured(catalogue)
  const lookbook = getLookbook(catalogue)
  const phrases = ["Pause the game", "Keep your style", catalogue.settings.announcement].filter(Boolean)

  const newArrivals = productsBySlugs(catalogue, catalogue.autoCollections.new).slice(0, 10)
  const bestSellers = (() => {
    const marked = catalogue.products.filter((p) => p.badges.includes("bestseller"))
    return (marked.length >= 2 ? marked : catalogue.products.filter((p) => p.isFeatured || p.badges.includes("bestseller"))).slice(0, 8)
  })()
  const categoryTiles = catalogue.categoryTree.map((node) => ({
    id: node.id,
    name: node.name,
    href: node.href,
    count: node.productCount,
    image: coverImage(node.image, productsInCategory(catalogue, node.id)),
  }))
  const spotlight = (() => {
    const collection = catalogue.collections.find((c) => c.showOnHome && productsBySlugs(catalogue, c.productSlugs).length > 0)
    if (!collection) return null
    const products = productsBySlugs(catalogue, collection.productSlugs)
    return { collection, products, image: coverImage(collection.image, products) }
  })()

  const render: Record<HomeSectionId, () => React.ReactNode> = {
    categories: () => (categoryTiles.length >= 2 ? <CategoryTiles tiles={categoryTiles} /> : null),
    "new-arrivals": () =>
      newArrivals.length >= 2 ? <ProductRail id="home-new" eyebrow="Just dropped" title="New arrivals" href="/new/" products={newArrivals} /> : null,
    bestsellers: () => (bestSellers.length >= 2 ? <BestSellers products={bestSellers} /> : null),
    "shop-teaser": () => <Collection products={catalogue.products} />,
    "collection-spotlight": () => (spotlight ? <CollectionSpotlight {...spotlight} /> : null),
    lookbook: () => (lookbook.length >= 3 ? <Lookbook shots={lookbook} /> : null),
    trust: () => <TrustStrip settings={catalogue.settings} />,
    "how-to-order": () => <HowToOrder settings={catalogue.settings} />,
    faq: () => <Faq items={catalogue.settings.faq} limit={HOME_FAQ_LIMIT} moreHref="/faq/" />,
  }

  return (
    <>
      <PauseHero product={featured} settings={catalogue.settings} productCount={catalogue.products.length} />
      <Marquee phrases={phrases} />
      {featured && <FeaturedStory product={featured} />}
      {catalogue.homeSections
        .filter((section) => section.enabled)
        .map((section) => (
          <Fragment key={section.id}>{render[section.id]()}</Fragment>
        ))}
      <section aria-labelledby="home-custom-title" className="border-t border-white/10 bg-brand-graphite py-16 text-brand-bone md:py-20">
        <div className="mx-auto flex max-w-editorial flex-col gap-6 px-5 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-xl">
            <p className="font-hud text-[11px] text-brand-accent">Pre-order custom prints</p>
            <h2 id="home-custom-title" className="display mt-2 text-4xl md:text-5xl">
              Custom designs
            </h2>
            <p className="mt-3 text-sm text-brand-bone/75 md:text-base">
              Want your own graphic printed on an AFK THEORY tee or hoodie? Browse real custom pieces and share your idea on WhatsApp.
            </p>
          </div>
          <Link
            href="/custom-design/"
            className="btn-outline shrink-0 border-brand-accent text-brand-accent hover:border-brand-accent hover:bg-brand-accent hover:text-brand-graphite"
          >
            Explore custom designs <ArrowIcon />
          </Link>
        </div>
      </section>
    </>
  )
}

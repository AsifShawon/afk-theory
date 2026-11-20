import { Collection } from "@/components/home/collection"
import { Faq } from "@/components/home/faq"
import { FeaturedStory } from "@/components/home/featured-story"
import { HowToOrder } from "@/components/home/how-to-order"
import { Lookbook } from "@/components/home/lookbook"
import { Marquee } from "@/components/home/marquee"
import { PauseHero } from "@/components/home/pause-hero"
import { getCatalogue, getFeatured, getLookbook } from "@/lib/catalogue"

// The share image is src/app/opengraph-image.jpg: JPEG previews work in every chat app.
export const metadata = {
  alternates: { canonical: "/" },
}

export default async function HomePage() {
  const catalogue = await getCatalogue()
  const featured = getFeatured(catalogue)
  const lookbook = getLookbook(catalogue)
  const phrases = ["Pause the game", "Keep your style", catalogue.settings.announcement].filter(Boolean)

  return (
    <>
      <PauseHero product={featured} settings={catalogue.settings} productCount={catalogue.products.length} />
      <Marquee phrases={phrases} />
      {featured && <FeaturedStory product={featured} />}
      <Collection products={catalogue.products} categories={catalogue.categories} />
      {lookbook.length >= 3 && <Lookbook shots={lookbook} />}
      <HowToOrder settings={catalogue.settings} />
      <Faq items={catalogue.settings.faq} />
    </>
  )
}

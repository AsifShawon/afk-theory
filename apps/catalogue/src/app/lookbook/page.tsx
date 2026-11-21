import type { Metadata } from "next"
import { Link } from "next-view-transitions"
import { formatBdt } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"
import { Picture } from "@/components/ui/picture"
import { getCatalogue, getLookbook } from "@/lib/catalogue"

export const metadata: Metadata = {
  title: "Lookbook",
  description: "AFK THEORY, worn offline. Every on-model photo, each linked to the piece.",
  alternates: { canonical: "/lookbook/" },
}

export default async function LookbookPage() {
  const catalogue = await getCatalogue()
  const shots = getLookbook(catalogue, 60)

  return (
    <div className="mx-auto max-w-editorial px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <p className="font-hud text-[11px] text-brand-accent">Lookbook</p>
      <h1 className="display mt-3 text-6xl md:text-8xl">Worn offline</h1>
      {shots.length === 0 ? (
        <p className="mt-10 text-brand-bone/60">Photos are on the way.</p>
      ) : (
        <ul className="mt-12 columns-2 gap-4 md:columns-3 md:gap-6">
          {shots.map(({ image, product }, i) => (
            <Reveal as="li" key={image.id} delay={(i % 3) * 0.05} className="mb-4 break-inside-avoid md:mb-6">
              <Link href={`/products/${product.slug}/`} className="group block">
                <div className="overflow-hidden bg-brand-stone">
                  <Picture image={image} sizes="(min-width: 768px) 32vw, 50vw" className="h-auto w-full transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold leading-snug group-hover:text-brand-accent">{product.name}</p>
                  <p className="font-hud shrink-0 text-xs tracking-normal text-brand-bone/60">{formatBdt(product.priceBdt)}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      )}
    </div>
  )
}

import { Link } from "next-view-transitions"
import type { FaqItem } from "@dtc/catalogue-core"
import { Reveal } from "@/components/motion/reveal"

/** FAQ accordion. On the home page pass `limit` and `moreHref` to show a few with a link to the rest. */
export function Faq({ items, limit, moreHref, headingLevel = 2 }: { items: FaqItem[]; limit?: number; moreHref?: string; headingLevel?: 1 | 2 }) {
  if (items.length === 0) return null
  const shown = limit ? items.slice(0, limit) : items
  const Heading = headingLevel === 1 ? "h1" : "h2"
  return (
    <section id="faq" aria-labelledby="faq-title" className="border-t border-brand-graphite/15 bg-brand-bone pb-28 pt-24 text-brand-graphite">
      <div className="mx-auto grid max-w-editorial gap-12 px-5 md:grid-cols-[1fr_1.6fr] md:px-10">
        <Reveal>
          <Heading id="faq-title" className="display text-6xl md:text-7xl">
            FAQ
          </Heading>
          <p className="mt-4 max-w-xs text-brand-olive">Anything else? Ask in the same chat you order in.</p>
          {moreHref && items.length > shown.length && (
            <Link href={moreHref} className="font-hud mt-6 inline-block text-[11px] underline underline-offset-4">
              All {items.length} questions
            </Link>
          )}
        </Reveal>
        <Reveal as="div" className="divide-y divide-brand-graphite/15 border-y border-brand-graphite/15">
          {shown.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden className="relative h-4 w-4 shrink-0">
                  <span className="absolute left-0 top-1/2 h-0.5 w-4 -translate-y-1/2 bg-brand-graphite" />
                  <span className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-brand-graphite transition-transform duration-300 group-open:rotate-90 group-open:scale-0" />
                </span>
              </summary>
              <p className="max-w-2xl pb-6 text-brand-olive">{item.answer}</p>
            </details>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

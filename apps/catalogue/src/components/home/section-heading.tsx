import { Link } from "next-view-transitions"
import { clsx } from "clsx"
import { ArrowIcon } from "@/components/ui/icons"

/** Eyebrow, big title and an optional "view all" link, shared by home sections. */
export function SectionHeading({
  id,
  eyebrow,
  title,
  href,
  linkLabel = "View all",
  tone = "light",
}: {
  id: string
  eyebrow?: string
  title: string
  href?: string
  linkLabel?: string
  tone?: "light" | "dark"
}) {
  const dark = tone === "dark"
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className={clsx("font-hud text-[11px]", dark ? "text-brand-accent" : "text-brand-olive")}>{eyebrow}</p>}
        <h2 id={id} className="display mt-3 text-5xl md:text-7xl">
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={clsx(
            "font-hud inline-flex items-center gap-2 self-start text-[11px] underline-offset-4 hover:underline md:self-auto",
            dark ? "text-brand-bone" : "text-brand-graphite"
          )}
        >
          {linkLabel} <ArrowIcon size={14} />
        </Link>
      )}
    </div>
  )
}

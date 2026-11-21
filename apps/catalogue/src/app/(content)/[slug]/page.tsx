import type { Metadata } from "next"
import { Link } from "next-view-transitions"
import { notFound } from "next/navigation"
import { SITE_PAGE_SLUGS, type SitePageSlug } from "@dtc/catalogue-core"
import { getCatalogue } from "@/lib/catalogue"

export const dynamicParams = false

/** Static export needs at least one path; it renders as a 404 and is left out of the sitemap. */
const EMPTY_PLACEHOLDER = "__none"

const isPageSlug = (slug: string): slug is SitePageSlug => (SITE_PAGE_SLUGS as readonly string[]).includes(slug)

/** Only pages written in the admin get built: /about/, /delivery-returns/, /contact/, /privacy/, /terms/. */
export async function generateStaticParams() {
  const { pages } = await getCatalogue()
  const slugs = pages.map((p) => p.slug).filter(isPageSlug)
  return slugs.length > 0 ? slugs.map((slug) => ({ slug })) : [{ slug: EMPTY_PLACEHOLDER }]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const page = (await getCatalogue()).pages.find((p) => p.slug === slug)
  if (!page) return { robots: { index: false } }
  return {
    title: page.seoTitle ? { absolute: page.seoTitle } : page.title,
    description: page.seoDescription || undefined,
    alternates: { canonical: `/${page.slug}/` },
  }
}

export default async function ContentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const page = (await getCatalogue()).pages.find((p) => p.slug === slug)
  if (!page || !isPageSlug(page.slug)) notFound()

  const updated = page.updatedAt ? new Date(page.updatedAt) : null

  return (
    <article className="mx-auto max-w-3xl px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <nav aria-label="Breadcrumb" className="font-hud text-[11px] text-brand-bone/50">
        <Link href="/" className="hover:text-brand-accent">
          Home
        </Link>
        <span aria-hidden> / </span>
        <span className="text-brand-bone">{page.title}</span>
      </nav>
      <h1 className="display mt-6 text-5xl md:text-7xl">{page.title}</h1>
      {updated && !Number.isNaN(updated.getTime()) && (
        <p className="font-hud mt-4 text-[10px] text-brand-bone/40">
          Updated {updated.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      )}
      {page.html ? (
        // Sanitized at build time in @dtc/catalogue-core.
        <div className="rich-text mt-10 text-lg" dangerouslySetInnerHTML={{ __html: page.html }} />
      ) : (
        <p className="mt-10 text-brand-bone/60">This page is being written. Message us on WhatsApp or Messenger in the meantime.</p>
      )}
    </article>
  )
}

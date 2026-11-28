import type { Metadata } from "next"
import type { CatalogueCustomDesign, CatalogueImage } from "@dtc/catalogue-core"
import { CustomGalleryShowcase } from "@/components/custom/custom-gallery-showcase"
import { CustomHeroSlider, type HeroSlide } from "@/components/custom/custom-hero-slider"
import { MissingWhatsappFallback, WhatsAppChatLink } from "@/components/custom/whatsapp-chat-link"
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld"
import { WhatsAppIcon } from "@/components/ui/icons"
import { absoluteUrl, getCatalogue, getFeatured } from "@/lib/catalogue"
import { buildCustomDesignMessage, messengerUrl, whatsappUrl } from "@/lib/order-message"

const AMBIENT_BACKGROUNDS = ["#15221B", "#1B1E23", "#20241F", "#211D18"] as const

function pickBackdropTone(title: string, index: number): string {
  const lower = title.toLowerCase()
  if (lower.includes("forest") || lower.includes("green") || lower.includes("olive")) return "#15221B"
  if (lower.includes("audi") || lower.includes("charcoal") || lower.includes("black") || lower.includes("slate")) return "#1A1D22"
  if (lower.includes("red") || lower.includes("crimson") || lower.includes("burgundy")) return "#241719"
  if (lower.includes("navy") || lower.includes("blue") || lower.includes("cobalt")) return "#161E28"
  return AMBIENT_BACKGROUNDS[index % AMBIENT_BACKGROUNDS.length]
}

function buildHeroSlides(designs: CatalogueCustomDesign[], fallbackGarment: CatalogueImage | null): HeroSlide[] {
  if (designs.length > 0) {
    const featured = designs.find((d) => d.isFeatured)
    const ordered = featured ? [featured, ...designs.filter((d) => d.id !== featured.id)] : designs
    return ordered.map((d, i) => ({
      id: d.id,
      title: d.title,
      garmentType: d.garmentType,
      isCustomPiece: true,
      image: d.image,
      backdropColor: pickBackdropTone(`${d.title} ${d.garmentType}`, i),
    }))
  }
  if (fallbackGarment) {
    return [
      {
        id: "base-silhouette",
        title: "AFK THEORY base garment silhouette",
        garmentType: "Heavyweight blank",
        isCustomPiece: false,
        image: fallbackGarment,
        backdropColor: "#20241F",
      },
    ]
  }
  return []
}

const PAGE_TITLE = "Custom designs"
const PAGE_DESCRIPTION =
  "See custom garments we have made at AFK THEORY, understand the 20% pre-order advance, and share your own design on WhatsApp."

const STEPS = [
  "Send your artwork or reference, garment type, size, and print placement.",
  "We confirm the design, price, and timing in WhatsApp.",
  "Pay the 20% base-product advance to confirm the pre-order.",
] as const

function pickLeadDesign(designs: CatalogueCustomDesign[]): CatalogueCustomDesign | null {
  if (designs.length === 0) return null
  return designs.find((d) => d.isFeatured) ?? designs[0]
}

function pickFallbackGarment(product: ReturnType<typeof getFeatured>): CatalogueImage | null {
  if (!product || product.images.length === 0) return null
  return (
    product.images.find((i) => i.role === "back") ??
    product.images.find((i) => i.role === "front") ??
    product.images[0]
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const catalogue = await getCatalogue()
  const lead = pickLeadDesign(catalogue.customDesigns)
  const shareImage = lead?.image
  const largest = shareImage?.sources[shareImage.sources.length - 1]
  const ogImage =
    shareImage && largest
      ? {
          url: absoluteUrl(largest.src),
          width: largest.width,
          height: Math.round((largest.width * shareImage.height) / shareImage.width),
          alt: shareImage.alt,
        }
      : {
          url: absoluteUrl("/opengraph-image.jpg"),
          width: 2172,
          height: 724,
          alt: "AFK THEORY",
        }

  return {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: "/custom-design/" },
    openGraph: {
      title: `${PAGE_TITLE} | AFK THEORY`,
      description: PAGE_DESCRIPTION,
      url: "/custom-design/",
      images: [ogImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${PAGE_TITLE} | AFK THEORY`,
      description: PAGE_DESCRIPTION,
      images: [ogImage.url],
    },
  }
}

export default async function CustomDesignPage() {
  const catalogue = await getCatalogue()
  const designs = catalogue.customDesigns
  const fallbackGarment = designs.length > 0 ? null : pickFallbackGarment(getFeatured(catalogue))
  const heroSlides = buildHeroSlides(designs, fallbackGarment)

  const whatsappNumber = catalogue.settings.whatsappNumber
  const generalWaHref = whatsappUrl(whatsappNumber, buildCustomDesignMessage())
  const messengerHref = messengerUrl(catalogue.settings.messengerPage, "custom-design")
  const hasContactPage = catalogue.pages.some((p) => p.slug === "contact")

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", href: "/" }, { name: "Custom designs", href: "/custom-design/" }])} />

      <CustomHeroSlider
        slides={heroSlides}
        generalWaHref={generalWaHref}
        messengerHref={messengerHref}
        hasContactPage={hasContactPage}
      />

      <CustomGalleryShowcase designs={designs} whatsappNumber={whatsappNumber} />

      <section aria-labelledby="custom-steps-title" className="border-t border-white/10 bg-brand-graphite py-16 text-brand-bone md:py-24">
        <div className="mx-auto max-w-editorial px-5 md:px-10">
          <div className="max-w-2xl">
            <p className="font-hud text-[11px] text-brand-accent">Pre-order process</p>
            <h2 id="custom-steps-title" className="display mt-2 text-4xl sm:text-5xl md:text-7xl">
              How custom orders work
            </h2>
          </div>

          <ol className="mt-10 grid gap-px bg-white/15 md:grid-cols-3">
            {STEPS.map((text, i) => (
              <li key={text} className="flex flex-col bg-brand-graphite p-6 md:p-8">
                <span className="display text-5xl text-brand-accent md:text-6xl" aria-hidden>
                  0{i + 1}
                </span>
                <p className="mt-5 text-base leading-relaxed text-brand-bone/90">{text}</p>
              </li>
            ))}
          </ol>

          <p className="mt-6 max-w-2xl text-xs leading-relaxed text-brand-bone/65 md:text-sm">
            Custom orders require a 20% advance on the confirmed base product price (for example, a ৳900 base product requires a ৳180 advance). Final
            pricing and timeline are confirmed directly with you on WhatsApp before any payment is taken.
          </p>

          <div className="mt-8">
            {generalWaHref ? (
              <>
                <WhatsAppChatLink href={generalWaHref} className="btn-signal h-14 w-full px-7 text-sm sm:w-auto">
                  <WhatsAppIcon size={18} /> Share your design on WhatsApp
                </WhatsAppChatLink>
                <p className="mt-2.5 text-xs text-brand-bone/65">Open the chat and attach your design or reference image there.</p>
              </>
            ) : (
              <MissingWhatsappFallback messengerHref={messengerHref} hasContactPage={hasContactPage} />
            )}
          </div>
        </div>
      </section>
    </>
  )
}

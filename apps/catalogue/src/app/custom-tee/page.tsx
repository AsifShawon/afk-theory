import type { Metadata } from "next"
import { CUSTOM_GARMENTS, CUSTOM_TEE_CONFIG, type CatalogueProduct } from "@dtc/catalogue-core"
import { CustomDtfView } from "@/components/product/custom-hoodie-view"
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"

const FALLBACK_TEE: CatalogueProduct = {
  id: "custom-dtf-tee-fallback",
  slug: CUSTOM_TEE_CONFIG.customProductSlug,
  name: CUSTOM_TEE_CONFIG.customProductName,
  tagline: "Heavyweight 240+ GSM drop-shoulder tee. Custom DTF printed.",
  description: "240+ GSM Rib Fabric drop-shoulder tee with custom DTF print placement.",
  descriptionHtml: "",
  seoTitle: "Custom DTF Drop-Shoulder Tee | AFK THEORY",
  seoDescription: "Configure your Custom DTF Drop-Shoulder Tee print placements, dimensions, and live price from AFK THEORY.",
  priceBdt: CUSTOM_TEE_CONFIG.customBasePriceBdt,
  compareAtBdt: null,
  category: {
    id: "drop-shoulder-tees",
    slug: "drop-shoulder-tees",
    name: "Drop-Shoulder Tees",
    parentId: null,
    trail: ["drop-shoulder-tees"],
    href: "/c/drop-shoulder-tees/",
  },
  isFeatured: false,
  sizes: ["M", "L", "XL", "XXL"],
  soldOutSizes: [],
  details: {
    fabric: "Rib Fabric (Cotton Blend)",
    gsm: "240+",
    fit: "Drop Shoulder",
    origin: "Made in Bangladesh",
    care: "Wash inside out in cold water. Do not iron directly over printed designs.",
  },
  sizeChart: { columns: [], rows: [] },
  colors: [
    { id: "charcoal-grey", name: "Charcoal Grey", hex: "#3D4243", inStock: true },
    { id: "bottle-green", name: "Bottle Green", hex: "#3F5741", inStock: true },
    { id: "maroon", name: "Maroon", hex: "#77203F", inStock: true },
  ],
  designs: [],
  images: [],
  soldOut: false,
  createdAt: "2026-11-29T00:00:00.000Z",
  isNew: true,
  badges: ["new"],
  collectionSlugs: [],
  moreDesigns: [],
  metaContentId: null,
}

export async function generateMetadata(): Promise<Metadata> {
  const catalogue = await getCatalogue()
  const base = catalogue.products.find((p) => p.slug === CUSTOM_TEE_CONFIG.baseProductSlug)
  const image = base?.images[0]
  const largest = image?.sources[image.sources.length - 1]
  const title = "Custom DTF Drop-Shoulder Tee"
  const description =
    "Build and price your Custom DTF Drop-Shoulder Tee. Pick Charcoal Grey, Bottle Green, or Maroon, choose print placements and sizes, and order cash on delivery or via WhatsApp."

  return {
    title,
    description,
    alternates: { canonical: "/custom-tee/" },
    openGraph: {
      title: `${title} | AFK THEORY`,
      description,
      url: "/custom-tee/",
      images:
        image && largest
          ? [{ url: absoluteUrl(largest.src), width: largest.width, height: Math.round((largest.width * image.height) / image.width), alt: image.alt }]
          : [{ url: absoluteUrl("/opengraph-image.jpg"), width: 2172, height: 724, alt: "AFK THEORY" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | AFK THEORY`,
      description,
      images: [largest ? absoluteUrl(largest.src) : absoluteUrl("/opengraph-image.jpg")],
    },
  }
}

export default async function CustomTeePage() {
  const catalogue = await getCatalogue()
  const base = catalogue.products.find((p) => p.slug === CUSTOM_TEE_CONFIG.baseProductSlug)
  const product: CatalogueProduct = base
    ? {
        ...base,
        name: CUSTOM_TEE_CONFIG.customProductName,
        priceBdt: CUSTOM_TEE_CONFIG.customBasePriceBdt,
        compareAtBdt: null,
      }
    : FALLBACK_TEE

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Custom designs", href: "/custom-design/" },
          { name: "Custom DTF Drop-Shoulder Tee", href: "/custom-tee/" },
        ])}
      />
      <CustomDtfView
        product={product}
        settings={catalogue.settings}
        garment={CUSTOM_GARMENTS[CUSTOM_TEE_CONFIG.customProductSlug]}
      />
    </>
  )
}

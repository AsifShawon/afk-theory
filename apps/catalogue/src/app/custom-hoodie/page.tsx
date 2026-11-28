import type { Metadata } from "next"
import { CUSTOM_HOODIE_CONFIG, type CatalogueProduct } from "@dtc/catalogue-core"
import { CustomHoodieView } from "@/components/product/custom-hoodie-view"
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"

const FALLBACK_HOODIE: CatalogueProduct = {
  id: "custom-dtf-hoodie-fallback",
  slug: CUSTOM_HOODIE_CONFIG.customProductSlug,
  name: CUSTOM_HOODIE_CONFIG.customProductName,
  tagline: "Heavyweight comfort. Custom printed.",
  description: "Oversized 380+ GSM drop-shoulder fleece hoodie with custom DTF print placement.",
  descriptionHtml: "",
  seoTitle: "Custom DTF Hoodie | AFK THEORY",
  seoDescription: "Configure your Custom DTF Hoodie print placements, dimensions, and live price from AFK THEORY.",
  priceBdt: CUSTOM_HOODIE_CONFIG.customBasePriceBdt,
  compareAtBdt: null,
  category: { id: "hoodies", slug: "hoodies", name: "Hoodies", parentId: null, trail: ["hoodies"], href: "/c/hoodies/" },
  isFeatured: false,
  sizes: ["M", "L", "XL"],
  soldOutSizes: [],
  details: {
    fabric: "Fleece (One Side Brush)",
    gsm: "380+",
    fit: "Oversized with dropped shoulders",
    origin: "Made in Bangladesh",
    care: "Wash inside out in cold water. Do not iron directly over printed designs.",
  },
  sizeChart: { columns: [], rows: [] },
  colors: [
    { id: "black", name: "Black", hex: "#1C1C1C", inStock: true },
    { id: "lavender", name: "Lavender", hex: "#D1B1EC", inStock: true },
    { id: "whitish-grey", name: "Whitish Grey", hex: "#CBCBCB", inStock: true },
  ],
  designs: [],
  images: [],
  soldOut: false,
  createdAt: "2026-11-28T00:00:00.000Z",
  isNew: true,
  badges: ["new"],
  collectionSlugs: [],
  moreDesigns: [],
  metaContentId: null,
}

export async function generateMetadata(): Promise<Metadata> {
  const catalogue = await getCatalogue()
  const base = catalogue.products.find((p) => p.slug === CUSTOM_HOODIE_CONFIG.baseProductSlug)
  const image = base?.images[0]
  const largest = image?.sources[image.sources.length - 1]
  const title = "Custom DTF Hoodie"
  const description =
    "Build and price your Custom DTF Drop-Shoulder Hoodie. Pick Black, Lavender, or Whitish Grey, choose print placements and sizes, and order cash on delivery or via WhatsApp."

  return {
    title,
    description,
    alternates: { canonical: "/custom-hoodie/" },
    openGraph: {
      title: `${title} | AFK THEORY`,
      description,
      url: "/custom-hoodie/",
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

export default async function CustomHoodiePage() {
  const catalogue = await getCatalogue()
  const base = catalogue.products.find((p) => p.slug === CUSTOM_HOODIE_CONFIG.baseProductSlug)
  const product: CatalogueProduct = base
    ? {
        ...base,
        name: CUSTOM_HOODIE_CONFIG.customProductName,
        priceBdt: CUSTOM_HOODIE_CONFIG.customBasePriceBdt,
        compareAtBdt: null,
      }
    : FALLBACK_HOODIE

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", href: "/" },
          { name: "Custom designs", href: "/custom-design/" },
          { name: "Custom DTF Hoodie", href: "/custom-hoodie/" },
        ])}
      />
      <CustomHoodieView product={product} settings={catalogue.settings} />
    </>
  )
}

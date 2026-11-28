import { DEFAULT_SETTINGS, DEFAULT_SIZES } from "../constants"
import type {
  CategoryRow,
  CollectionRow,
  ImageRole,
  ProductCollectionRow,
  ProductColorRow,
  ProductDetails,
  ProductImageRow,
  ProductRow,
  RawCatalogue,
  SiteSettings,
  SizeChart,
} from "../types"

/**
 * Starter content. The admin seed script writes it to Supabase, and the
 * public site renders it when no Supabase project is configured (local
 * development and CI).
 *
 * Image files live in `packages/catalogue-core/seed-media/`.
 */

export const SEED_MEDIA_DIR = "seed-media"

export interface SeedImage {
  file: string
  role: ImageRole
  alt: string
  /** Name of the seed color this image shows, or null for any color. */
  color: string | null
}

export interface SeedProduct {
  slug: string
  name: string
  tagline: string
  description: string
  priceBdt: number
  compareAtBdt: number | null
  categorySlug: string
  isFeatured: boolean
  sizes: string[]
  soldOutSizes: string[]
  details: ProductDetails
  sizeChart: SizeChart
  colors: { name: string; hex: string; inStock: boolean }[]
  images: SeedImage[]
}

export const SEED_CATEGORIES = [{ slug: "t-shirts", name: "T-Shirts" }]

/** Collections cut across categories. Product slugs are in display order. */
export const SEED_COLLECTIONS = [
  {
    slug: "drop-01",
    name: "Drop 01",
    description: "The first AFK THEORY drop.",
    productSlugs: ["drop-01-oversized-tee"],
  },
]

export const SEED_PRODUCTS: SeedProduct[] = [
  {
    slug: "drop-01-oversized-tee",
    name: "Drop 01 Oversized Tee",
    tagline: "The foundational AFK THEORY silhouette.",
    description:
      "Dropped shoulder seams, a wide chest, a rib-knit collar that holds its shape and a boxy drape. The chartreuse AFK THEORY mark sits small on the chest. Built for days spent offline.",
    // Placeholder price carried over from the Medusa draft fixture. Confirm before launch.
    priceBdt: 1450,
    compareAtBdt: null,
    categorySlug: "t-shirts",
    isFeatured: true,
    sizes: DEFAULT_SIZES,
    soldOutSizes: [],
    details: {
      fabric: "100% combed heavyweight cotton",
      fit: "Oversized with dropped shoulders",
      care: "Wash cold inside out with like colors. Dry flat in shade. Do not iron over the print.",
      origin: "Made in Bangladesh",
    },
    sizeChart: { columns: [], rows: [] },
    colors: [
      { name: "Graphite Black", hex: "#20241F", inStock: true },
      { name: "Bone White", hex: "#F5F3ED", inStock: false },
      { name: "Electric Chartreuse", hex: "#D8F452", inStock: false },
    ],
    images: [
      {
        file: "drop-01-tee-front.webp",
        role: "front",
        alt: "Drop 01 Oversized Tee in Graphite Black, front view",
        color: "Graphite Black",
      },
      {
        file: "drop-01-tee-model-studio.webp",
        role: "model",
        alt: "Model wearing the Drop 01 Oversized Tee in Graphite Black",
        color: "Graphite Black",
      },
      {
        file: "drop-01-tee-back.webp",
        role: "back",
        alt: "Drop 01 Oversized Tee in Graphite Black, back view",
        color: "Graphite Black",
      },
      {
        file: "drop-01-tee-model-street.webp",
        role: "model",
        alt: "Model wearing the Drop 01 Oversized Tee on concrete stairs",
        color: "Graphite Black",
      },
      {
        file: "drop-01-tee-model-seated.webp",
        role: "model",
        alt: "Seated model in the Drop 01 Oversized Tee",
        color: "Graphite Black",
      },
    ],
  },
]

/** Seed images are 1122 x 1402 webp files. */
export const SEED_IMAGE_SIZE = { width: 1122, height: 1402 }

export const SEED_SETTINGS: SiteSettings = DEFAULT_SETTINGS

/** Storage-style path used for seed images in the fixture catalogue. */
export function seedImagePath(file: string): string {
  return `seed/${file.replace(/\.webp$/, "")}`
}

function fixtureId(kind: number, index: number): string {
  const hex = (kind * 1000 + index).toString(16).padStart(12, "0")
  return `00000000-0000-4000-8000-${hex}`
}

/**
 * The seed expressed as database rows, so the site can run the same
 * `buildCatalogue` code path without a Supabase project.
 */
export function seedToRawCatalogue(): RawCatalogue {
  const now = new Date(0).toISOString()
  const categories: CategoryRow[] = SEED_CATEGORIES.map((c, i) => ({
    id: fixtureId(1, i),
    slug: c.slug,
    name: c.name,
    sort_order: i,
  }))
  const products: ProductRow[] = []
  const colors: ProductColorRow[] = []
  const images: ProductImageRow[] = []

  SEED_PRODUCTS.forEach((p, pi) => {
    const productId = fixtureId(2, pi)
    products.push({
      id: productId,
      slug: p.slug,
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      price_bdt: p.priceBdt,
      compare_at_bdt: p.compareAtBdt,
      category_id: categories.find((c) => c.slug === p.categorySlug)?.id ?? null,
      status: "published",
      is_featured: p.isFeatured,
      sort_order: pi,
      sizes: p.sizes,
      sold_out_sizes: p.soldOutSizes,
      details: p.details,
      size_chart: p.sizeChart,
      created_at: now,
      updated_at: now,
    })
    p.colors.forEach((c, ci) => {
      colors.push({
        id: fixtureId(3, pi * 100 + ci),
        product_id: productId,
        name: c.name,
        hex: c.hex,
        in_stock: c.inStock,
        sort_order: ci,
      })
    })
    p.images.forEach((img, ii) => {
      images.push({
        id: fixtureId(4, pi * 100 + ii),
        product_id: productId,
        color_id: colors.find((c) => c.product_id === productId && c.name === img.color)?.id ?? null,
        path: seedImagePath(img.file),
        widths: [SEED_IMAGE_SIZE.width],
        width: SEED_IMAGE_SIZE.width,
        height: SEED_IMAGE_SIZE.height,
        alt: img.alt,
        role: img.role,
        sort_order: ii,
      })
    })
  })

  const collections: CollectionRow[] = SEED_COLLECTIONS.map((c, i) => ({
    id: fixtureId(5, i),
    slug: c.slug,
    name: c.name,
    description: c.description,
    image_path: null,
    image_widths: [],
    image_width: null,
    image_height: null,
    show_on_home: true,
    sort_order: i,
    seo_title: "",
    seo_description: "",
    created_at: now,
    updated_at: now,
  }))
  const productCollections: ProductCollectionRow[] = SEED_COLLECTIONS.flatMap((c, ci) =>
    c.productSlugs.flatMap((slug, pi) => {
      const product = products.find((p) => p.slug === slug)
      return product ? [{ product_id: product.id, collection_id: collections[ci].id, sort_order: pi }] : []
    })
  )

  return {
    categories,
    products,
    colors,
    images,
    collections,
    productCollections,
    menuProducts: [],
    designs: [],
    pages: [],
    customDesigns: [],
    sizeGuides: [],
    settings: {
      id: 1,
      whatsapp_number: SEED_SETTINGS.whatsappNumber,
      messenger_page: SEED_SETTINGS.messengerPage,
      instagram_handle: SEED_SETTINGS.instagramHandle,
      hero_title: SEED_SETTINGS.heroTitle,
      hero_subtitle: SEED_SETTINGS.heroSubtitle,
      announcement: SEED_SETTINGS.announcement,
      delivery_zones: SEED_SETTINGS.deliveryZones,
      faq: SEED_SETTINGS.faq,
      published_at: null,
      updated_at: now,
    },
  }
}

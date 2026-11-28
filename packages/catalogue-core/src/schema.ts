import { z } from "zod"
import { HOME_SECTION_IDS, IMAGE_ROLES, PRODUCT_BADGE_SETTINGS, PRODUCT_STATUSES, SITE_PAGE_SLUGS } from "./types"
import { MENU_PRODUCT_LIMIT } from "./menu"
import { SLUG_PATTERN } from "./format"

const shortText = (max: number, message?: string) => z.string().trim().max(max, message)

export const productDetailsSchema = z.object({
  fabric: shortText(200).optional(),
  gsm: shortText(40).optional(),
  fit: shortText(200).optional(),
  care: shortText(600).optional(),
  origin: shortText(120).optional(),
})

export const sizeChartSchema = z.object({
  columns: z.array(shortText(40).min(1)).max(8),
  rows: z
    .array(
      z.object({
        size: shortText(12).min(1),
        values: z.array(shortText(20)).max(8),
      })
    )
    .max(12),
  unit: shortText(20).optional(),
  note: shortText(200).optional(),
})

export const sizeGuideInputSchema = z.object({
  name: shortText(60).min(1, "Give the guide a name, e.g. Oversized tee"),
  unit: shortText(20),
  columns: z.array(shortText(40).min(1, "Column names cannot be empty")).min(1, "Add at least one measurement").max(8),
  rows: z
    .array(
      z.object({
        size: shortText(12).min(1, "Every row needs a size"),
        values: z.array(shortText(20)).max(8),
      })
    )
    .min(1, "Add at least one size")
    .max(12),
  note: shortText(200),
})

export type SizeGuideInput = z.infer<typeof sizeGuideInputSchema>

export const productInputSchema = z
  .object({
    name: shortText(120).min(1, "Name is required"),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(80)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
    tagline: shortText(160),
    // Formatted HTML from the editor. Sanitized again when the site is built.
    description: shortText(20000),
    seoTitle: shortText(70, "Keep the search title under 70 characters"),
    seoDescription: shortText(200, "Keep the search description under 200 characters"),
    sizeGuideId: z.string().uuid().nullable(),
    priceBdt: z.coerce.number().int().min(0).max(1_000_000),
    compareAtBdt: z.coerce.number().int().min(0).max(1_000_000).nullable(),
    categoryId: z.string().uuid().nullable(),
    status: z.enum(PRODUCT_STATUSES),
    isFeatured: z.boolean(),
    sizes: z.array(shortText(12).min(1)).min(1, "Add at least one size").max(12),
    soldOutSizes: z.array(shortText(12)).max(12),
    details: productDetailsSchema,
    sizeChart: sizeChartSchema,
    // Store structure fields (migration 20261122000000). Defaults keep older callers valid.
    badge: z.enum(PRODUCT_BADGE_SETTINGS).default("none"),
    designGroup: shortText(60, "Keep the design group under 60 characters").default(""),
    collectionIds: z.array(z.string().uuid()).max(20).default([]),
    // Optional Meta Catalog Content ID (migration 20261124000000).
    metaContentId: shortText(100, "Keep Meta Content ID under 100 characters")
      .regex(/^[A-Za-z0-9_.:-]*$/, "Use letters, numbers, dashes, underscores, dots or colons")
      .default(""),
  })
  .refine((p) => p.compareAtBdt === null || p.compareAtBdt > p.priceBdt, {
    message: "Compare-at price must be higher than the price",
    path: ["compareAtBdt"],
  })

export type ProductInput = z.infer<typeof productInputSchema>

export const colorInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: shortText(40).min(1, "Color name is required"),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #20241F"),
  inStock: z.boolean(),
})

export type ColorInput = z.infer<typeof colorInputSchema>

export const designInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: shortText(40).min(1, "Design name is required"),
  inStock: z.boolean(),
})

export type DesignInput = z.infer<typeof designInputSchema>

export const imageUpdateSchema = z.object({
  id: z.string().uuid(),
  colorId: z.string().uuid().nullable(),
  /** Left out while the store structure migration has not run. */
  designId: z.string().uuid().nullable().optional(),
  role: z.enum(IMAGE_ROLES),
  alt: shortText(200),
})

export type ImageUpdateInput = z.infer<typeof imageUpdateSchema>

/** Fields after slug need migration 20261122000000 and are optional until then. */
export const categoryInputSchema = z.object({
  name: shortText(60).min(1, "Category name is required"),
  slug: z.string().trim().min(1, "Slug is required").max(60).regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
  parentId: z.string().uuid().nullable().optional(),
  description: shortText(600, "Keep the description under 600 characters").optional(),
  showInMenu: z.boolean().optional(),
  seoTitle: shortText(70, "Keep the search title under 70 characters").optional(),
  seoDescription: shortText(200, "Keep the search description under 200 characters").optional(),
})

export type CategoryInput = z.infer<typeof categoryInputSchema>

export const menuProductsSchema = z
  .array(z.string().uuid())
  .max(MENU_PRODUCT_LIMIT, `Pick at most ${MENU_PRODUCT_LIMIT} products for the menu`)
  .refine((ids) => new Set(ids).size === ids.length, "Each product can be picked once")

export const collectionInputSchema = z.object({
  name: shortText(80).min(1, "Collection name is required"),
  slug: z.string().trim().min(1, "Slug is required").max(60).regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
  description: shortText(600, "Keep the description under 600 characters"),
  showOnHome: z.boolean(),
  seoTitle: shortText(70, "Keep the search title under 70 characters"),
  seoDescription: shortText(200, "Keep the search description under 200 characters"),
  /** In display order. */
  productIds: z
    .array(z.string().uuid())
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, "Each product can be added once"),
})

export type CollectionInput = z.infer<typeof collectionInputSchema>

export const sitePageInputSchema = z.object({
  slug: z.enum(SITE_PAGE_SLUGS),
  title: shortText(120).min(1, "Page title is required"),
  // Formatted HTML from the editor. Sanitized again when the site is built.
  html: shortText(60000, "This page is too long"),
  seoTitle: shortText(70, "Keep the search title under 70 characters"),
  seoDescription: shortText(200, "Keep the search description under 200 characters"),
})

export type SitePageInput = z.infer<typeof sitePageInputSchema>

export const customDesignInputSchema = z.object({
  title: shortText(120).min(1, "Title is required"),
  garmentType: shortText(80).min(1, "Garment type is required"),
  status: z.enum(PRODUCT_STATUSES),
  isFeatured: z.boolean(),
  imageAlt: shortText(200, "Keep the main photo alt text under 200 characters"),
  detailImageAlt: shortText(200, "Keep the detail photo alt text under 200 characters"),
})

export type CustomDesignInput = z.infer<typeof customDesignInputSchema>

export const homeSectionsInputSchema = z
  .array(z.object({ id: z.enum(HOME_SECTION_IDS), enabled: z.boolean() }))
  .max(HOME_SECTION_IDS.length)
  .refine((list) => new Set(list.map((s) => s.id)).size === list.length, "Each section can appear once")

export const settingsInputSchema = z.object({
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^(\d{8,15})?$/, "Digits only, with country code (for example 8801712345678)"),
  messengerPage: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9.]{0,80}$/, "Page username only, for example afktheory"),
  instagramHandle: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9._]{0,30}$/, "Handle only, without @"),
  heroTitle: shortText(120).min(1),
  heroSubtitle: shortText(300),
  announcement: shortText(160),
  deliveryZones: z
    .array(
      z.object({
        name: shortText(40).min(1),
        area: shortText(200),
        feeBdt: z.coerce.number().int().min(0).max(10_000),
        eta: shortText(40),
      })
    )
    .max(6),
  faq: z
    .array(
      z.object({
        question: shortText(200).min(1),
        answer: shortText(1200).min(1),
      })
    )
    .max(20),
})

export type SettingsInput = z.infer<typeof settingsInputSchema>

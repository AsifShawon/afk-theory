import { z } from "zod"
import { IMAGE_ROLES, PRODUCT_STATUSES } from "./types"
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

export const imageUpdateSchema = z.object({
  id: z.string().uuid(),
  colorId: z.string().uuid().nullable(),
  role: z.enum(IMAGE_ROLES),
  alt: shortText(200),
})

export type ImageUpdateInput = z.infer<typeof imageUpdateSchema>

export const categoryInputSchema = z.object({
  name: shortText(60).min(1, "Category name is required"),
  slug: z.string().trim().min(1).max(60).regex(SLUG_PATTERN, "Use lowercase letters, numbers and dashes"),
})

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

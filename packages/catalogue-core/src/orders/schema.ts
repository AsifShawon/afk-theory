import { z } from "zod"
import { BANGLADESH_DISTRICTS, findBangladeshDistrict, isValidBangladeshPhone, normalizeBangladeshPhone } from "@dtc/commerce-contracts"

/** Most of one variant a customer can order at once. */
export const MAX_LINE_QUANTITY = 10
/** Most different variants in one order. */
export const MAX_ORDER_LINES = 20

/** The 64 districts, sorted by name, for the checkout dropdown. */
export const CHECKOUT_DISTRICTS: string[] = BANGLADESH_DISTRICTS.map((d) => d.name).sort((a, b) => a.localeCompare(b))

/**
 * "+880 1712-345678", "8801712345678", "1712345678" and "01712345678" all
 * become "01712345678". Returns null for anything that is not a Bangladeshi
 * mobile number.
 */
export function normalizeCheckoutPhone(raw: string): string | null {
  let value = raw.replace(/[^\d+]/g, "")
  if (/^1[3-9]\d{8}$/.test(value)) value = `0${value}`
  if (!isValidBangladeshPhone(value)) return null
  const local = normalizeBangladeshPhone(value)
  return /^01[3-9]\d{8}$/.test(local) ? local : null
}

/** Removes control characters and trims, so pasted text cannot break emails or the courier slip. */
function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim()
}

/** Single line: also folds newlines and runs of spaces. */
function cleanLine(value: string): string {
  return cleanText(value).replace(/\s+/g, " ")
}

const line = (min: number, max: number, label: string) =>
  z
    .string()
    .transform(cleanLine)
    .pipe(
      z
        .string()
        .min(min, min === 1 ? `Enter your ${label}` : `${label[0].toUpperCase()}${label.slice(1)} is too short`)
        .max(max, `${label[0].toUpperCase()}${label.slice(1)} is too long (${max} characters at most)`)
    )

const optionName = z
  .string()
  .max(60)
  .transform(cleanLine)
  .nullable()
  .optional()
  .transform((v) => v || null)

export const checkoutLineSchema = z.object({
  slug: z.string().min(1).max(80),
  /** Product name as the customer saw it. Only used in the emergency email when prices cannot be checked. */
  name: z.string().max(120).transform(cleanLine).optional(),
  color: optionName,
  design: optionName,
  size: optionName,
  quantity: z.number().int().min(1).max(MAX_LINE_QUANTITY),
  /** The price the customer saw. Only used to warn when it changed; never charged. */
  unitPriceBdt: z.number().int().min(0),
})

export const checkoutCustomerSchema = z.object({
  name: line(2, 80, "name"),
  phone: z
    .string()
    .max(30)
    .refine((v) => normalizeCheckoutPhone(v) !== null, "Enter a Bangladeshi mobile number, for example 01712345678")
    .transform((v) => normalizeCheckoutPhone(v)!),
  email: z
    .string()
    .max(254)
    .transform(cleanLine)
    .pipe(z.union([z.literal(""), z.string().email("Enter a valid email or leave it empty")]))
    .optional()
    .transform((v) => (v ? v.toLowerCase() : null)),
  district: z
    .string()
    .max(40)
    .refine((v) => findBangladeshDistrict(v) !== null, "Choose your district")
    .transform((v) => findBangladeshDistrict(v)!.name),
  address: z
    .string()
    .transform(cleanText)
    .pipe(z.string().min(8, "Add your house, road and area so the courier can find you").max(300, "Address is too long (300 characters at most)")),
  note: z
    .string()
    .transform(cleanText)
    .pipe(z.string().max(500, "Note is too long (500 characters at most)"))
    .optional()
    .transform((v) => v ?? ""),
})

export const checkoutInputSchema = z.object({
  /** Made once per checkout page visit; the same key always means the same order. */
  idempotencyKey: z.string().regex(/^[A-Za-z0-9_-]{16,80}$/),
  customer: checkoutCustomerSchema,
  lines: z.array(checkoutLineSchema).min(1, "Your cart is empty").max(MAX_ORDER_LINES, `At most ${MAX_ORDER_LINES} different items per order`),
  /** Hidden field people never see. Bots fill it in. */
  website: z.string().max(0).optional(),
})

export type CheckoutLineInput = z.input<typeof checkoutLineSchema>
export type CheckoutLine = z.output<typeof checkoutLineSchema>
export type CheckoutCustomer = z.output<typeof checkoutCustomerSchema>
export type CheckoutInput = z.output<typeof checkoutInputSchema>

/** Field name ("customer.phone", "lines") to the first message for it. */
export type CheckoutFieldErrors = Record<string, string>

export function checkoutFieldErrors(error: z.ZodError): CheckoutFieldErrors {
  const out: CheckoutFieldErrors = {}
  for (const issue of error.issues) {
    const key = issue.path[0] === "lines" ? "lines" : issue.path.join(".")
    if (!out[key]) out[key] = issue.message
  }
  return out
}

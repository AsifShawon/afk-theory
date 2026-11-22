import { formatBdtPlain, normalizeMessengerPage, normalizeWhatsappNumber, type DeliveryZone } from "@dtc/catalogue-core"

export interface OrderLine {
  slug: string
  productName: string
  colorName: string | null
  /** Design option, e.g. "Back design". Unset for products without designs. */
  designName?: string | null
  size: string | null
  quantity: number
  unitPriceBdt: number
}

export const MAX_QUANTITY = 10

/** Letters and digits that cannot be confused when read aloud or typed. */
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"

/** Short reference such as AFK-261120-K7Q, so a chat can be matched to an order. */
export function createOrderCode(date: Date = new Date(), random: () => number = Math.random): string {
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const dd = String(date.getDate()).padStart(2, "0")
  let suffix = ""
  for (let i = 0; i < 3; i++) {
    suffix += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)]
  }
  return `AFK-${yy}${mm}${dd}-${suffix}`
}

export function lineTotal(line: OrderLine): number {
  return line.unitPriceBdt * line.quantity
}

export function orderSubtotal(lines: OrderLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function describeVariant(line: Pick<OrderLine, "designName" | "colorName" | "size">): string {
  return [line.designName, line.colorName, line.size].filter(Boolean).join(" / ")
}

/**
 * The text the customer sends. Plain text so it reads well in WhatsApp and
 * Messenger, with blank fields for the details we need to deliver.
 */
export function buildOrderMessage(input: {
  code: string
  lines: OrderLine[]
  deliveryZones: DeliveryZone[]
  /** Filled in when the customer already typed them at checkout. */
  customer?: { name: string; phone: string; address: string; district: string; note?: string }
  /** The fee for the customer's area, when known. */
  delivery?: { label: string; feeBdt: number }
}): string {
  const { code, lines, deliveryZones, customer, delivery: quote } = input
  const items = lines.map((line, i) => {
    const variant = describeVariant(line)
    const detail = `${variant ? `${variant} ` : ""}x ${line.quantity} = ${formatBdtPlain(lineTotal(line))}`
    return `${i + 1}) ${line.productName}\n   ${detail}`
  })

  const subtotal = orderSubtotal(lines)
  const delivery = quote
    ? [`Delivery (${quote.label}): ${formatBdtPlain(quote.feeBdt)}`, `Total: ${formatBdtPlain(subtotal + quote.feeBdt)}`]
    : [
        deliveryZones.length
          ? `Delivery: ${deliveryZones.map((z) => `${z.name} ${formatBdtPlain(z.feeBdt)}`).join(" / ")}`
          : "Delivery: charge depends on your area",
      ]

  return [
    "Hi AFK THEORY, I would like to order:",
    "",
    `Order ${code}`,
    ...items,
    "",
    `Subtotal: ${formatBdtPlain(subtotal)}`,
    ...delivery,
    "Payment: Cash on delivery",
    "",
    `Name: ${customer?.name ?? ""}`.trimEnd(),
    `Phone: ${customer?.phone ?? ""}`.trimEnd(),
    `Full address: ${customer?.address.replace(/\s*\n\s*/g, ", ") ?? ""}`.trimEnd(),
    `District: ${customer?.district ?? ""}`.trimEnd(),
    ...(customer?.note ? [`Note: ${customer.note.replace(/\s*\n\s*/g, " ")}`] : []),
  ].join("\n")
}

/** wa.me link that opens a chat with the message typed in, ready to send. */
export function whatsappUrl(number: string, message: string): string | null {
  const digits = normalizeWhatsappNumber(number)
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/**
 * m.me link that opens the page's Messenger chat. Messenger cannot reliably
 * pre-type a customer message, so the site copies the order to the clipboard
 * first. The order code travels as `ref`, which the page receives as context.
 */
export function messengerUrl(page: string, code: string): string | null {
  const username = normalizeMessengerPage(page)
  if (!username) return null
  return `https://m.me/${username}?ref=${encodeURIComponent(code)}`
}

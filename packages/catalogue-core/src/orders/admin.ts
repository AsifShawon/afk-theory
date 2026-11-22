/**
 * Order rows as the local admin reads them, plus what the Orders screen
 * needs: status names, status emails, CSV export and rebuilding an order for
 * a resend.
 */
import { z } from "zod"
import { formatBdtPlain } from "../format"
import type { DeliveryZone } from "../types"
import { escapeHtml, type RenderedEmail, type ShopContact } from "./emails"
import { quoteDelivery, type PricedOrder, type ShippingZone } from "./pricing"
import type { CheckoutCustomer } from "./schema"

export const ORDER_STATUSES = ["new", "confirmed", "shipped", "delivered", "cancelled", "returned"] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
}

export const ORDER_TABLES = { orders: "orders", items: "order_items", events: "order_events" } as const
export const ORDERS_MIGRATION = "20261123000000_orders.sql"

export interface OrderRow {
  id: string
  code: string
  status: OrderStatus
  name: string
  phone: string
  email: string | null
  district: string
  zone: ShippingZone
  address: string
  note: string
  subtotal_bdt: number
  delivery_bdt: number
  total_bdt: number
  payment_method: "cod"
  email_status: "pending" | "sent" | "failed"
  anonymised_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderItemRow {
  id: string
  order_id: string
  product_id: string | null
  product_slug: string
  product_name: string
  color: string | null
  design: string | null
  size: string | null
  quantity: number
  unit_price_bdt: number
  line_total_bdt: number
  sort_order: number
}

export interface OrderEventRow {
  id: number
  order_id: string
  kind: string
  detail: string
  created_at: string
}

export const orderStatusUpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(ORDER_STATUSES),
  /** Email the customer about the change, when they gave an email. */
  notify: z.boolean().default(false),
})

/** Rebuilds the priced order from saved rows, for resending emails. */
export function pricedOrderFromRows(order: OrderRow, items: OrderItemRow[], zones: DeliveryZone[]): PricedOrder {
  const quote = quoteDelivery(order.district, order.address, zones)
  return {
    lines: [...items]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((i) => ({
        productId: i.product_id ?? "",
        slug: i.product_slug,
        name: i.product_name,
        color: i.color,
        design: i.design,
        size: i.size,
        quantity: i.quantity,
        unitPriceBdt: i.unit_price_bdt,
        lineTotalBdt: i.line_total_bdt,
      })),
    subtotalBdt: order.subtotal_bdt,
    // The saved fee is what the customer agreed to, even if Settings changed since.
    delivery: { zone: order.zone, label: quote?.zone === order.zone ? quote.label : order.zone.replace(/_/g, " "), feeBdt: order.delivery_bdt, eta: quote?.eta ?? "" },
    totalBdt: order.total_bdt,
  }
}

export function customerFromRow(order: OrderRow): CheckoutCustomer {
  return { name: order.name, phone: order.phone, email: order.email, district: order.district, address: order.address, note: order.note }
}

const STATUS_MESSAGE: Partial<Record<OrderStatus, { subject: string; heading: string; body: string }>> = {
  confirmed: {
    subject: "confirmed",
    heading: "Your order is confirmed",
    body: "We are packing it now. We will let you know when it ships.",
  },
  shipped: {
    subject: "is on its way",
    heading: "Your order is on its way",
    body: "The courier has your parcel. Keep your phone close: they call before delivery.",
  },
  delivered: {
    subject: "was delivered",
    heading: "Delivered. Enjoy it.",
    body: "Thanks for shopping with AFK THEORY. If the size is not right, message us within 48 hours of delivery.",
  },
  cancelled: {
    subject: "was cancelled",
    heading: "Your order was cancelled",
    body: "If you did not ask for this, reply to this email or message us and we will sort it out.",
  },
}

/** Statuses that have a customer email. */
export function statusHasEmail(status: OrderStatus): boolean {
  return Boolean(STATUS_MESSAGE[status])
}

/** Short email to the customer when an order changes status. */
export function orderStatusEmail(input: { code: string; name: string; status: OrderStatus; totalBdt: number }, shop: ShopContact): RenderedEmail | null {
  const message = STATUS_MESSAGE[input.status]
  if (!message) return null
  const firstName = input.name.split(" ")[0]
  const subject = `Your AFK THEORY order ${input.code} ${message.subject}`
  const whatsapp = shop.whatsappNumber ? `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(`Hi AFK THEORY, about my order ${input.code}`)}` : null
  const cod = input.status === "confirmed" || input.status === "shipped" ? ` Please keep ${formatBdtPlain(input.totalBdt)} ready in cash.` : ""

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:24px 12px;background:#F5F3ED;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#20241F">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E2DFD6">
<tr><td style="background:#20241F;padding:20px 28px;border-bottom:3px solid #D8F452"><span style="font-size:20px;font-weight:800;letter-spacing:3px;color:#F5F3ED">AFK THEORY</span></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${escapeHtml(message.heading)}</h1>
<p style="margin:0 0 16px;font-size:15px;line-height:1.6">Hi ${escapeHtml(firstName)}, order <strong>${escapeHtml(input.code)}</strong>. ${escapeHtml(message.body)}${escapeHtml(cod)}</p>
${whatsapp ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6"><a href="${escapeHtml(whatsapp)}" style="color:#20241F;font-weight:700">Message us on WhatsApp</a></p>` : ""}
${shop.siteUrl ? `<p style="margin:24px 0 0;font-size:12px;color:#6B6F68"><a href="${escapeHtml(shop.siteUrl)}" style="color:#6B6F68">${escapeHtml(shop.siteUrl.replace(/^https?:\/\//, ""))}</a></p>` : ""}
</td></tr></table></td></tr></table>
</body></html>`

  const text = [
    message.heading,
    "",
    `Hi ${firstName}, order ${input.code}. ${message.body}${cod}`,
    ...(whatsapp ? ["", `WhatsApp: ${whatsapp}`] : []),
    ...(shop.siteUrl ? ["", shop.siteUrl] : []),
  ].join("\n")

  return { subject, html, text }
}

/** Quotes a CSV cell and stops spreadsheet apps from running it as a formula. */
function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** One row per order line, ready for a spreadsheet or a courier upload. */
export function ordersToCsv(orders: (OrderRow & { items: OrderItemRow[] })[]): string {
  const header = [
    "Order",
    "Placed (Dhaka time)",
    "Status",
    "Name",
    "Phone",
    "Email",
    "District",
    "Address",
    "Note",
    "Item",
    "Design",
    "Color",
    "Size",
    "Qty",
    "Line total",
    "Delivery",
    "Order total (COD)",
  ]
  const rows = orders.flatMap((o) => {
    const placed = new Date(o.created_at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "short", timeStyle: "short" })
    const items = o.items.length ? o.items : [null]
    return items.map((i, index) =>
      [
        o.code,
        placed,
        ORDER_STATUS_LABEL[o.status] ?? o.status,
        o.name,
        o.phone,
        o.email ?? "",
        o.district,
        o.address.replace(/\s*\n\s*/g, ", "),
        o.note,
        i?.product_name ?? "",
        i?.design ?? "",
        i?.color ?? "",
        i?.size ?? "",
        i?.quantity ?? "",
        i?.line_total_bdt ?? "",
        index === 0 ? o.delivery_bdt : "",
        index === 0 ? o.total_bdt : "",
      ]
        .map(csvCell)
        .join(",")
    )
  })
  // Byte order mark so Excel opens Bangla text correctly.
  return `﻿${[header.join(","), ...rows].join("\r\n")}\r\n`
}

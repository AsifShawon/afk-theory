import {
  escapeHtml,
  formatMoney,
  renderEmailLayout,
  safeHttpUrl,
} from "./layout"
import type { OrderPlacedTemplateData } from "./order-placed"

export type OrderEmailOrder = OrderPlacedTemplateData["order"]

export type TrackingInfo = {
  number?: string | null
  url?: string | null
}

export type GeneratedEmail = {
  subject: string
  html: string
  text: string
}

function displayIdOf(order: OrderEmailOrder): string {
  return String(order.display_id || order.id.slice(-6))
}

function firstNameOf(order: OrderEmailOrder): string {
  return order.shipping_address?.first_name?.trim() || "there"
}

function renderItemsTable(order: OrderEmailOrder): string {
  const items = order.items || []
  if (items.length === 0) return ""

  const rows = items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #444444; color: #EDE6DC; font-size: 13px;">
          <strong>${escapeHtml(item.product_title || item.title || "Garment")}</strong>
          ${item.variant_title ? `<br/><span style="color: #AAAAAA; font-size: 12px;">${escapeHtml(item.variant_title)}</span>` : ""}
        </td>
        <td style="padding: 10px 0; border-bottom: 1px solid #444444; text-align: right; color: #EDE6DC; font-size: 13px;">&times; ${escapeHtml(item.quantity)}</td>
      </tr>`
    )
    .join("")

  return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">${rows}</table>`
}

function itemsText(order: OrderEmailOrder): string {
  return (order.items || [])
    .map(
      (item) =>
        `- ${item.product_title || item.title || "Garment"}${item.variant_title ? ` (${item.variant_title})` : ""} x${item.quantity}`
    )
    .join("\n")
}

/**
 * Sent when the order leaves the warehouse with a courier.
 */
export function generateOrderShippedEmail({
  order,
  tracking,
}: {
  order: OrderEmailOrder
  tracking?: TrackingInfo
}): GeneratedEmail {
  const displayId = displayIdOf(order)
  const total = formatMoney(order.total, order.currency_code)
  const trackingNumber = tracking?.number?.trim() || undefined
  const trackingUrl = safeHttpUrl(tracking?.url)

  const trackingHtml =
    trackingNumber || trackingUrl
      ? `<p style="margin: 16px 0 0;">${
          trackingNumber
            ? `Tracking number: <strong style="color: #EDE6DC;">${escapeHtml(trackingNumber)}</strong><br/>`
            : ""
        }${
          trackingUrl
            ? `<a href="${escapeHtml(trackingUrl)}" style="display: inline-block; margin-top: 10px; background-color: #D8F452; color: #292828; padding: 10px 18px; font-weight: 700; text-decoration: none; text-transform: uppercase; letter-spacing: 1px; font-size: 12px;">Track your parcel</a>`
            : ""
        }</p>`
      : ""

  const html = renderEmailLayout({
    title: `Your order #${displayId} is on its way - AFK THEORY`,
    badge: "On its way",
    heading: `Your order is on its way, ${firstNameOf(order)}`,
    bodyHtml: `<p style="margin: 0;">Order <strong>#${escapeHtml(displayId)}</strong> has been handed to our courier. Please keep <strong style="color: #D8F452;">${escapeHtml(total)}</strong> ready to pay on delivery.</p>${trackingHtml}`,
    extraHtml: renderItemsTable(order),
  })

  const text = `AFK THEORY - YOUR ORDER #${displayId} IS ON ITS WAY

Hi ${firstNameOf(order)}, your order has been handed to our courier.
Please keep ${total} ready to pay on delivery.
${trackingNumber ? `\nTracking number: ${trackingNumber}` : ""}${trackingUrl ? `\nTrack your parcel: ${trackingUrl}` : ""}

${itemsText(order)}
`

  return { subject: `Your order #${displayId} is on its way - AFK THEORY`, html, text }
}

/**
 * Sent when the courier marks the order as delivered.
 */
export function generateOrderDeliveredEmail({
  order,
}: {
  order: OrderEmailOrder
}): GeneratedEmail {
  const displayId = displayIdOf(order)

  const html = renderEmailLayout({
    title: `Your order #${displayId} was delivered - AFK THEORY`,
    badge: "Delivered",
    heading: `Delivered. Enjoy, ${firstNameOf(order)}`,
    bodyHtml: `<p style="margin: 0;">Order <strong>#${escapeHtml(displayId)}</strong> has been delivered. Thank you for choosing AFK THEORY.</p><p style="margin: 12px 0 0;">If the fit isn't right, you can request a size exchange within 48 hours of delivery. Just reply to this email with your order number and we will help.</p>`,
    extraHtml: renderItemsTable(order),
  })

  const text = `AFK THEORY - ORDER #${displayId} DELIVERED

Hi ${firstNameOf(order)}, your order has been delivered. Thank you for choosing AFK THEORY.
If the fit isn't right, you can request a size exchange within 48 hours of delivery. Reply to this email with your order number.

${itemsText(order)}
`

  return { subject: `Your order #${displayId} was delivered - AFK THEORY`, html, text }
}

/**
 * Sent when an order is cancelled.
 */
export function generateOrderCanceledEmail({
  order,
}: {
  order: OrderEmailOrder
}): GeneratedEmail {
  const displayId = displayIdOf(order)

  const html = renderEmailLayout({
    title: `Your order #${displayId} was cancelled - AFK THEORY`,
    badge: "Order cancelled",
    heading: `Your order was cancelled`,
    bodyHtml: `<p style="margin: 0;">Order <strong>#${escapeHtml(displayId)}</strong> has been cancelled. As this was a Cash on Delivery order, there is nothing to pay.</p><p style="margin: 12px 0 0;">If you did not ask for this cancellation, or you would like to order again, just reply to this email.</p>`,
    extraHtml: renderItemsTable(order),
  })

  const text = `AFK THEORY - ORDER #${displayId} CANCELLED

Your order has been cancelled. As this was a Cash on Delivery order, there is nothing to pay.
If you did not ask for this cancellation, reply to this email.

${itemsText(order)}
`

  return { subject: `Your order #${displayId} was cancelled - AFK THEORY`, html, text }
}

/**
 * Sent to the store owner when a new order arrives, with what is needed to
 * confirm it by phone (Cash on Delivery orders are usually confirmed by call).
 */
export function generateOwnerOrderAlertEmail({
  order,
  adminUrl,
}: {
  order: OrderEmailOrder
  adminUrl?: string
}): GeneratedEmail {
  const displayId = displayIdOf(order)
  const total = formatMoney(order.total, order.currency_code)
  const address = order.shipping_address
  const customerName =
    `${address?.first_name || ""} ${address?.last_name || ""}`.trim() || "Customer"
  const link = safeHttpUrl(adminUrl)

  const addressLines = [
    address?.address_1,
    address?.address_2,
    [address?.city, address?.postal_code].filter(Boolean).join(", "),
  ].filter((line): line is string => Boolean(line && line.trim()))

  const details = `
    <p style="margin: 0;"><strong style="color: #EDE6DC;">${escapeHtml(customerName)}</strong><br/>
    Phone: <strong style="color: #D8F452;">${escapeHtml(address?.phone || "not provided")}</strong><br/>
    Email: ${escapeHtml(order.email || "not provided")}</p>
    <p style="margin: 12px 0 0;">${addressLines.map(escapeHtml).join("<br/>") || "No address"}</p>
    <p style="margin: 12px 0 0;">Collect on delivery: <strong style="color: #D8F452;">${escapeHtml(total)}</strong></p>
    ${link ? `<p style="margin: 16px 0 0;"><a href="${escapeHtml(link)}" style="color: #D8F452;">Open order in admin</a></p>` : ""}`

  const html = renderEmailLayout({
    title: `New order #${displayId} - AFK THEORY`,
    badge: "New order",
    heading: `New order #${displayId}`,
    bodyHtml: details,
    extraHtml: renderItemsTable(order),
  })

  const text = `NEW ORDER #${displayId} (Cash on Delivery)

${customerName}
Phone: ${address?.phone || "not provided"}
Email: ${order.email || "not provided"}
${addressLines.join("\n")}

Collect on delivery: ${total}
${link ? `Admin: ${link}` : ""}

${itemsText(order)}
`

  return { subject: `New order #${displayId} - ${total} (COD)`, html, text }
}

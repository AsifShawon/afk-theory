/**
 * Order emails: the full order for the shop owner and a confirmation for the
 * customer. Every value a customer typed goes through escapeHtml(), and links
 * are built from validated data only (normalised phone, site address).
 */
import { formatBdtPlain } from "../format"
import type { PricedOrder } from "./pricing"
import type { CheckoutCustomer } from "./schema"

export interface RenderedEmail {
  subject: string
  html: string
  text: string
}

export interface OrderEmailData {
  /** AFK-1042, or a temporary reference when the order could not be saved. */
  code: string
  placedAt: Date
  customer: CheckoutCustomer
  order: PricedOrder
}

export interface ShopContact {
  /** Public site address, for example https://afktheory.com. Empty leaves the link out. */
  siteUrl: string
  /** Digits only, with country code, for example 8801712345678. Empty when not set. */
  whatsappNumber: string
}

const HTML_ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }

export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

/** Escaped, with line breaks kept (addresses and notes). */
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\r?\n/g, "<br>")
}

const COLORS = { ink: "#20241F", bone: "#F5F3ED", accent: "#D8F452", muted: "#6B6F68", line: "#E2DFD6", warn: "#B42318" }

/** 01712345678 -> 8801712345678 */
const internationalPhone = (phone: string) => `88${phone}`

function variantOf(line: { design: string | null; color: string | null; size: string | null }): string {
  return [line.design, line.color, line.size].filter(Boolean).join(" / ")
}

function formatPlacedAt(date: Date): string {
  // Bangladesh has no daylight saving: always UTC+6.
  return date.toLocaleString("en-GB", {
    timeZone: "Asia/Dhaka",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function itemsTable(order: PricedOrder): string {
  const rows = order.lines
    .map((line) => {
      const variant = variantOf(line)
      return `<tr>
  <td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink}">
    <strong>${escapeHtml(line.name)}</strong>${variant ? `<br><span style="font-size:12px;color:${COLORS.muted}">${escapeHtml(variant)}</span>` : ""}
  </td>
  <td style="padding:12px 8px;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};text-align:center;white-space:nowrap">x ${line.quantity}</td>
  <td style="padding:12px 0;border-bottom:1px solid ${COLORS.line};font-size:14px;color:${COLORS.ink};text-align:right;white-space:nowrap">${formatBdtPlain(line.lineTotalBdt)}</td>
</tr>`
    })
    .join("\n")

  const total = (label: string, value: string, strong = false) => `<tr>
  <td colspan="2" style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:${strong ? COLORS.ink : COLORS.muted};${strong ? "font-weight:700;" : ""}">${label}</td>
  <td style="padding:6px 0;font-size:${strong ? 16 : 14}px;color:${COLORS.ink};text-align:right;white-space:nowrap;${strong ? "font-weight:700;" : ""}">${value}</td>
</tr>`

  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
${rows}
${total("Subtotal", formatBdtPlain(order.subtotalBdt))}
${total(`Delivery (${escapeHtml(order.delivery.label)})`, formatBdtPlain(order.delivery.feeBdt))}
${total("Total, cash on delivery", formatBdtPlain(order.totalBdt), true)}
</table>`
}

function button(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:4px 8px 4px 0;padding:12px 18px;background:${COLORS.ink};color:${COLORS.accent};font-size:14px;font-weight:700;text-decoration:none;border-radius:4px">${escapeHtml(label)}</a>`
}

function layout(input: { title: string; preheader: string; banner?: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.bone};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:${COLORS.ink}">
<div style="display:none;max-height:0;overflow:hidden">${escapeHtml(input.preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${COLORS.bone};padding:24px 12px">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid ${COLORS.line}">
<tr><td style="background:${COLORS.ink};padding:20px 28px;border-bottom:3px solid ${COLORS.accent}">
<span style="font-size:20px;font-weight:800;letter-spacing:3px;color:${COLORS.bone}">AFK THEORY</span>
</td></tr>
${input.banner ? `<tr><td style="background:${COLORS.warn};color:#FFFFFF;padding:14px 28px;font-size:14px;font-weight:700">${input.banner}</td></tr>` : ""}
<tr><td style="padding:28px">
${input.body}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

const heading = (text: string) => `<h1 style="margin:0 0 8px;font-size:24px;line-height:1.25;color:${COLORS.ink}">${text}</h1>`
const para = (html: string) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${COLORS.ink}">${html}</p>`
const label = (text: string) =>
  `<p style="margin:24px 0 8px;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.muted}">${text}</p>`

function textItems(order: PricedOrder): string[] {
  return [
    ...order.lines.map((line, i) => {
      const variant = variantOf(line)
      return `${i + 1}) ${line.name}${variant ? ` (${variant})` : ""} x ${line.quantity} = ${formatBdtPlain(line.lineTotalBdt)}`
    }),
    "",
    `Subtotal: ${formatBdtPlain(order.subtotalBdt)}`,
    `Delivery (${order.delivery.label}): ${formatBdtPlain(order.delivery.feeBdt)}`,
    `Total, cash on delivery: ${formatBdtPlain(order.totalBdt)}`,
  ]
}

/**
 * The shop's copy. `saved: false` is the emergency copy sent when the
 * database could not be reached: the order exists only in this email.
 */
export function ownerOrderEmail(data: OrderEmailData, options: { saved: boolean; adminHint?: string } = { saved: true }): RenderedEmail {
  const { code, customer, order } = data
  const items = order.lines.reduce((n, l) => n + l.quantity, 0)
  const subject = `${options.saved ? "" : "[NOT SAVED] "}New order ${code}: ${items} item${items === 1 ? "" : "s"}, ${formatBdtPlain(order.totalBdt)}`
  const phoneIntl = internationalPhone(customer.phone)
  const banner = options.saved
    ? undefined
    : "This order could not be saved in the database. It exists only in this email. Add it by hand or call the customer."

  const body = [
    heading(`Order ${escapeHtml(code)}`),
    para(`${escapeHtml(formatPlacedAt(data.placedAt))} &middot; Cash on delivery &middot; <strong>${formatBdtPlain(order.totalBdt)}</strong> to collect`),
    `<div>${button(`tel:+${phoneIntl}`, `Call ${customer.phone}`)}${button(`https://wa.me/${phoneIntl}`, "WhatsApp the customer")}</div>`,
    label("Deliver to"),
    para(
      [
        `<strong>${escapeHtml(customer.name)}</strong>`,
        escapeHtml(customer.phone),
        escapeMultiline(customer.address),
        `${escapeHtml(customer.district)} &middot; ${escapeHtml(order.delivery.label)}`,
        customer.email ? escapeHtml(customer.email) : "No email given",
      ].join("<br>")
    ),
    customer.note ? `${label("Customer note")}${para(escapeMultiline(customer.note))}` : "",
    label("Items"),
    itemsTable(order),
    options.adminHint ? `<p style="margin:24px 0 0;font-size:13px;color:${COLORS.muted}">${escapeHtml(options.adminHint)}</p>` : "",
  ].join("\n")

  const text = [
    options.saved ? "" : "NOT SAVED: this order could not be saved in the database. It exists only in this email.\n",
    `Order ${code}`,
    `${formatPlacedAt(data.placedAt)}, cash on delivery, ${formatBdtPlain(order.totalBdt)} to collect`,
    "",
    "Deliver to:",
    customer.name,
    customer.phone,
    customer.address,
    `${customer.district} (${order.delivery.label})`,
    customer.email || "No email given",
    ...(customer.note ? ["", "Customer note:", customer.note] : []),
    "",
    "Items:",
    ...textItems(order),
    "",
    `Call: +${phoneIntl}`,
    `WhatsApp: https://wa.me/${phoneIntl}`,
  ]
    .filter((l, i) => i > 0 || l)
    .join("\n")

  return { subject, html: layout({ title: subject, preheader: `${customer.name}, ${customer.district}, ${formatBdtPlain(order.totalBdt)}`, banner, body }), text }
}

/** The customer's confirmation. Only sent when they gave an email. */
export function customerOrderEmail(data: OrderEmailData, shop: ShopContact): RenderedEmail {
  const { code, customer, order } = data
  const subject = `Your AFK THEORY order ${code}`
  const firstName = customer.name.split(" ")[0]
  const whatsapp = shop.whatsappNumber ? `https://wa.me/${shop.whatsappNumber}?text=${encodeURIComponent(`Hi AFK THEORY, about my order ${code}`)}` : null

  const body = [
    heading(`Thanks, ${escapeHtml(firstName)}. Your order is in.`),
    para(`Order number <strong>${escapeHtml(code)}</strong>. Keep it handy if you contact us.`),
    label("What happens next"),
    para(
      [
        `1. We call you on <strong>${escapeHtml(customer.phone)}</strong> to confirm the order.`,
        `2. The courier delivers to ${escapeHtml(customer.district)}, usually in ${escapeHtml(order.delivery.eta || "a few days")}.`,
        `3. You pay <strong>${formatBdtPlain(order.totalBdt)}</strong> in cash when the parcel arrives.`,
      ].join("<br>")
    ),
    label("Your order"),
    itemsTable(order),
    label("Delivery address"),
    para([escapeHtml(customer.name), escapeMultiline(customer.address), escapeHtml(customer.district)].join("<br>")),
    whatsapp ? `<div>${button(whatsapp, "Message us on WhatsApp")}</div>` : "",
    `<p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:${COLORS.muted}">Something wrong with this order? Reply to this email or message us${
      whatsapp ? " on WhatsApp" : ""
    }.${shop.siteUrl ? ` <a href="${escapeHtml(shop.siteUrl)}" style="color:${COLORS.muted}">${escapeHtml(shop.siteUrl.replace(/^https?:\/\//, ""))}</a>` : ""}</p>`,
  ].join("\n")

  const text = [
    `Thanks, ${firstName}. Your order is in.`,
    `Order number: ${code}`,
    "",
    "What happens next:",
    `1. We call you on ${customer.phone} to confirm the order.`,
    `2. The courier delivers to ${customer.district}, usually in ${order.delivery.eta || "a few days"}.`,
    `3. You pay ${formatBdtPlain(order.totalBdt)} in cash when the parcel arrives.`,
    "",
    "Your order:",
    ...textItems(order),
    "",
    "Delivery address:",
    customer.name,
    customer.address,
    customer.district,
    "",
    whatsapp ? `Questions? Reply to this email or message us on WhatsApp: ${whatsapp}` : "Questions? Reply to this email.",
    ...(shop.siteUrl ? [shop.siteUrl] : []),
  ].join("\n")

  return { subject, html: layout({ title: subject, preheader: `Order ${code}: we will call you to confirm.`, body }), text }
}

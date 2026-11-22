"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import {
  ORDER_STATUS_LABEL,
  ORDER_TABLES,
  customerFromRow,
  customerOrderEmail,
  orderStatusEmail,
  orderStatusUpdateSchema,
  ownerOrderEmail,
  pricedOrderFromRows,
} from "@dtc/catalogue-core/orders"
import { fail, type ActionResult } from "@/lib/action-result"
import { addOrderEvent, adminEmail, loadOrder, loadShopForEmails } from "@/lib/orders"
import { getAdmin } from "@/lib/supabase-server"

const idSchema = z.string().uuid()

function refresh(id: string) {
  revalidatePath("/orders")
  revalidatePath(`/orders/${id}`)
}

/** Changes an order's status, and emails the customer when asked to. */
export async function updateOrderStatus(input: unknown): Promise<ActionResult> {
  const parsed = orderStatusUpdateSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Choose a status" }
  const { id, status, notify } = parsed.data
  try {
    const loaded = await loadOrder(id)
    if (!loaded) return { ok: false, error: "Order not found" }
    const { order } = loaded
    if (order.status === status) return { ok: true, data: undefined, message: "No change" }

    const { client } = getAdmin()
    const { error } = await client.from(ORDER_TABLES.orders).update({ status }).eq("id", id)
    if (error) throw error
    await addOrderEvent(id, "status", `${ORDER_STATUS_LABEL[order.status]} to ${ORDER_STATUS_LABEL[status]}`)

    let message = `Marked ${ORDER_STATUS_LABEL[status].toLowerCase()}`
    if (notify && order.email && !order.anonymised_at) {
      const shop = await loadShopForEmails()
      const mail = adminEmail()
      const email = orderStatusEmail({ code: order.code, name: order.name, status, totalBdt: order.total_bdt }, { siteUrl: mail.siteUrl, whatsappNumber: shop.whatsappNumber })
      if (email && mail.provider) {
        const sent = await mail.provider.send({ to: order.email, subject: email.subject, html: email.html, text: email.text, replyTo: mail.ownerEmail ?? undefined })
        await addOrderEvent(id, sent.ok ? "email_sent" : "email_failed", sent.ok ? `Status email: ${ORDER_STATUS_LABEL[status]}` : `Status email: ${sent.error}`)
        message += sent.ok ? " and emailed the customer" : `. The email failed: ${sent.error}`
      } else if (email) {
        message += `. ${mail.problem}`
      }
    }
    refresh(id)
    return { ok: true, data: undefined, message }
  } catch (err) {
    return fail(err)
  }
}

/** Sends the owner copy and the customer confirmation again, for orders whose emails failed. */
export async function resendOrderEmails(rawId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(rawId)
  if (!id.success) return { ok: false, error: "Order not found" }
  try {
    const loaded = await loadOrder(id.data)
    if (!loaded) return { ok: false, error: "Order not found" }
    const { order, items } = loaded
    if (order.anonymised_at) return { ok: false, error: "This order was anonymised" }

    const mail = adminEmail()
    if (!mail.provider) return { ok: false, error: mail.problem ?? "Email is not set up" }
    const shop = await loadShopForEmails()
    const data = { code: order.code, placedAt: new Date(order.created_at), customer: customerFromRow(order), order: pricedOrderFromRows(order, items, shop.zones) }

    const results: string[] = []
    let failed = false
    if (mail.ownerEmail) {
      const owner = ownerOrderEmail(data, { saved: true })
      const r = await mail.provider.send({ to: mail.ownerEmail, subject: owner.subject, html: owner.html, text: owner.text, replyTo: order.email ?? undefined })
      await addOrderEvent(order.id, r.ok ? "email_sent" : "email_failed", r.ok ? "Owner copy (resent)" : `Owner copy (resent): ${r.error}`)
      results.push(r.ok ? "your copy" : `your copy failed (${r.error})`)
      failed ||= !r.ok
    }
    if (order.email) {
      const confirmation = customerOrderEmail(data, { siteUrl: mail.siteUrl, whatsappNumber: shop.whatsappNumber })
      const r = await mail.provider.send({ to: order.email, subject: confirmation.subject, html: confirmation.html, text: confirmation.text, replyTo: mail.ownerEmail ?? undefined })
      await addOrderEvent(order.id, r.ok ? "email_sent" : "email_failed", r.ok ? "Customer confirmation (resent)" : `Customer confirmation (resent): ${r.error}`)
      results.push(r.ok ? "the customer's confirmation" : `the customer's confirmation failed (${r.error})`)
      failed ||= !r.ok
    }
    if (results.length === 0) return { ok: false, error: "Nobody to email: add ORDER_NOTIFY_EMAIL to the admin's .env.local" }

    const { client } = getAdmin()
    await client.from(ORDER_TABLES.orders).update({ email_status: failed ? "failed" : "sent" }).eq("id", order.id)
    refresh(order.id)
    return failed ? { ok: false, error: `Sent with problems: ${results.join(", ")}` } : { ok: true, data: undefined, message: `Sent ${results.join(" and ")}` }
  } catch (err) {
    return fail(err)
  }
}

/**
 * Removes the customer's personal details from an order and keeps the
 * numbers (items, totals, dates) for your records.
 */
export async function anonymiseOrder(rawId: unknown): Promise<ActionResult> {
  const id = idSchema.safeParse(rawId)
  if (!id.success) return { ok: false, error: "Order not found" }
  try {
    const { client } = getAdmin()
    const { error } = await client
      .from(ORDER_TABLES.orders)
      .update({
        name: "Removed",
        // A valid placeholder: the phone column only accepts mobile numbers.
        phone: "01300000000",
        email: null,
        address: "Removed",
        note: "",
        ip_hash: null,
        anonymised_at: new Date().toISOString(),
      })
      .eq("id", id.data)
    if (error) throw error
    await addOrderEvent(id.data, "anonymised", "Personal details removed")
    refresh(id.data)
    return { ok: true, data: undefined, message: "Personal details removed" }
  } catch (err) {
    return fail(err)
  }
}

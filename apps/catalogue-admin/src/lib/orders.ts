import "server-only"
import { isMissingTable, normalizeWhatsappNumber, TABLES, type DeliveryZone } from "@dtc/catalogue-core"
import {
  ORDER_TABLES,
  ORDERS_MIGRATION,
  consoleEmailProvider,
  resendEmailProvider,
  type EmailProvider,
  type OrderEventRow,
  type OrderItemRow,
  type OrderRow,
  type OrderStatus,
} from "@dtc/catalogue-core/orders"
import { getAdmin } from "./supabase-server"

export const ORDERS_MIGRATION_HINT = `Orders need one more database step. In Supabase open the SQL editor, run apps/catalogue-admin/supabase/migrations/${ORDERS_MIGRATION}, then reload.`

export class OrdersNotReady extends Error {
  constructor() {
    super(ORDERS_MIGRATION_HINT)
    this.name = "OrdersNotReady"
  }
}

function check<T>(result: { data: T | null; error: { message: string; code?: string } | null }, what: string): T {
  if (result.error) {
    if (isMissingTable(result.error)) throw new OrdersNotReady()
    throw new Error(`Could not load ${what}: ${result.error.message}`)
  }
  return result.data as T
}

export interface OrderListFilter {
  status?: OrderStatus | "all"
  /** Order code, phone number or name. */
  q?: string
  limit?: number
}

const LIST_COLUMNS = "id,code,status,name,phone,email,district,zone,address,note,subtotal_bdt,delivery_bdt,total_bdt,payment_method,email_status,anonymised_at,created_at,updated_at"

export async function loadOrders(filter: OrderListFilter = {}): Promise<OrderRow[]> {
  const { client } = getAdmin()
  let query = client.from(ORDER_TABLES.orders).select(LIST_COLUMNS).order("created_at", { ascending: false }).limit(filter.limit ?? 200)
  if (filter.status && filter.status !== "all") query = query.eq("status", filter.status)
  const q = (filter.q ?? "").trim()
  if (q) {
    const digits = q.replace(/\D/g, "")
    if (/^afk-?\d+$/i.test(q)) {
      query = query.ilike("code", `AFK-${q.replace(/\D/g, "")}`)
    } else if (digits.length >= 4 && digits.length === q.replace(/[\s+()-]/g, "").length) {
      // Phone search matches the last digits, so "1712345678" finds 01712345678.
      query = query.like("phone", `%${digits.slice(-10)}%`)
    } else {
      // Only letters, digits and spaces reach the pattern.
      query = query.ilike("name", `%${q.replace(/[^\p{L}\p{N} ]/gu, "")}%`)
    }
  }
  return check(await query, "orders")
}

export async function loadOrderItems(orderIds: string[]): Promise<OrderItemRow[]> {
  if (orderIds.length === 0) return []
  const { client } = getAdmin()
  return check(await client.from(ORDER_TABLES.items).select("*").in("order_id", orderIds).order("sort_order"), "order items")
}

export async function loadOrder(id: string): Promise<{ order: OrderRow; items: OrderItemRow[]; events: OrderEventRow[] } | null> {
  const { client } = getAdmin()
  const [orderRes, itemsRes, eventsRes] = await Promise.all([
    client.from(ORDER_TABLES.orders).select(LIST_COLUMNS).eq("id", id).maybeSingle(),
    client.from(ORDER_TABLES.items).select("*").eq("order_id", id).order("sort_order"),
    client.from(ORDER_TABLES.events).select("*").eq("order_id", id).order("created_at"),
  ])
  const order = check(orderRes, "the order") as OrderRow | null
  if (!order) return null
  return { order, items: check(itemsRes, "order items"), events: check(eventsRes, "order history") }
}

/** Orders waiting for a call, for the nav badge. Null when orders are not set up yet. */
export async function countNewOrders(): Promise<number | null> {
  try {
    const { client } = getAdmin()
    const { count, error } = await client.from(ORDER_TABLES.orders).select("id", { count: "exact", head: true }).eq("status", "new")
    return error ? null : count ?? 0
  } catch {
    return null
  }
}

export async function loadShopForEmails(): Promise<{ zones: DeliveryZone[]; whatsappNumber: string }> {
  const { client } = getAdmin()
  const { data } = await client.from(TABLES.settings).select("delivery_zones, whatsapp_number").eq("id", 1).maybeSingle()
  return {
    zones: Array.isArray(data?.delivery_zones) ? (data.delivery_zones as DeliveryZone[]) : [],
    whatsappNumber: normalizeWhatsappNumber(String(data?.whatsapp_number ?? "")),
  }
}

/**
 * Email settings for status emails and resends. The same values as the order
 * endpoint on Cloudflare, kept in apps/catalogue-admin/.env.local.
 */
export function adminEmail(): { provider: EmailProvider | null; ownerEmail: string | null; siteUrl: string; problem: string | null } {
  const env = process.env
  const ownerEmail = env.ORDER_NOTIFY_EMAIL?.trim() || null
  const siteUrl = (env.CATALOGUE_SITE_URL ?? "").trim().replace(/\/+$/, "")
  if (env.EMAIL_PROVIDER === "console") return { provider: consoleEmailProvider(), ownerEmail, siteUrl, problem: null }
  const apiKey = env.RESEND_API_KEY?.trim()
  const from = env.ORDER_EMAIL_FROM?.trim()
  if (!apiKey || !from) {
    return { provider: null, ownerEmail, siteUrl, problem: "Email is not set up in the admin. Add RESEND_API_KEY and ORDER_EMAIL_FROM to apps/catalogue-admin/.env.local." }
  }
  return { provider: resendEmailProvider({ apiKey, from }), ownerEmail, siteUrl, problem: null }
}

export async function addOrderEvent(orderId: string, kind: string, detail = ""): Promise<void> {
  const { client } = getAdmin()
  await client.from(ORDER_TABLES.events).insert({ order_id: orderId, kind, detail: detail.slice(0, 500) })
}

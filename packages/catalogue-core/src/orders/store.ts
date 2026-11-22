/**
 * Where orders are kept. The endpoint talks to Supabase through its REST API
 * with plain fetch (no SDK), which keeps the Cloudflare bundle small and fast
 * to start.
 */
import { SLUG_PATTERN } from "../format"
import type { DeliveryZone } from "../types"
import type { OrderableProduct, PricedOrder } from "./pricing"
import type { CheckoutCustomer } from "./schema"

export interface ShopSettings {
  deliveryZones: DeliveryZone[]
  /** As typed in the admin; normalise before building links. */
  whatsappNumber: string
}

export interface NewOrderRecord {
  idempotencyKey: string
  challengeId: string | null
  ipHash: string | null
  customer: CheckoutCustomer
  order: PricedOrder
}

export type SaveResult =
  | { result: "created"; id: string; code: string }
  | { result: "duplicate"; id: string; code: string }
  | { result: "limited"; id: null; code: null }
  | { result: "replayed"; id: null; code: null }

export interface OrderEvent {
  kind: string
  detail: string
}

export interface OrderStore {
  loadProducts(slugs: string[]): Promise<OrderableProduct[]>
  loadShopSettings(): Promise<ShopSettings>
  saveOrder(record: NewOrderRecord): Promise<SaveResult>
  /** Marks the order's email status and logs what happened. */
  recordEmails(orderId: string, status: "sent" | "failed", events: OrderEvent[]): Promise<void>
}

type FetchLike = (input: string, init?: { method?: string; headers?: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{
  ok: boolean
  status: number
  json(): Promise<unknown>
  text(): Promise<string>
}>

export class StoreError extends Error {
  constructor(
    message: string,
    readonly status: number | null
  ) {
    super(message)
    this.name = "StoreError"
  }
}

interface ProductRowWithOptions {
  id: string
  slug: string
  name: string
  price_bdt: number
  status: string
  sizes: string[] | null
  sold_out_sizes: string[] | null
  product_colors: { name: string; in_stock: boolean; sort_order: number }[] | null
  product_designs: { name: string; in_stock: boolean; sort_order: number }[] | null
}

/**
 * PostgREST's error code and message only. Its `details` field can repeat the
 * row that failed, which would put a customer's details in the logs.
 */
async function errorSummary(response: { text(): Promise<string> }): Promise<string> {
  try {
    const body = JSON.parse(await response.text()) as { code?: unknown; message?: unknown }
    const parts = [body.code, body.message].filter((v): v is string => typeof v === "string" && v.length > 0)
    return parts.length ? `: ${parts.join(" ").slice(0, 200)}` : ""
  } catch {
    return ""
  }
}

const bySort =<T extends { sort_order: number }>(rows: T[] | null) => [...(rows ?? [])].sort((a, b) => a.sort_order - b.sort_order)

/** Orders in Supabase, using the secret key. Never use this in the browser. */
export function supabaseOrderStore(options: { url: string; secretKey: string; fetch?: FetchLike; timeoutMs?: number }): OrderStore {
  const base = `${options.url.replace(/\/+$/, "")}/rest/v1`
  const doFetch: FetchLike = options.fetch ?? (globalThis.fetch as unknown as FetchLike)
  const timeoutMs = options.timeoutMs ?? 8000
  const headers: Record<string, string> = { apikey: options.secretKey, "Content-Type": "application/json" }
  // Legacy service_role keys are JWTs and go in Authorization too. New
  // sb_secret_ keys only go in the apikey header.
  if (options.secretKey.startsWith("eyJ")) headers.Authorization = `Bearer ${options.secretKey}`

  async function request<T>(path: string, init: { method?: string; body?: unknown; prefer?: string } = {}): Promise<T> {
    const controller = typeof AbortController === "function" ? new AbortController() : null
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null
    try {
      const response = await doFetch(`${base}${path}`, {
        method: init.method ?? "GET",
        headers: init.prefer ? { ...headers, Prefer: init.prefer } : headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: controller?.signal,
      })
      if (!response.ok) {
        throw new StoreError(`Supabase HTTP ${response.status}${await errorSummary(response)}`, response.status)
      }
      if (response.status === 204) return undefined as T
      const text = await response.text()
      return (text ? JSON.parse(text) : undefined) as T
    } catch (err) {
      if (err instanceof StoreError) throw err
      const aborted = err instanceof Error && err.name === "AbortError"
      throw new StoreError(aborted ? `Supabase timed out after ${timeoutMs} ms` : `Supabase request failed: ${err instanceof Error ? err.message : String(err)}`, null)
    } finally {
      if (timer) clearTimeout(timer)
    }
  }

  return {
    async loadProducts(slugs) {
      const safe = [...new Set(slugs)].filter((s) => SLUG_PATTERN.test(s))
      if (safe.length === 0) return []
      const select = "id,slug,name,price_bdt,status,sizes,sold_out_sizes,product_colors(name,in_stock,sort_order),product_designs(name,in_stock,sort_order)"
      const rows = await request<ProductRowWithOptions[]>(`/products?select=${encodeURIComponent(select)}&slug=in.(${safe.map(encodeURIComponent).join(",")})`)
      return rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        priceBdt: row.price_bdt,
        published: row.status === "published",
        sizes: row.sizes ?? [],
        soldOutSizes: row.sold_out_sizes ?? [],
        colors: bySort(row.product_colors).map((c) => ({ name: c.name, inStock: c.in_stock })),
        designs: bySort(row.product_designs).map((d) => ({ name: d.name, inStock: d.in_stock })),
      }))
    },

    async loadShopSettings() {
      const rows = await request<{ delivery_zones: DeliveryZone[] | null; whatsapp_number: string | null }[]>(
        "/site_settings?select=delivery_zones,whatsapp_number&id=eq.1"
      )
      const row = rows[0]
      return { deliveryZones: Array.isArray(row?.delivery_zones) ? row.delivery_zones : [], whatsappNumber: row?.whatsapp_number ?? "" }
    },

    async saveOrder(record) {
      const { customer, order } = record
      const rows = await request<{ result: SaveResult["result"]; order_id: string | null; order_code: string | null }[]>("/rpc/place_catalogue_order", {
        method: "POST",
        body: {
          p_order: {
            idempotency_key: record.idempotencyKey,
            challenge_hash: record.challengeId,
            ip_hash: record.ipHash,
            name: customer.name,
            phone: customer.phone,
            email: customer.email ?? "",
            district: customer.district,
            zone: order.delivery.zone,
            address: customer.address,
            note: customer.note,
            subtotal_bdt: order.subtotalBdt,
            delivery_bdt: order.delivery.feeBdt,
            total_bdt: order.totalBdt,
          },
          p_items: order.lines.map((line) => ({
            product_id: line.productId,
            product_slug: line.slug,
            product_name: line.name,
            color: line.color ?? "",
            design: line.design ?? "",
            size: line.size ?? "",
            quantity: line.quantity,
            unit_price_bdt: line.unitPriceBdt,
          })),
        },
      })
      const row = rows?.[0]
      if (!row) throw new StoreError("Supabase returned no result for the order", null)
      if ((row.result === "created" || row.result === "duplicate") && row.order_id && row.order_code) {
        return { result: row.result, id: row.order_id, code: row.order_code }
      }
      if (row.result === "limited") return { result: "limited", id: null, code: null }
      if (row.result === "replayed") return { result: "replayed", id: null, code: null }
      throw new StoreError(`Unexpected order result "${row.result}"`, null)
    },

    async recordEmails(orderId, status, events) {
      const id = encodeURIComponent(orderId)
      await Promise.all([
        request(`/orders?id=eq.${id}`, { method: "PATCH", body: { email_status: status }, prefer: "return=minimal" }),
        events.length
          ? request("/order_events", {
              method: "POST",
              body: events.map((e) => ({ order_id: orderId, kind: e.kind, detail: e.detail.slice(0, 500) })),
              prefer: "return=minimal",
            })
          : Promise.resolve(),
      ])
    },
  }
}

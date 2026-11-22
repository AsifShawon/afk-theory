import { ORDER_STATUSES, ordersToCsv, type OrderStatus } from "@dtc/catalogue-core/orders"
import { loadOrderItems, loadOrders } from "@/lib/orders"

/** GET /orders/export?status=new&q=... : the current list as a CSV file. */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const raw = url.searchParams.get("status") ?? "all"
  const status: OrderStatus | "all" = (ORDER_STATUSES as readonly string[]).includes(raw) ? (raw as OrderStatus) : "all"
  const orders = await loadOrders({ status, q: (url.searchParams.get("q") ?? "").slice(0, 60), limit: 1000 })
  const items = await loadOrderItems(orders.map((o) => o.id))
  const csv = ordersToCsv(orders.map((o) => ({ ...o, items: items.filter((i) => i.order_id === o.id) })))
  const date = new Date().toISOString().slice(0, 10)
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="afk-orders-${status}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  })
}

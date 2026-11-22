import Link from "next/link"
import { clsx } from "clsx"
import { formatBdt } from "@dtc/catalogue-core"
import { ORDER_STATUS_LABEL, ORDER_STATUSES, type OrderStatus } from "@dtc/catalogue-core/orders"
import { DbError } from "@/components/db-error"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Badge, Notice } from "@/components/ui"
import { loadOrders, OrdersNotReady } from "@/lib/orders"

const TABS: (OrderStatus | "all")[] = ["new", "confirmed", "shipped", "delivered", "all", "cancelled", "returned"]

const placed = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; q?: string }> }) {
  const params = await searchParams
  const status: OrderStatus | "all" = (ORDER_STATUSES as readonly string[]).includes(params.status ?? "") ? (params.status as OrderStatus) : params.status === "all" ? "all" : "new"
  const q = (params.q ?? "").slice(0, 60)

  let orders
  try {
    orders = await loadOrders({ status: q ? "all" : status, q })
  } catch (err) {
    if (err instanceof OrdersNotReady) {
      return (
        <div className="mx-auto max-w-narrow space-y-6">
          <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Orders</h1>
          <Notice tone="info">{err.message}</Notice>
        </div>
      )
    }
    return <DbError error={err} />
  }

  const exportHref = `/orders/export?status=${q ? "all" : status}${q ? `&q=${encodeURIComponent(q)}` : ""}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">Orders</h1>
        <form className="flex gap-2" action="/orders">
          <input type="hidden" name="status" value={status} />
          <input
            name="q"
            defaultValue={q}
            placeholder="Order number, phone or name"
            aria-label="Search orders"
            className="h-10 w-72 rounded-base border border-brand-border bg-white px-3 text-sm focus:border-brand-graphite focus:outline-none"
          />
          <button className="h-10 rounded-base bg-brand-graphite px-4 text-sm font-semibold text-brand-bone">Search</button>
        </form>
      </div>

      <nav aria-label="Order status" className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab}
            href={`/orders?status=${tab}`}
            aria-current={!q && tab === status ? "page" : undefined}
            className={clsx(
              "rounded-pill border px-3 py-1.5 text-sm font-semibold",
              !q && tab === status ? "border-brand-graphite bg-brand-graphite text-brand-bone" : "border-brand-border bg-white hover:border-brand-graphite"
            )}
          >
            {tab === "all" ? "All" : ORDER_STATUS_LABEL[tab]}
          </Link>
        ))}
        <a href={exportHref} className="ml-auto rounded-pill border border-brand-border bg-white px-3 py-1.5 text-sm font-semibold hover:border-brand-graphite">
          Download CSV
        </a>
      </nav>

      {q && (
        <p className="text-sm text-brand-muted">
          {orders.length} result{orders.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;.{" "}
          <Link href={`/orders?status=${status}`} className="underline">
            Clear search
          </Link>
        </p>
      )}

      {orders.length === 0 ? (
        <div className="rounded-panel border border-brand-border bg-white p-10 text-center text-brand-muted">
          {q ? "No orders match." : status === "new" ? "No new orders. New checkouts show here." : "No orders here."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-panel border border-brand-border bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-brand-border text-xs uppercase tracking-wider text-brand-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3 text-right">COD total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-brand-bone">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/orders/${o.id}`} className="hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-brand-muted">{placed(o.created_at)}</td>
                  <td className="px-4 py-3">
                    {o.name}
                    <span className="block text-xs text-brand-muted">{o.phone}</span>
                  </td>
                  <td className="px-4 py-3">{o.district}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatBdt(o.total_bdt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <OrderStatusBadge status={o.status} />
                      {o.email_status === "failed" && <Badge tone="warn">Email failed</Badge>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-brand-muted">Shows the latest 200 orders. Review and anonymise old orders once a year: open an order and use Remove personal details.</p>
    </div>
  )
}

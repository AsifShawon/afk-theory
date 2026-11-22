import Link from "next/link"
import { notFound } from "next/navigation"
import { formatBdt } from "@dtc/catalogue-core"
import { DbError } from "@/components/db-error"
import { OrderActions } from "@/components/order-actions"
import { OrderStatusBadge } from "@/components/order-status-badge"
import { Badge, Card, Notice } from "@/components/ui"
import { adminEmail, loadOrder, OrdersNotReady } from "@/lib/orders"

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })

const ZONE_LABEL: Record<string, string> = { inside_dhaka: "Inside Dhaka", dhaka_suburban: "Dhaka suburbs", outside_dhaka: "Outside Dhaka" }

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()

  let loaded
  try {
    loaded = await loadOrder(id)
  } catch (err) {
    if (err instanceof OrdersNotReady) return <Notice tone="info">{err.message}</Notice>
    return <DbError error={err} />
  }
  if (!loaded) notFound()
  const { order, items, events } = loaded
  const intl = `88${order.phone}`
  const anonymised = Boolean(order.anonymised_at)
  const mail = adminEmail()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/orders" className="text-sm font-semibold text-brand-muted hover:text-brand-graphite">
          Orders
        </Link>
        <span className="text-brand-muted-light">/</span>
        <h1 className="font-display text-3xl font-bold uppercase tracking-tight">{order.code}</h1>
        <OrderStatusBadge status={order.status} />
        {order.email_status === "failed" && <Badge tone="warn">Email failed</Badge>}
        {order.email_status === "pending" && <Badge tone="warn">Email not sent</Badge>}
        <span className="ml-auto text-sm text-brand-muted">Placed {when(order.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card title="Customer">
            {anonymised ? (
              <p className="text-sm text-brand-muted">Personal details were removed on {when(order.anonymised_at!)}.</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1 text-sm">
                  <p className="text-base font-semibold">{order.name}</p>
                  <p>{order.phone}</p>
                  {order.email ? <p>{order.email}</p> : <p className="text-brand-muted">No email</p>}
                  <div className="flex flex-wrap gap-2 pt-3">
                    <a href={`tel:+${intl}`} className="rounded-base bg-brand-graphite px-3 py-2 text-sm font-semibold text-brand-bone">
                      Call
                    </a>
                    <a href={`https://wa.me/${intl}`} target="_blank" rel="noreferrer" className="rounded-base border border-brand-border px-3 py-2 text-sm font-semibold hover:border-brand-graphite">
                      WhatsApp
                    </a>
                  </div>
                </div>
                <div className="space-y-1 text-sm">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Deliver to</p>
                  <p className="whitespace-pre-line">{order.address}</p>
                  <p>
                    {order.district} <span className="text-brand-muted">({ZONE_LABEL[order.zone] ?? order.zone})</span>
                  </p>
                </div>
                {order.note && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">Customer note</p>
                    <p className="mt-1 whitespace-pre-line text-sm">{order.note}</p>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card title="Items">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-brand-border">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-3 pr-4">
                      <p className="font-semibold">{item.product_name}</p>
                      <p className="text-xs text-brand-muted">{[item.design, item.color, item.size].filter(Boolean).join(" / ") || "One size"}</p>
                    </td>
                    <td className="whitespace-nowrap py-3 pr-4 text-brand-muted">
                      {item.quantity} x {formatBdt(item.unit_price_bdt)}
                    </td>
                    <td className="py-3 text-right font-semibold">{formatBdt(item.line_total_bdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <dl className="mt-4 space-y-1 border-t border-brand-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-brand-muted">Subtotal</dt>
                <dd>{formatBdt(order.subtotal_bdt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-brand-muted">Delivery</dt>
                <dd>{formatBdt(order.delivery_bdt)}</dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Collect on delivery</dt>
                <dd>{formatBdt(order.total_bdt)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="History">
            <ol className="space-y-2 text-sm">
              {events.map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-36 shrink-0 text-brand-muted">{when(e.created_at)}</span>
                  <span>
                    <span className={e.kind === "email_failed" ? "font-semibold text-red-700" : "font-semibold"}>{e.kind.replace(/_/g, " ")}</span>
                    {e.detail && <span className="text-brand-muted">: {e.detail}</span>}
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <OrderActions
          id={order.id}
          status={order.status}
          hasEmail={Boolean(order.email) && !anonymised}
          emailStatus={order.email_status}
          anonymised={anonymised}
          emailProblem={mail.problem}
        />
      </div>
    </div>
  )
}

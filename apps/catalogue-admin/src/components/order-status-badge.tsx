import { clsx } from "clsx"
import { ORDER_STATUS_LABEL, type OrderStatus } from "@dtc/catalogue-core/orders"

const TONE: Record<OrderStatus, string> = {
  new: "bg-brand-accent text-brand-graphite",
  confirmed: "bg-sky-100 text-sky-900",
  shipped: "bg-indigo-100 text-indigo-900",
  delivered: "bg-green-100 text-green-900",
  cancelled: "bg-brand-stone text-brand-muted",
  returned: "bg-amber-100 text-amber-900",
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={clsx("inline-flex items-center rounded-pill px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider", TONE[status])}>
      {ORDER_STATUS_LABEL[status] ?? status}
    </span>
  )
}

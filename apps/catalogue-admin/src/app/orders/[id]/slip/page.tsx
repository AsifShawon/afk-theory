import { notFound } from "next/navigation"
import { formatBdtPlain } from "@dtc/catalogue-core"
import { PrintButton } from "@/components/print-button"
import { loadOrder } from "@/lib/orders"

/** A slip to print and tape to the parcel, or to copy into the courier's booking form. */
export default async function SlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const loaded = await loadOrder(id)
  if (!loaded) notFound()
  const { order, items } = loaded

  return (
    <div className="mx-auto max-w-[560px] space-y-4">
      <div className="flex justify-end print:hidden">
        <PrintButton />
      </div>
      <article className="border-2 border-black bg-white p-6 text-black">
        <header className="flex items-start justify-between border-b-2 border-black pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">AFK THEORY</p>
            <p className="text-2xl font-bold">{order.code}</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase">Cash on delivery</p>
            <p className="text-3xl font-bold">{formatBdtPlain(order.total_bdt)}</p>
          </div>
        </header>
        <section className="border-b border-black py-3">
          <p className="text-xs font-bold uppercase">To</p>
          <p className="text-lg font-bold">{order.name}</p>
          <p className="text-lg font-bold">{order.phone}</p>
          <p className="whitespace-pre-line">{order.address}</p>
          <p className="font-bold">{order.district}</p>
        </section>
        <section className="py-3 text-sm">
          <p className="text-xs font-bold uppercase">Contents</p>
          <ul>
            {items.map((i) => (
              <li key={i.id}>
                {i.quantity} x {i.product_name}
                {[i.design, i.color, i.size].filter(Boolean).length ? ` (${[i.design, i.color, i.size].filter(Boolean).join(" / ")})` : ""}
              </li>
            ))}
          </ul>
          {order.note && <p className="mt-2 border-t border-dashed border-black pt-2">Note: {order.note}</p>}
        </section>
      </article>
    </div>
  )
}

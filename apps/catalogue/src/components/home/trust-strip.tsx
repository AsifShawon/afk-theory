import { formatBdt, type SiteSettings } from "@dtc/catalogue-core"
import { MessengerIcon, PauseMark, WhatsAppIcon } from "@/components/ui/icons"

/**
 * Four short reasons to order, built from the site settings: payment,
 * delivery fee and time, ordering by chat, and where it is made.
 */
export function TrustStrip({ settings }: { settings: SiteSettings }) {
  const zones = [...settings.deliveryZones].sort((a, b) => a.feeBdt - b.feeBdt)
  const cheapest = zones[0]

  const items = [
    { title: "Cash on delivery", body: "Pay the courier when your parcel arrives.", icon: <span className="display text-2xl leading-none">৳</span> },
    cheapest && {
      title: `Delivery from ${formatBdt(cheapest.feeBdt)}`,
      body: `${cheapest.name}${cheapest.eta ? ` in ${cheapest.eta}` : ""}. All of Bangladesh.`,
      icon: <span className="font-hud text-sm">BD</span>,
    },
    {
      title: "Order in one message",
      body: "WhatsApp or Messenger. Your order is written for you.",
      icon: (
        <span className="flex gap-1">
          <WhatsAppIcon size={16} />
          <MessengerIcon size={16} />
        </span>
      ),
    },
    { title: "Made in Bangladesh", body: "Designed and made here, offline by choice.", icon: <PauseMark size={20} /> },
  ].filter(Boolean) as { title: string; body: string; icon: React.ReactNode }[]

  return (
    <section aria-label="Why order from AFK THEORY" className="bg-brand-accent text-brand-graphite">
      <ul className="mx-auto grid max-w-editorial grid-cols-2 gap-px bg-brand-graphite/15 md:grid-cols-4">
        {items.map((item) => (
          <li key={item.title} className="flex flex-col gap-3 bg-brand-accent px-5 py-8 md:px-8 md:py-10">
            <span className="flex h-10 w-10 items-center justify-center border-2 border-brand-graphite">{item.icon}</span>
            <p className="display text-xl leading-none md:text-2xl">{item.title}</p>
            <p className="text-sm text-brand-graphite/75">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

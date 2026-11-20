import { formatBdt, type SiteSettings } from "@dtc/catalogue-core"
import { MessengerIcon, WhatsAppIcon } from "@/components/ui/icons"
import { Reveal } from "@/components/motion/reveal"

const STEPS = [
  {
    title: "Pick your size",
    body: "Choose the color, size and quantity on any product. Add more than one piece to your order list if you like.",
  },
  {
    title: "Send one message",
    body: "Tap WhatsApp or Messenger. Your order is written for you. Add your name, phone and address, then send.",
  },
  {
    title: "Pay on delivery",
    body: "We confirm in the chat and ship it. Pay the courier in cash when the parcel reaches you.",
  },
]

export function HowToOrder({ settings }: { settings: SiteSettings }) {
  return (
    <section id="how-to-order" aria-labelledby="how-title" className="bg-brand-bone py-24 text-brand-graphite md:py-32">
      <div className="mx-auto max-w-editorial px-5 md:px-10">
        <Reveal>
          <p className="font-hud text-[11px] text-brand-olive">No account. No card. No checkout.</p>
          <h2 id="how-title" className="display mt-3 text-6xl md:text-8xl">
            How to order
          </h2>
        </Reveal>

        <ol className="mt-14 grid gap-px bg-brand-graphite/15 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="flex flex-col bg-brand-bone p-6 md:p-8">
              <span className="display text-7xl text-brand-graphite/15 md:text-8xl" aria-hidden>
                {i + 1}
              </span>
              <h3 className="display mt-6 text-2xl">
                <span className="sr-only">Step {i + 1}: </span>
                {step.title}
              </h3>
              <p className="mt-3 text-brand-olive">{step.body}</p>
              {i === 1 && (
                <div className="mt-5 flex gap-3 text-brand-graphite" aria-hidden>
                  <WhatsAppIcon size={22} />
                  <MessengerIcon size={22} />
                </div>
              )}
            </Reveal>
          ))}
        </ol>

        {settings.deliveryZones.length > 0 && (
          <Reveal className="mt-20">
            <h3 className="font-hud text-[11px] text-brand-olive">Delivery charges</h3>
            <table className="mt-4 w-full border-collapse text-left">
              <thead className="sr-only">
                <tr>
                  <th>Zone</th>
                  <th>Areas</th>
                  <th>Delivery time</th>
                  <th>Charge</th>
                </tr>
              </thead>
              <tbody>
                {settings.deliveryZones.map((zone) => (
                  <tr key={zone.name} className="border-t border-brand-graphite/15 align-top">
                    <th scope="row" className="display py-5 pr-4 text-xl md:text-2xl">
                      {zone.name}
                    </th>
                    <td className="hidden py-5 pr-4 text-sm text-brand-olive md:table-cell">{zone.area}</td>
                    <td className="font-hud py-5 pr-4 text-[11px] text-brand-olive">{zone.eta}</td>
                    <td className="font-hud py-5 text-right text-base tracking-normal">{formatBdt(zone.feeBdt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        )}
      </div>
    </section>
  )
}

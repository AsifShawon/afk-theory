import type { Metadata } from "next"
import Link from "next/link"
import { CheckoutView } from "@/components/checkout/checkout-view"
import { WhatsAppIcon } from "@/components/ui/icons"
import { getCatalogue } from "@/lib/catalogue"
import { CHECKOUT_ENABLED } from "@/lib/checkout"

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const { settings, pages } = await getCatalogue()
  const privacyHref = pages.some((p) => p.slug === "privacy") ? "/privacy/" : null

  if (!CHECKOUT_ENABLED) {
    return (
      <div className="mx-auto max-w-3xl px-5 pb-28 pt-28 md:px-10 md:pt-36">
        <h1 className="display text-5xl md:text-7xl">Checkout</h1>
        <p className="mt-6 text-lg text-brand-bone/70">Online checkout opens soon. Until then, open your cart and send the order on WhatsApp or Messenger.</p>
        <Link href="/shop/" className="btn-signal mt-8">
          Back to the shop
        </Link>
      </div>
    )
  }

  return (
    <>
      <noscript>
        <div className="mx-auto max-w-3xl px-5 pt-28 md:px-10">
          <p className="border border-white/15 p-4 text-sm">
            Checkout needs JavaScript. You can still order by message:{" "}
            {settings.whatsappNumber && (
              <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, "")}`} className="text-brand-accent underline">
                <WhatsAppIcon size={14} /> WhatsApp
              </a>
            )}
          </p>
        </div>
      </noscript>
      <CheckoutView settings={settings} privacyHref={privacyHref} />
    </>
  )
}

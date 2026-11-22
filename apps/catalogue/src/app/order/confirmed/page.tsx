import type { Metadata } from "next"
import { OrderConfirmedView } from "@/components/checkout/order-confirmed-view"
import { getCatalogue } from "@/lib/catalogue"

export const metadata: Metadata = {
  title: "Order placed",
  robots: { index: false, follow: false },
}

export default async function OrderConfirmedPage() {
  const { settings } = await getCatalogue()
  return (
    <div className="mx-auto max-w-editorial px-5 pb-28 pt-28 md:px-10 md:pt-36">
      <OrderConfirmedView whatsappNumber={settings.whatsappNumber} />
    </div>
  )
}

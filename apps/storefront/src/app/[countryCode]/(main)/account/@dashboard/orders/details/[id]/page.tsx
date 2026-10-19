import { retrieveOrder } from "@lib/data/orders"
import { constructMetadata } from "@lib/util/seo"
import OrderDetailsTemplate from "@modules/order/templates/order-details-template"
import { Metadata } from "next"
import { notFound } from "next/navigation"

type Props = {
  params: Promise<{ id: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return constructMetadata({
    title: `Order #${order.display_id} | AFK THEORY`,
    description: `View details and tracking for AFK THEORY order #${order.display_id}.`,
    noIndex: true,
  })
}

export default async function OrderDetailPage(props: Props) {
  const params = await props.params
  const order = await retrieveOrder(params.id).catch(() => null)

  if (!order) {
    notFound()
  }

  return <OrderDetailsTemplate order={order} />
}

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notifyOrderCanceled } from "../modules/email-notifications/order-notifications"

export default async function orderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await notifyOrderCanceled(container, data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error(`[Subscriber: order.canceled] Failed to send email: ${msg}`)
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
}

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { notifyOrderDelivered } from "../modules/email-notifications/order-notifications"

export default async function orderDeliveredHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; no_notification?: boolean }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  try {
    await notifyOrderDelivered(container, data)
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error(`[Subscriber: delivery.created] Failed to send email: ${msg}`)
  }
}

export const config: SubscriberConfig = {
  event: "delivery.created",
}

import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { emailService as defaultEmailService, type SendEmailOptions } from "./email-service"
import {
  generateOrderCanceledEmail,
  generateOrderDeliveredEmail,
  generateOrderShippedEmail,
  generateOwnerOrderAlertEmail,
  type GeneratedEmail,
  type OrderEmailOrder,
  type TrackingInfo,
} from "./templates/order-status"

type ContainerLike = { resolve: (key: string) => any }

type Sender = { sendEmail: (options: SendEmailOptions) => Promise<{ success: boolean }> }

type LoadedOrder = OrderEmailOrder & {
  fulfillments?: {
    id: string
    labels?: { tracking_number?: string | null; tracking_url?: string | null }[]
  }[]
}

export const ORDER_EMAIL_FIELDS = [
  "id",
  "display_id",
  "email",
  "currency_code",
  "total",
  "subtotal",
  "shipping_total",
  "discount_total",
  "tax_total",
  "items.*",
  "shipping_address.*",
  "fulfillments.id",
  "fulfillments.labels.*",
]

export async function loadOrderForEmail(
  container: ContainerLike,
  orderId: string
): Promise<LoadedOrder | undefined> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ORDER_EMAIL_FIELDS,
    filters: { id: orderId },
  })
  return data?.[0] as LoadedOrder | undefined
}

/**
 * Shipment and delivery events carry a fulfillment id, not an order id.
 */
export async function findOrderIdByFulfillmentId(
  container: ContainerLike,
  fulfillmentId: string
): Promise<string | undefined> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order_fulfillment",
    fields: ["order_id", "fulfillment_id"],
    filters: { fulfillment_id: fulfillmentId },
  })
  return data?.[0]?.order_id as string | undefined
}

/**
 * Tracking details entered when the shipment was created in the admin.
 */
export function getTrackingForFulfillment(
  order: LoadedOrder,
  fulfillmentId: string
): TrackingInfo {
  const fulfillment = order.fulfillments?.find((f) => f.id === fulfillmentId)
  const label = fulfillment?.labels?.find((l) => l.tracking_number || l.tracking_url)
  return { number: label?.tracking_number, url: label?.tracking_url }
}

async function deliver(
  sender: Sender,
  to: string,
  email: GeneratedEmail
): Promise<void> {
  await sender.sendEmail({ to, subject: email.subject, html: email.html, text: email.text })
}

type Logger = { info: (m: string) => void; warn: (m: string) => void; error: (m: string) => void }

type FulfillmentEventData = { id: string; no_notification?: boolean }

export async function notifyOrderShipped(
  container: ContainerLike,
  data: FulfillmentEventData,
  sender: Sender = defaultEmailService
): Promise<"sent" | "skipped"> {
  const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (data.no_notification) return "skipped"

  const orderId = await findOrderIdByFulfillmentId(container, data.id)
  const order = orderId ? await loadOrderForEmail(container, orderId) : undefined
  if (!order?.email) {
    logger.warn(`[order shipped email] No order email found for fulfillment ${data.id}.`)
    return "skipped"
  }

  await deliver(
    sender,
    order.email,
    generateOrderShippedEmail({ order, tracking: getTrackingForFulfillment(order, data.id) })
  )
  logger.info(`[order shipped email] Sent for order #${order.display_id}.`)
  return "sent"
}

export async function notifyOrderDelivered(
  container: ContainerLike,
  data: FulfillmentEventData,
  sender: Sender = defaultEmailService
): Promise<"sent" | "skipped"> {
  const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  if (data.no_notification) return "skipped"

  const orderId = await findOrderIdByFulfillmentId(container, data.id)
  const order = orderId ? await loadOrderForEmail(container, orderId) : undefined
  if (!order?.email) {
    logger.warn(`[order delivered email] No order email found for fulfillment ${data.id}.`)
    return "skipped"
  }

  await deliver(sender, order.email, generateOrderDeliveredEmail({ order }))
  logger.info(`[order delivered email] Sent for order #${order.display_id}.`)
  return "sent"
}

export async function notifyOrderCanceled(
  container: ContainerLike,
  data: { id: string },
  sender: Sender = defaultEmailService
): Promise<"sent" | "skipped"> {
  const logger: Logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const order = await loadOrderForEmail(container, data.id)
  if (!order?.email) {
    logger.warn(`[order canceled email] No order email found for order ${data.id}.`)
    return "skipped"
  }

  await deliver(sender, order.email, generateOrderCanceledEmail({ order }))
  logger.info(`[order canceled email] Sent for order #${order.display_id}.`)
  return "sent"
}

/**
 * Comma-separated ORDER_NOTIFICATION_EMAIL addresses that receive an alert for every new order.
 */
export function getOwnerNotificationRecipients(env: NodeJS.ProcessEnv = process.env): string[] {
  return (env.ORDER_NOTIFICATION_EMAIL || "")
    .split(",")
    .map((address) => address.trim())
    .filter((address) => address.includes("@"))
}

export async function notifyOwnerNewOrder(
  order: OrderEmailOrder,
  sender: Sender = defaultEmailService,
  env: NodeJS.ProcessEnv = process.env
): Promise<number> {
  const recipients = getOwnerNotificationRecipients(env)
  if (recipients.length === 0) return 0

  const backendUrl = (env.MEDUSA_BACKEND_URL || "http://localhost:9000").replace(/\/$/, "")
  const email = generateOwnerOrderAlertEmail({
    order,
    adminUrl: `${backendUrl}/app/orders/${order.id}`,
  })

  for (const to of recipients) {
    await deliver(sender, to, email)
  }
  return recipients.length
}

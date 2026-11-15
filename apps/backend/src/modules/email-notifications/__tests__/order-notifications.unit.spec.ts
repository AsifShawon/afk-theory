import {
  getOwnerNotificationRecipients,
  getTrackingForFulfillment,
  notifyOrderCanceled,
  notifyOrderDelivered,
  notifyOrderShipped,
  notifyOwnerNewOrder,
} from "../order-notifications"
import {
  generateOrderCanceledEmail,
  generateOrderDeliveredEmail,
  generateOrderShippedEmail,
  generateOwnerOrderAlertEmail,
} from "../templates/order-status"
import { escapeHtml, safeHttpUrl } from "../templates/layout"
import { generateOrderPlacedEmail } from "../templates/order-placed"

const baseOrder = {
  id: "order_01HXYZ123456",
  display_id: 1042,
  email: "customer@example.com",
  currency_code: "bdt",
  total: 3060,
  subtotal: 3000,
  shipping_total: 60,
  items: [
    { product_title: "Drop Shoulder Tee", variant_title: "M / Black", quantity: 2, unit_price: 1450 },
  ],
  shipping_address: {
    first_name: "Rafi",
    last_name: "Ahmed",
    address_1: "House 4, Road 2",
    city: "Dhaka",
    postal_code: "1205",
    phone: "01712345678",
  },
  fulfillments: [
    {
      id: "ful_1",
      labels: [
        { tracking_number: "PTH-998877", tracking_url: "https://courier.example/track/PTH-998877" },
      ],
    },
    { id: "ful_2", labels: [] },
  ],
}

type SentEmail = { to: string; subject: string; html: string; text?: string }

function makeContainer(options: { order?: unknown; orderId?: string | null } = {}) {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() }
  const graph = jest.fn(async ({ entity }: { entity: string }) => {
    if (entity === "order_fulfillment") {
      const id = options.orderId === undefined ? baseOrder.id : options.orderId
      return { data: id ? [{ order_id: id, fulfillment_id: "ful_1" }] : [] }
    }
    return { data: options.order ? [options.order] : [] }
  })
  const container = {
    resolve: (key: string) => (key === "logger" ? logger : { graph }),
  }
  return { container, logger, graph }
}

function makeSender() {
  const sendEmail = jest.fn(async (_options: SentEmail) => ({ success: true }))
  return { sendEmail, sent: () => sendEmail.mock.calls.map((call) => call[0]) }
}

describe("order status notifications", () => {
  it("sends a shipped email with the tracking details", async () => {
    const { container } = makeContainer({ order: baseOrder })
    const sender = makeSender()

    const result = await notifyOrderShipped(container, { id: "ful_1" }, sender)

    expect(result).toBe("sent")
    expect(sender.sendEmail).toHaveBeenCalledTimes(1)
    const [email] = sender.sent()
    expect(email.to).toBe("customer@example.com")
    expect(email.subject).toContain("#1042")
    expect(email.html).toContain("PTH-998877")
    expect(email.html).toContain("https://courier.example/track/PTH-998877")
    expect(email.text).toContain("3,060 BDT")
  })

  it("respects no_notification and sends nothing", async () => {
    const { container, graph } = makeContainer({ order: baseOrder })
    const sender = makeSender()

    expect(await notifyOrderShipped(container, { id: "ful_1", no_notification: true }, sender)).toBe("skipped")
    expect(await notifyOrderDelivered(container, { id: "ful_1", no_notification: true }, sender)).toBe("skipped")
    expect(sender.sendEmail).not.toHaveBeenCalled()
    expect(graph).not.toHaveBeenCalled()
  })

  it("skips quietly when the order cannot be found", async () => {
    const { container, logger } = makeContainer({ orderId: null })
    const sender = makeSender()

    expect(await notifyOrderShipped(container, { id: "ful_1" }, sender)).toBe("skipped")
    expect(sender.sendEmail).not.toHaveBeenCalled()
    expect(logger.warn).toHaveBeenCalled()
  })

  it("sends delivered and cancelled emails", async () => {
    const { container } = makeContainer({ order: baseOrder })
    const sender = makeSender()

    expect(await notifyOrderDelivered(container, { id: "ful_1" }, sender)).toBe("sent")
    expect(await notifyOrderCanceled(container, { id: baseOrder.id }, sender)).toBe("sent")

    const subjects = sender.sent().map((email) => email.subject)
    expect(subjects[0]).toContain("was delivered")
    expect(subjects[1]).toContain("was cancelled")
  })

  it("skips orders without a customer email", async () => {
    const { container } = makeContainer({ order: { ...baseOrder, email: null } })
    const sender = makeSender()
    expect(await notifyOrderCanceled(container, { id: baseOrder.id }, sender)).toBe("skipped")
    expect(sender.sendEmail).not.toHaveBeenCalled()
  })

  it("finds tracking only for the shipped fulfillment", () => {
    expect(getTrackingForFulfillment(baseOrder, "ful_1")).toEqual({
      number: "PTH-998877",
      url: "https://courier.example/track/PTH-998877",
    })
    expect(getTrackingForFulfillment(baseOrder, "ful_2")).toEqual({ number: undefined, url: undefined })
    expect(getTrackingForFulfillment(baseOrder, "missing")).toEqual({ number: undefined, url: undefined })
  })
})

describe("owner new-order alert", () => {
  it("parses recipients and ignores blanks", () => {
    const env = { ORDER_NOTIFICATION_EMAIL: " a@x.com, ,b@y.com,notanemail" } as unknown as NodeJS.ProcessEnv
    expect(getOwnerNotificationRecipients(env)).toEqual(["a@x.com", "b@y.com"])
    expect(getOwnerNotificationRecipients({} as NodeJS.ProcessEnv)).toEqual([])
  })

  it("sends nothing when no recipient is configured", async () => {
    const sender = makeSender()
    expect(await notifyOwnerNewOrder(baseOrder, sender, {} as NodeJS.ProcessEnv)).toBe(0)
    expect(sender.sendEmail).not.toHaveBeenCalled()
  })

  it("sends one alert per recipient with phone, address and amount to collect", async () => {
    const sender = makeSender()
    const env = {
      ORDER_NOTIFICATION_EMAIL: "owner@afktheory.com,ops@afktheory.com",
      MEDUSA_BACKEND_URL: "https://api.afktheory.com/",
    } as unknown as NodeJS.ProcessEnv

    const count = await notifyOwnerNewOrder(baseOrder, sender, env)

    expect(count).toBe(2)
    const [first] = sender.sent()
    expect(first.to).toBe("owner@afktheory.com")
    expect(first.html).toContain("01712345678")
    expect(first.html).toContain("https://api.afktheory.com/app/orders/order_01HXYZ123456")
    expect(first.text).toContain("Collect on delivery: 3,060 BDT")
  })
})

describe("email safety", () => {
  const hostile = {
    ...baseOrder,
    items: [
      {
        product_title: "<img src=x onerror=alert(1)>",
        variant_title: "\"><script>x</script>",
        quantity: 1,
        unit_price: 100,
      },
    ],
    shipping_address: {
      first_name: "<b>Evil</b>",
      last_name: "O'Hara",
      address_1: "<script>alert(1)</script>",
      city: "Dhaka",
      phone: "017",
    },
  }

  it("escapes customer-entered text in every email", () => {
    const emails = [
      generateOrderShippedEmail({ order: hostile }),
      generateOrderDeliveredEmail({ order: hostile }),
      generateOrderCanceledEmail({ order: hostile }),
      generateOwnerOrderAlertEmail({ order: hostile }),
      generateOrderPlacedEmail({ order: hostile }),
    ]

    for (const email of emails) {
      expect(email.html).not.toContain("<script>")
      expect(email.html).not.toContain("<img src=x")
      expect(email.html).not.toContain("<b>Evil</b>")
    }
  })

  it("escapeHtml handles all special characters", () => {
    expect(escapeHtml(`<a href="x">&'</a>`)).toBe("&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;")
    expect(escapeHtml(undefined)).toBe("")
  })

  it("only links http(s) tracking URLs", () => {
    expect(safeHttpUrl("javascript:alert(1)")).toBeUndefined()
    expect(safeHttpUrl("data:text/html,x")).toBeUndefined()
    expect(safeHttpUrl("not a url")).toBeUndefined()
    expect(safeHttpUrl("https://courier.example/t/1")).toBe("https://courier.example/t/1")

    const email = generateOrderShippedEmail({
      order: baseOrder,
      tracking: { number: "X1", url: "javascript:alert(1)" },
    })
    expect(email.html).not.toContain("javascript:")
    expect(email.html).toContain("X1")
  })
})

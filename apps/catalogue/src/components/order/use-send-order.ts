"use client"

import { useCallback } from "react"
import type { SiteSettings } from "@dtc/catalogue-core"
import { buildOrderMessage, createOrderCode, messengerUrl, whatsappUrl, type OrderLine } from "@/lib/order-message"
import { useOrder } from "./order-provider"

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Older browsers and some in-app browsers block the async clipboard API.
    const area = document.createElement("textarea")
    area.value = text
    area.setAttribute("readonly", "")
    area.style.position = "fixed"
    area.style.opacity = "0"
    document.body.appendChild(area)
    area.select()
    const ok = document.execCommand("copy")
    area.remove()
    return ok
  }
}

/**
 * Opens WhatsApp or Messenger with the order. Must be called directly from a
 * click so the browser allows the new tab.
 */
export function useSendOrder(settings: SiteSettings) {
  const { showToast } = useOrder()

  const channels = {
    whatsapp: Boolean(whatsappUrl(settings.whatsappNumber, "x")),
    messenger: Boolean(messengerUrl(settings.messengerPage, "x")),
  }

  const send = useCallback(
    (channel: "whatsapp" | "messenger", lines: OrderLine[]) => {
      if (lines.length === 0) return
      const code = createOrderCode()
      const message = buildOrderMessage({ code, lines, deliveryZones: settings.deliveryZones })

      if (channel === "whatsapp") {
        const url = whatsappUrl(settings.whatsappNumber, message)
        if (url) window.open(url, "_blank", "noopener")
        return
      }

      const url = messengerUrl(settings.messengerPage, code)
      if (!url) return
      // Open first, inside the click, so pop-up blockers allow it.
      window.open(url, "_blank", "noopener")
      void copyText(message).then((ok) =>
        showToast(
          ok
            ? `Order ${code} copied. Paste it in the Messenger chat and send.`
            : `Copy failed. Tell us your order code ${code} in the chat.`
        )
      )
    },
    [settings, showToast]
  )

  return { send, channels, hasChannel: channels.whatsapp || channels.messenger }
}

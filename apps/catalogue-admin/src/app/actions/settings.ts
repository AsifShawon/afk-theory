"use server"

import { revalidatePath } from "next/cache"
import {
  normalizeInstagramHandle,
  normalizeMessengerPage,
  normalizeWhatsappNumber,
  settingsInputSchema,
  TABLES,
} from "@dtc/catalogue-core"
import { fail, zodFail, type ActionResult } from "@/lib/action-result"
import { getAdmin } from "@/lib/supabase-server"

export async function saveSettings(input: Record<string, unknown>): Promise<ActionResult> {
  // Accept pasted links and local numbers, then validate the cleaned values.
  const cleaned = {
    ...input,
    whatsappNumber: input.whatsappNumber ? normalizeWhatsappNumber(String(input.whatsappNumber)) || String(input.whatsappNumber) : "",
    messengerPage: normalizeMessengerPage(String(input.messengerPage ?? "")),
    instagramHandle: normalizeInstagramHandle(String(input.instagramHandle ?? "")),
  }
  const parsed = settingsInputSchema.safeParse(cleaned)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const { client } = getAdmin()
    const s = parsed.data
    const { error } = await client.from(TABLES.settings).upsert({
      id: 1,
      whatsapp_number: s.whatsappNumber,
      messenger_page: s.messengerPage,
      instagram_handle: s.instagramHandle,
      hero_title: s.heroTitle,
      hero_subtitle: s.heroSubtitle,
      announcement: s.announcement,
      delivery_zones: s.deliveryZones,
      faq: s.faq,
    })
    if (error) throw new Error(error.message)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined, message: "Settings saved" }
  } catch (err) {
    return fail(err)
  }
}

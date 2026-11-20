"use server"

import { revalidatePath } from "next/cache"
import {
  categoryInputSchema,
  normalizeInstagramHandle,
  normalizeMessengerPage,
  normalizeWhatsappNumber,
  settingsInputSchema,
  TABLES,
} from "@dtc/catalogue-core"
import { z } from "zod"
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

export async function saveCategory(id: string | null, input: unknown): Promise<ActionResult> {
  const parsed = categoryInputSchema.safeParse(input)
  if (!parsed.success) {
    return zodFail(parsed.error)
  }
  try {
    const { client } = getAdmin()
    if (id) {
      const { error } = await client.from(TABLES.categories).update(parsed.data).eq("id", id)
      if (error) throw new Error(error.message)
    } else {
      const { count } = await client.from(TABLES.categories).select("id", { count: "exact", head: true })
      const { error } = await client.from(TABLES.categories).insert({ ...parsed.data, sort_order: count ?? 0 })
      if (error) {
        throw new Error(error.message.includes("categories_slug_key") ? "That category already exists" : error.message)
      }
    }
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const { client } = getAdmin()
    z.string().uuid().parse(id)
    const { error } = await client.from(TABLES.categories).delete().eq("id", id)
    if (error) throw new Error(error.message)
    revalidatePath("/", "layout")
    return { ok: true, data: undefined }
  } catch (err) {
    return fail(err)
  }
}

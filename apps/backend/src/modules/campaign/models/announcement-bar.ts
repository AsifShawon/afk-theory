import { model } from "@medusajs/framework/utils"

export const AnnouncementBar = model.define("announcement_bar", {
  id: model.id({ prefix: "annc" }).primaryKey(),
  text: model.text(),
  link_url: model.text().nullable(),
  is_active: model.boolean().default(true),
  desktop_autoplay: model.boolean().default(false),
  autoplay_interval_ms: model.number().default(6000),
})

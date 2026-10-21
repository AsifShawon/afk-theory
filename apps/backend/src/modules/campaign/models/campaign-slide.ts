import { model } from "@medusajs/framework/utils"

export const CampaignSlide = model.define("campaign_slide", {
  id: model.id({ prefix: "campsl" }).primaryKey(),
  title: model.text(),
  subtitle: model.text().nullable(),
  eyebrow: model.text().nullable(),
  description: model.text().nullable(),
  desktop_image_url: model.text(),
  mobile_image_url: model.text().nullable(),
  primary_cta_label: model.text().nullable(),
  primary_cta_url: model.text().nullable(),
  secondary_cta_label: model.text().nullable(),
  secondary_cta_url: model.text().nullable(),
  text_alignment: model.enum(["left", "center", "right"]).default("left"),
  focal_position: model.text().default("center"),
  overlay_strength: model.enum(["none", "subtle", "medium", "strong"]).default("medium"),
  display_order: model.number().default(0),
  is_active: model.boolean().default(true),
  status: model.enum(["draft", "published"]).default("published"),
  starts_at: model.dateTime().nullable(),
  ends_at: model.dateTime().nullable(),
  metadata: model.json().nullable(),
})

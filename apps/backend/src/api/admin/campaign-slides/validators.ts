import { z } from "@medusajs/framework/zod"

export const CampaignSlideSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().nullable().optional(),
  eyebrow: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  desktop_image_url: z.string().min(1, "Desktop image is required"),
  mobile_image_url: z.string().nullable().optional(),
  primary_cta_label: z.string().nullable().optional(),
  primary_cta_url: z
    .string()
    .refine((val) => !val || val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"), {
      message: "CTA destination must be a relative path (e.g. /store) or a valid URL",
    })
    .nullable()
    .optional(),
  secondary_cta_label: z.string().nullable().optional(),
  secondary_cta_url: z
    .string()
    .refine((val) => !val || val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"), {
      message: "Secondary CTA destination must be a relative path or valid URL",
    })
    .nullable()
    .optional(),
  text_alignment: z.enum(["left", "center", "right"]).default("left"),
  focal_position: z.string().default("center"),
  overlay_strength: z.enum(["none", "subtle", "medium", "strong"]).default("medium"),
  display_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
  status: z.enum(["draft", "published"]).default("published"),
  starts_at: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  ends_at: z.string().datetime().nullable().optional().or(z.date().nullable().optional()),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
})

export const AnnouncementBarSchema = z.object({
  text: z.string().min(1, "Announcement text is required"),
  link_url: z
    .string()
    .refine((val) => !val || val.startsWith("/") || val.startsWith("https://") || val.startsWith("http://"), {
      message: "Link URL must be a relative path or valid URL",
    })
    .nullable()
    .optional(),
  is_active: z.boolean().default(true),
  desktop_autoplay: z.boolean().default(false),
  autoplay_interval_ms: z.number().int().min(1000).max(60000).default(6000),
})

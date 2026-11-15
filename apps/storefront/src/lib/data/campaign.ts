import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"
import {
  AnnouncementBarView,
  CampaignSlideView,
  DEFAULT_ANNOUNCEMENT,
  DEFAULT_CAMPAIGN_SLIDES,
} from "@dtc/commerce-contracts"

interface ApiCampaignSlide {
  id: string
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  description?: string | null
  desktop_image_url: string
  mobile_image_url?: string | null
  primary_cta_label?: string | null
  primary_cta_url?: string | null
  secondary_cta_label?: string | null
  secondary_cta_url?: string | null
  text_alignment?: "left" | "center" | "right"
  focal_position?: "center" | "top" | "bottom"
  overlay_strength?: "none" | "subtle" | "medium" | "strong" | "light" | "heavy"
  display_order: number
}

interface ApiAnnouncementBar {
  text: string
  link_url?: string | null
  is_active: boolean
  desktop_autoplay: boolean
  autoplay_interval_ms: number
}

const normalizeOverlayStrength = (
  strength?: string | null
): "none" | "subtle" | "medium" | "strong" | undefined => {
  if (!strength) return undefined
  if (strength === "light") return "subtle"
  if (strength === "heavy") return "strong"
  if (strength === "none" || strength === "subtle" || strength === "medium" || strength === "strong") {
    return strength
  }
  return "medium"
}

export const getCampaignSlides = async (): Promise<CampaignSlideView[]> => {
  try {
    const next = {
      ...(await getCacheOptions("campaign_slides")),
      revalidate: 60,
    }

    const res = await sdk.client.fetch<{ campaign_slides: ApiCampaignSlide[] }>(
      "/store/campaign-slides",
      {
        next,
        cache: "force-cache",
      }
    )

    if (res?.campaign_slides && res.campaign_slides.length > 0) {
      return res.campaign_slides.map((s) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle ?? undefined,
        eyebrow: s.eyebrow ?? undefined,
        description: s.description ?? undefined,
        desktopImageUrl: s.desktop_image_url,
        mobileImageUrl: s.mobile_image_url ?? undefined,
        primaryCtaLabel: s.primary_cta_label ?? undefined,
        primaryCtaUrl: s.primary_cta_url ?? undefined,
        secondaryCtaLabel: s.secondary_cta_label ?? undefined,
        secondaryCtaUrl: s.secondary_cta_url ?? undefined,
        textAlignment: s.text_alignment,
        focalPosition: s.focal_position,
        overlayStrength: normalizeOverlayStrength(s.overlay_strength),
        displayOrder: s.display_order,
      }))
    }
  } catch {
    // Graceful fallback to default brand campaigns
  }

  return DEFAULT_CAMPAIGN_SLIDES
}

export const getAnnouncementBar = async (): Promise<AnnouncementBarView> => {
  try {
    const next = {
      ...(await getCacheOptions("announcement_bar")),
      revalidate: 60,
    }

    const res = await sdk.client.fetch<{ announcement_bar: ApiAnnouncementBar }>(
      "/store/announcement-bar",
      {
        next,
        cache: "force-cache",
      }
    )

    if (res?.announcement_bar) {
      const a = res.announcement_bar
      return {
        text: a.text,
        linkUrl: a.link_url ?? undefined,
        isActive: a.is_active,
        desktopAutoplay: a.desktop_autoplay,
        autoplayIntervalMs: a.autoplay_interval_ms,
      }
    }
  } catch {
    // Graceful fallback
  }

  return DEFAULT_ANNOUNCEMENT
}

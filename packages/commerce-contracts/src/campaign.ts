export interface CampaignSlideView {
  id: string
  title: string
  subtitle?: string | null
  eyebrow?: string | null
  description?: string | null
  desktopImageUrl: string
  mobileImageUrl?: string | null
  primaryCtaLabel?: string | null
  primaryCtaUrl?: string | null
  secondaryCtaLabel?: string | null
  secondaryCtaUrl?: string | null
  textAlignment?: "left" | "center" | "right"
  focalPosition?: string
  overlayStrength?: "none" | "subtle" | "medium" | "strong"
  displayOrder?: number
}

export interface AnnouncementBarView {
  text: string
  linkUrl?: string | null
  isActive: boolean
  desktopAutoplay?: boolean
  autoplayIntervalMs?: number
}

export const DEFAULT_CAMPAIGN_SLIDES: CampaignSlideView[] = [
  {
    id: "default-hero-drop-01",
    title: "OFFLINE BY CHOICE.",
    subtitle: "PAUSE THE GAME. KEEP YOUR STYLE.",
    eyebrow: "DROP 01 // OVERSIZED DROP SHOULDER TEES",
    description:
      "Away From Keyboard. Engineered for Dhaka street culture with relaxed dropped shoulders, wide boxy cuts, and dense pre-shrunk cotton. Same energy. Different reality.",
    desktopImageUrl:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1600&q=85",
    mobileImageUrl:
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=85",
    primaryCtaLabel: "SHOP THE DROP",
    primaryCtaUrl: "/collections/drop-01-offline-by-choice",
    secondaryCtaLabel: "ABOUT THE THEORY",
    secondaryCtaUrl: "/about",
    textAlignment: "left",
    focalPosition: "center",
    overlayStrength: "medium",
    displayOrder: 0,
  },
]

export const DEFAULT_ANNOUNCEMENT: AnnouncementBarView = {
  text: "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH",
  linkUrl: null,
  isActive: true,
  desktopAutoplay: false,
  autoplayIntervalMs: 6000,
}

import type { DeliveryZone, FaqItem, SiteSettings } from "./types"

/** Supabase Storage bucket that holds every catalogue image. */
export const STORAGE_BUCKET = "catalogue"

/** Widths generated for each uploaded image. Smaller originals skip larger widths. */
export const IMAGE_WIDTHS = [640, 1080, 1600] as const

export const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"]

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    name: "Inside Dhaka",
    area: "Dhaka City Corporation",
    feeBdt: 60,
    eta: "24-48 hours",
  },
  {
    name: "Dhaka Suburbs",
    area: "Gazipur, Narayanganj, Savar, Keraniganj, Tongi, Ashulia",
    feeBdt: 100,
    eta: "2-3 days",
  },
  {
    name: "Outside Dhaka",
    area: "All other districts",
    feeBdt: 130,
    eta: "3-5 days",
  },
]

export const DEFAULT_FAQ: FaqItem[] = [
  {
    question: "How do I place an order?",
    answer:
      "Pick your color, size and quantity, then tap Order on WhatsApp or Messenger. Your order is written for you. Add your name, phone and address and send it. We confirm every order in the chat.",
  },
  {
    question: "How do I pay?",
    answer: "Cash on delivery. You pay the courier when your parcel arrives.",
  },
  {
    question: "What if the size doesn't fit?",
    answer:
      "Ask for a size exchange within 48 hours of delivery. The garment must be unworn, unwashed and have its tags attached.",
  },
]

export const DEFAULT_SETTINGS: SiteSettings = {
  whatsappNumber: "",
  messengerPage: "",
  instagramHandle: "",
  heroTitle: "Pause the game. Keep your style.",
  heroSubtitle:
    "Oversized streetwear made in Bangladesh. Offline by choice. Order in one message.",
  announcement: "Cash on delivery across Bangladesh",
  deliveryZones: DEFAULT_DELIVERY_ZONES,
  faq: DEFAULT_FAQ,
}

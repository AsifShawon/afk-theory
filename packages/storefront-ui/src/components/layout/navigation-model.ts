import { StoreRoutes } from "@dtc/commerce-contracts"

export interface NavEditorialCard {
  title: string
  description: string
  image: string
  imageAlt?: string
  ctaText: string
  href: string
}

export interface NavSubLink {
  label: string
  href: string
  badge?: string
}

export interface NavGroup {
  title: string
  links: NavSubLink[]
}

export interface MegaNavItem {
  id: string
  label: string
  href: string
  isActive?: boolean
  shopAllHref: string
  shopAllLabel?: string
  featuredLinks: NavSubLink[]
  categoryGroups: NavGroup[]
  editorialCards: NavEditorialCard[]
}

export function createStoreNavigation(routes: StoreRoutes): MegaNavItem[] {
  return [
    {
      id: "new-arrivals",
      label: "New & Trending",
      href: routes.collection("drop-01-offline-by-choice"),
      shopAllHref: routes.collection("drop-01-offline-by-choice"),
      shopAllLabel: "Shop Drop 01 Launch",
      featuredLinks: [
        { label: "Drop 01: Offline by Choice", href: routes.collection("drop-01-offline-by-choice"), badge: "Drop 01" },
        { label: "Drop Shoulder T-Shirts", href: routes.category("drop-shoulder-t-shirts") },
        { label: "Essentials", href: routes.collection("essentials") },
        { label: "Archive", href: routes.collection("archive") },
      ],
      categoryGroups: [
        {
          title: "Trending Silhouettes",
          links: [
            { label: "Drop Shoulder T-Shirts", href: routes.category("drop-shoulder-t-shirts") },
            { label: "Regular T-Shirts", href: routes.category("regular-t-shirts") },
            { label: "Streetwear Shirts", href: routes.category("shirts") },
            { label: "Trousers & Pants", href: routes.category("trousers-&-pants") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Drop 01: Offline by Choice",
          description: "Intentional oversized silhouettes and high-density 240 GSM combed cotton engineered for Bangladesh.",
          image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Drop 01 Streetwear",
          ctaText: "Shop Drop 01",
          href: routes.collection("drop-01-offline-by-choice"),
        },
      ],
    },
    {
      id: "shirts",
      label: "Shirts",
      href: routes.category("shirts"),
      shopAllHref: routes.category("shirts"),
      shopAllLabel: "Shop All Shirts",
      featuredLinks: [
        { label: "Relaxed Street Shirts", href: routes.category("shirts"), badge: "Signature" },
        { label: "Utility Overshirts", href: routes.category("shirts") },
        { label: "Boxy Layering", href: routes.category("shirts") },
      ],
      categoryGroups: [
        {
          title: "Collar & Silhouette",
          links: [
            { label: "Boxy Casual Shirts", href: routes.category("shirts") },
            { label: "Camp Collar Shirts", href: routes.category("shirts") },
            { label: "Overshirts", href: routes.category("shirts") },
          ],
        },
        {
          title: "Fabric Engineering",
          links: [
            { label: "Textured Cotton Weave", href: routes.category("shirts") },
            { label: "Breathable Twill & Canvas", href: routes.category("shirts") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Streetwear Shirts & Overshirts",
          description: "Engineered boxy drape and relaxed proportions built for Dhaka's climate.",
          image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Shirts",
          ctaText: "Explore Shirts",
          href: routes.category("shirts"),
        },
      ],
    },
    {
      id: "polos-tees",
      label: "Polos & Tees",
      href: routes.category("drop-shoulder-t-shirts"),
      shopAllHref: routes.category("drop-shoulder-t-shirts"),
      shopAllLabel: "Shop All T-Shirts",
      featuredLinks: [
        { label: "Drop Shoulder T-Shirts", href: routes.category("drop-shoulder-t-shirts"), badge: "Signature" },
        { label: "Regular T-Shirts", href: routes.category("regular-t-shirts") },
        { label: "Essentials", href: routes.collection("essentials") },
      ],
      categoryGroups: [
        {
          title: "Core Silhouettes",
          links: [
            { label: "Oversized Drop Shoulder", href: routes.category("drop-shoulder-t-shirts") },
            { label: "Regular Fit Crewneck", href: routes.category("regular-t-shirts") },
            { label: "Foundation Streetwear", href: routes.collection("essentials") },
          ],
        },
        {
          title: "Fabric Engineering",
          links: [
            { label: "240 GSM Combed Compact Cotton", href: routes.category("drop-shoulder-t-shirts") },
            { label: "Heavy Ribbed Collar Structure", href: routes.category("drop-shoulder-t-shirts") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Drop Shoulder T-Shirts",
          description: "High-density 240 GSM combed compact yarn providing permanent structure and intentional boxy drape.",
          image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Drop Shoulder T-Shirt",
          ctaText: "Discover Tees",
          href: routes.category("drop-shoulder-t-shirts"),
        },
      ],
    },
    {
      id: "trousers",
      label: "Trousers",
      href: routes.category("trousers-&-pants"),
      shopAllHref: routes.category("trousers-&-pants"),
      shopAllLabel: "Shop All Trousers",
      featuredLinks: [
        { label: "Trousers & Pants", href: routes.category("trousers-&-pants"), badge: "Essential" },
        { label: "Relaxed Street Twill", href: routes.category("trousers-&-pants") },
        { label: "Essentials", href: routes.collection("essentials") },
      ],
      categoryGroups: [
        {
          title: "Styles & Cuts",
          links: [
            { label: "Wide-Leg & Relaxed Pants", href: routes.category("trousers-&-pants") },
            { label: "Tapered Street Trousers", href: routes.category("trousers-&-pants") },
          ],
        },
        {
          title: "Color Palette",
          links: [
            { label: "Washed Black & Charcoal", href: routes.category("trousers-&-pants") },
            { label: "Earth Tones & Olive", href: routes.category("trousers-&-pants") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Trousers & Pants",
          description: "Street-ready proportions built with durable comfort twill for effortless everyday rotation.",
          image: "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Trousers & Pants",
          ctaText: "Shop Trousers",
          href: routes.category("trousers-&-pants"),
        },
      ],
    },
    {
      id: "linen",
      label: "Outerwear & Linen",
      href: routes.collection("drop-01-offline-by-choice"),
      shopAllHref: routes.collection("drop-01-offline-by-choice"),
      shopAllLabel: "Shop Linen & Outerwear",
      featuredLinks: [
        { label: "Drop 01: Offline by Choice", href: routes.collection("drop-01-offline-by-choice"), badge: "Featured" },
        { label: "Lightweight Outerwear", href: routes.category("shirts") },
        { label: "Archive", href: routes.collection("archive") },
      ],
      categoryGroups: [
        {
          title: "Seasonal Edits",
          links: [
            { label: "Boxy Layering Shirts", href: routes.category("shirts") },
            { label: "Drop Shoulder Outerwear", href: routes.category("drop-shoulder-t-shirts") },
            { label: "Archive Releases", href: routes.collection("archive") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Layering & Outerwear",
          description: "Intentional silhouettes cut for versatile streetwear styling and seasonal transitions.",
          image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Outerwear",
          ctaText: "Shop Outerwear",
          href: routes.category("shirts"),
        },
      ],
    },
    {
      id: "accessories",
      label: "Accessories",
      href: routes.category("accessories"),
      shopAllHref: routes.category("accessories"),
      shopAllLabel: "Shop All Accessories",
      featuredLinks: [
        { label: "Streetwear Twill Cap", href: routes.category("accessories"), badge: "Signature" },
        { label: "Canvas Bags & Everyday Carry", href: routes.category("accessories") },
        { label: "Full Accessories Range", href: routes.category("accessories") },
      ],
      categoryGroups: [
        {
          title: "Curated Accents",
          links: [
            { label: "6-Panel Twill Caps", href: routes.category("accessories") },
            { label: "Caps & Headwear Edit", href: routes.category("accessories") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Streetwear Accessories",
          description: "Low-profile six-panel cotton twill caps and essentials to complete the silhouette.",
          image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Accessories",
          ctaText: "Shop Accessories",
          href: routes.category("accessories"),
        },
      ],
    },
    {
      id: "collections",
      label: "Collections",
      href: routes.collection("drop-01-offline-by-choice"),
      shopAllHref: routes.collection("drop-01-offline-by-choice"),
      shopAllLabel: "Shop All Collections",
      featuredLinks: [
        { label: "Drop 01: Offline by Choice", href: routes.collection("drop-01-offline-by-choice"), badge: "Drop 01" },
        { label: "Essentials", href: routes.collection("essentials") },
        { label: "Archive", href: routes.collection("archive") },
      ],
      categoryGroups: [
        {
          title: "Curated Lines",
          links: [
            { label: "Drop 01 Capsule", href: routes.collection("drop-01-offline-by-choice") },
            { label: "Core Essentials", href: routes.collection("essentials") },
            { label: "Design Archive", href: routes.collection("archive") },
          ],
        },
      ],
      editorialCards: [
        {
          title: "Drop 01: Offline by Choice",
          description: "The debut capsule celebrating intentional disconnection and unhurried contemporary street living.",
          image: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80",
          imageAlt: "AFK THEORY Drop 01 Collection",
          ctaText: "Explore Drop 01",
          href: routes.collection("drop-01-offline-by-choice"),
        },
      ],
    },
  ]
}

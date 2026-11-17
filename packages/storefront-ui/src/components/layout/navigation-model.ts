import {
  HOODIES_LINE,
  StoreRoutes,
  TEES_LINE,
  lineHref,
  styleHref,
} from "@dtc/commerce-contracts"

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
  const tees = TEES_LINE
  const hoodies = HOODIES_LINE

  const colorBadge = (count: number) => `${count} colors`

  return [
    {
      id: "shop-all",
      label: "Shop All",
      href: routes.catalog(),
      shopAllHref: routes.catalog(),
      shopAllLabel: "Shop Everything",
      featuredLinks: [
        { label: tees.title, href: lineHref(routes, tees), badge: colorBadge(tees.colorCount ?? 3) },
        { label: hoodies.title, href: lineHref(routes, hoodies) },
      ],
      categoryGroups: [
        {
          title: "Hoodie Styles",
          links: hoodies.styles.map((style) => ({
            label: style.title,
            href: styleHref(routes, style),
            badge: colorBadge(style.colorCount),
          })),
        },
      ],
      editorialCards: [
        {
          title: tees.title,
          description: tees.summary,
          image: tees.image,
          imageAlt: `AFK THEORY ${tees.title}`,
          ctaText: "Shop Tees",
          href: lineHref(routes, tees),
        },
      ],
    },
    {
      id: tees.handle,
      label: tees.title,
      href: lineHref(routes, tees),
      shopAllHref: lineHref(routes, tees),
      shopAllLabel: `Shop All ${tees.title}`,
      featuredLinks: [
        { label: `All ${tees.title}`, href: lineHref(routes, tees), badge: colorBadge(tees.colorCount ?? 3) },
      ],
      categoryGroups: [
        {
          title: "The Fit",
          links: [
            { label: "Drop shoulder seams", href: lineHref(routes, tees) },
            { label: "Boxy, oversized body", href: lineHref(routes, tees) },
            { label: "240 GSM combed cotton", href: lineHref(routes, tees) },
          ],
        },
      ],
      editorialCards: [
        {
          title: tees.title,
          description: tees.summary,
          image: tees.image,
          imageAlt: `AFK THEORY ${tees.title}`,
          ctaText: "Discover Tees",
          href: lineHref(routes, tees),
        },
      ],
    },
    {
      id: hoodies.handle,
      label: hoodies.title,
      href: lineHref(routes, hoodies),
      shopAllHref: lineHref(routes, hoodies),
      shopAllLabel: `Shop All ${hoodies.title}`,
      featuredLinks: hoodies.styles.map((style) => ({
        label: style.title,
        href: styleHref(routes, style),
        badge: colorBadge(style.colorCount),
      })),
      categoryGroups: [
        {
          title: "Styles",
          links: [
            { label: `All ${hoodies.title}`, href: lineHref(routes, hoodies) },
            ...hoodies.styles.map((style) => ({
              label: style.title,
              href: styleHref(routes, style),
            })),
          ],
        },
      ],
      editorialCards: [
        {
          title: hoodies.title,
          description: hoodies.summary,
          image: hoodies.image,
          imageAlt: `AFK THEORY ${hoodies.title}`,
          ctaText: "Shop Hoodies",
          href: lineHref(routes, hoodies),
        },
      ],
    },
  ]
}


export function isNavItemActive(item: MegaNavItem, currentPath?: string): boolean {
  if (!currentPath) return Boolean(item.isActive)

  const normCurrent = currentPath.replace(/\/+$/, "") || "/"
  const normHref = item.href.replace(/\/+$/, "") || "/"
  const normShopAll = item.shopAllHref ? item.shopAllHref.replace(/\/+$/, "") : ""

  const stripCountry = (p: string) => p.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/"
  const cleanCurrent = stripCountry(normCurrent)
  const cleanHref = stripCountry(normHref)
  const cleanShopAll = stripCountry(normShopAll)

  // 1. Direct match on main department href or shopAllHref
  if (cleanCurrent !== "/" && (cleanCurrent === cleanHref || (cleanShopAll && cleanCurrent === cleanShopAll))) {
    return true
  }

  // 2. Child path under this department's unique href
  if (cleanHref !== "/" && cleanCurrent.startsWith(cleanHref + "/")) {
    return true
  }

  return false
}

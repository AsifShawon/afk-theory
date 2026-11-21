import type { Metadata, Viewport } from "next"
import { Chakra_Petch, JetBrains_Mono, Manrope } from "next/font/google"
import { ViewTransitions } from "next-view-transitions"
import { SiteFooter } from "@/components/layout/site-footer"
import { BottomBar, MobileNav } from "@/components/layout/mobile-nav"
import { NavUIProvider } from "@/components/layout/nav-ui"
import { SiteHeader } from "@/components/layout/site-header"
import { PRELOADER_HEAD_SCRIPT, Preloader } from "@/components/motion/preloader"
import { SmoothScroll } from "@/components/motion/smooth-scroll"
import { OrderDrawer } from "@/components/order/order-drawer"
import { OrderProvider, type PriceBook } from "@/components/order/order-provider"
import { OrderToast } from "@/components/order/order-toast"
import { SearchOverlay } from "@/components/search/search-overlay"
import { getCatalogue, siteUrl } from "@/lib/catalogue"
import { buildNavData } from "@/lib/store"
import "./globals.css"

const chakra = Chakra_Petch({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-chakra-petch", display: "swap" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-jetbrains-mono", display: "swap" })

const DESCRIPTION =
  "Oversized streetwear made in Bangladesh. Browse the AFK THEORY collection and order in one message on WhatsApp or Messenger. Cash on delivery."

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: "AFK THEORY | Pause the game. Keep your style.", template: "%s | AFK THEORY" },
  description: DESCRIPTION,
  openGraph: { siteName: "AFK THEORY", type: "website", locale: "en_BD", description: DESCRIPTION },
  twitter: { card: "summary_large_image" },
}

export const viewport: Viewport = {
  themeColor: "#20241F",
  colorScheme: "dark",
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalogue = await getCatalogue()
  const prices: PriceBook = Object.fromEntries(catalogue.products.map((p) => [p.slug, { name: p.name, priceBdt: p.priceBdt }]))
  const tip = catalogue.settings.announcement || "Every order is cash on delivery. Pay the courier when it arrives."
  const nav = buildNavData(catalogue)
  const suggestions = [
    ...nav.categories.map((c) => ({ name: c.name, href: c.href })),
    ...(nav.hasNew ? [{ name: "New arrivals", href: "/new/" }] : []),
    ...nav.collections.map((c) => ({ name: c.name, href: c.href })),
  ]

  return (
    <ViewTransitions>
      <html lang="en" className={`${chakra.variable} ${manrope.variable} ${mono.variable}`} suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: PRELOADER_HEAD_SCRIPT }} />
        </head>
        <body>
          <a href="#main" className="sr-only z-[200] bg-brand-accent px-4 py-2 font-semibold text-brand-graphite focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
            Skip to content
          </a>
          <OrderProvider prices={prices}>
            <SmoothScroll>
              <NavUIProvider>
                <Preloader tip={tip} />
                <SiteHeader nav={nav} announcement={catalogue.settings.announcement} />
                <main id="main">{children}</main>
                <SiteFooter settings={catalogue.settings} nav={nav} />
                <BottomBar />
                <MobileNav nav={nav} settings={catalogue.settings} />
                <SearchOverlay index={catalogue.searchIndex} suggestions={suggestions} />
                <OrderDrawer settings={catalogue.settings} />
                <OrderToast />
              </NavUIProvider>
            </SmoothScroll>
          </OrderProvider>
        </body>
      </html>
    </ViewTransitions>
  )
}

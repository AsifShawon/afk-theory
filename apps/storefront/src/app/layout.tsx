import { getBaseURL } from "@lib/util/env"
import { getOrganizationSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import SkipLink from "@modules/layout/components/skip-link"
import { Metadata } from "next"
import { Space_Grotesk, Manrope } from "next/font/google"
import "styles/globals.css"

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
})

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getBaseURL()),
  title: {
    default: "AFK THEORY | Pause The Game. Keep Your Style.",
    template: "%s | AFK THEORY",
  },
  description:
    "Modern, independent, premium-accessible streetwear engineered for Bangladesh. Offline by choice. Explore oversized drop shoulder t-shirts and contemporary street essentials.",
  openGraph: {
    title: "AFK THEORY | Pause The Game. Keep Your Style.",
    description:
      "Modern, independent, premium-accessible streetwear engineered for Bangladesh. Offline by choice. Explore oversized drop shoulder t-shirts and contemporary street essentials.",
    siteName: "AFK THEORY",
    type: "website",
    locale: "en_BD",
    images: ["/brand/logo-chartreuse.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "AFK THEORY | Pause The Game. Keep Your Style.",
    description:
      "Modern, independent, premium-accessible streetwear engineered for Bangladesh. Offline by choice. Explore oversized drop shoulder t-shirts and contemporary street essentials.",
    images: ["/brand/logo-chartreuse.png"],
  },
}

export default function RootLayout(props: { children: React.ReactNode }) {
  const organizationSchema = getOrganizationSchema()

  return (
    <html
      lang="en"
      data-mode="light"
      className={`${spaceGrotesk.variable} ${manrope.variable}`}
    >
      <head>
        <JsonLd data={organizationSchema} />
      </head>
      <body className="bg-brand-secondary text-brand-primary font-sans antialiased selection:bg-brand-accent selection:text-brand-primary">
        <SkipLink />
        <div className="relative min-h-screen flex flex-col">{props.children}</div>
      </body>
    </html>
  )
}

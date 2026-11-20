import type { Metadata } from "next"
import { Manrope, Space_Grotesk } from "next/font/google"
import { AdminNav } from "@/components/admin-nav"
import { SetupScreen } from "@/components/setup-screen"
import { missingEnvKeys, readAdminEnv } from "@/lib/env"
import "./globals.css"

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" })
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" })

export const metadata: Metadata = {
  title: "AFK THEORY Catalogue Admin",
  robots: { index: false, follow: false },
}

// Every page reads live data from Supabase.
export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const missing = missingEnvKeys(readAdminEnv())

  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${manrope.variable}`}>
      <body className="font-sans min-h-screen">
        {missing.length > 0 ? (
          <SetupScreen missing={missing} />
        ) : (
          <>
            <AdminNav />
            <main className="mx-auto max-w-content px-6 py-8">{children}</main>
          </>
        )}
      </body>
    </html>
  )
}

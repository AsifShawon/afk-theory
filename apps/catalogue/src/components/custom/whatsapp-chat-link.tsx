"use client"

import type { ReactNode } from "react"
import { Link } from "next-view-transitions"
import { trackChatClick } from "@/lib/meta-pixel"

/**
 * Ordinary WhatsApp anchor link usable without JS. When JS is active, records
 * a non-Purchase chat click custom event.
 */
export function WhatsAppChatLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackChatClick("whatsapp")}
      className={className}
    >
      {children}
    </a>
  )
}

export function MissingWhatsappFallback({
  messengerHref,
  hasContactPage,
}: {
  messengerHref: string | null
  hasContactPage: boolean
}) {
  return (
    <div className="border border-white/15 bg-black/30 p-3.5 text-sm text-brand-bone/85 backdrop-blur-sm">
      <p className="font-semibold text-brand-bone">WhatsApp ordering is temporarily unavailable.</p>
      <p className="mt-1 text-xs text-brand-bone/65">
        {messengerHref || hasContactPage ? "Share your design or reach our team through: " : "Check back soon for direct WhatsApp links."}
        {messengerHref && (
          <a href={messengerHref} target="_blank" rel="noopener noreferrer" className="text-brand-accent underline underline-offset-4 hover:text-brand-bone">
            Messenger
          </a>
        )}
        {messengerHref && hasContactPage && " or "}
        {hasContactPage && (
          <Link href="/contact/" className="text-brand-accent underline underline-offset-4 hover:text-brand-bone">
            Contact page
          </Link>
        )}
        .
      </p>
    </div>
  )
}

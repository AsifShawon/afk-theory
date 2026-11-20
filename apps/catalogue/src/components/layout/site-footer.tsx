import { Link } from "next-view-transitions"
import type { SiteSettings } from "@dtc/catalogue-core"
import { MessengerIcon, PauseMark, WhatsAppIcon } from "@/components/ui/icons"
import { messengerUrl } from "@/lib/order-message"
import { normalizeWhatsappNumber } from "@dtc/catalogue-core"

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const wa = normalizeWhatsappNumber(settings.whatsappNumber)
  const messenger = messengerUrl(settings.messengerPage, "footer")
  const year = new Date().getFullYear()

  return (
    <footer className="grain relative overflow-hidden bg-brand-graphite-dark pt-20">
      <div className="mx-auto grid max-w-editorial gap-12 px-5 md:grid-cols-[1.4fr_1fr_1fr] md:px-10">
        <div>
          <PauseMark size={40} className="text-brand-accent" />
          <p className="mt-6 max-w-sm text-brand-bone/70">
            Streetwear for the hours you spend offline. Made in Bangladesh, ordered in one message, paid on delivery.
          </p>
        </div>
        <div>
          <p className="font-hud text-[11px] text-brand-accent">Order and ask</p>
          <ul className="mt-4 space-y-3 text-sm">
            {wa && (
              <li>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-accent">
                  <WhatsAppIcon size={16} /> WhatsApp +{wa}
                </a>
              </li>
            )}
            {messenger && (
              <li>
                <a href={messenger} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-accent">
                  <MessengerIcon size={16} /> Messenger
                </a>
              </li>
            )}
            {settings.messengerPage && (
              <li>
                <a href={`https://facebook.com/${settings.messengerPage}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">
                  Facebook
                </a>
              </li>
            )}
            {settings.instagramHandle && (
              <li>
                <a href={`https://instagram.com/${settings.instagramHandle}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-accent">
                  Instagram @{settings.instagramHandle}
                </a>
              </li>
            )}
          </ul>
        </div>
        <div>
          <p className="font-hud text-[11px] text-brand-accent">Shop</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li><Link href="/#collection" className="hover:text-brand-accent">Collection</Link></li>
            <li><Link href="/#how-to-order" className="hover:text-brand-accent">How to order</Link></li>
            <li><Link href="/#faq" className="hover:text-brand-accent">FAQ</Link></li>
          </ul>
        </div>
      </div>
      <p aria-hidden className="display mt-20 select-none whitespace-nowrap text-center text-[15.5vw] leading-[0.78] text-brand-bone/[0.06]">
        AFK THEORY
      </p>
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-editorial flex-wrap justify-between gap-2 px-5 py-5 font-hud text-[10px] text-brand-bone/40 md:px-10">
          <span>© {year} AFK THEORY</span>
          <span>Offline by choice</span>
        </div>
      </div>
    </footer>
  )
}

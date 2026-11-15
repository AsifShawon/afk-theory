"use client"

import { AnnouncementBar as SharedAnnouncementBar } from "@dtc/storefront-ui"
import { AnnouncementBarView } from "@dtc/commerce-contracts"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

interface AnnouncementBarProps {
  announcement?: AnnouncementBarView | null
}

export default function AnnouncementBar({ announcement }: AnnouncementBarProps) {
  if (announcement && !announcement.isActive) {
    return null
  }

  return (
    <SharedAnnouncementBar
      linkComponent={LocalizedClientLink}
      centerText={announcement?.text || "PAUSE THE GAME. KEEP YOUR STYLE. • CASH ON DELIVERY AVAILABLE ACROSS BANGLADESH"}
      centerHref={announcement?.linkUrl || "/store"}
      rightLinkHref="/return-policy"
      rightLinkText="7-Day Exchange"
    />
  )
}

import React from "react"

export interface StoreShellProps {
  topBannerSlot?: React.ReactNode
  announcementBarSlot?: React.ReactNode
  headerSlot?: React.ReactNode
  footerSlot?: React.ReactNode
  overlaySlot?: React.ReactNode
  children: React.ReactNode
}

export function StoreShell({
  topBannerSlot,
  announcementBarSlot,
  headerSlot,
  footerSlot,
  overlaySlot,
  children,
}: StoreShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-brand-primary font-sans antialiased selection:bg-brand-accent selection:text-brand-primary">
      {topBannerSlot}
      {announcementBarSlot}
      {headerSlot}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
        {children}
      </main>
      {footerSlot}
      {overlaySlot}
    </div>
  )
}

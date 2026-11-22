"use client"

import { usePathname } from "next/navigation"
import { clsx } from "clsx"
import { useOrder } from "./order-provider"

/** Pages where an "Added to cart" note would cover the form or the confirmation. */
const QUIET_PATHS = /^\/(checkout|order)\//

export function OrderToast() {
  const { toast } = useOrder()
  const pathname = usePathname()
  const visible = Boolean(toast) && !QUIET_PATHS.test(pathname ?? "")
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 md:bottom-8">
      <p
        key={toast?.id}
        className={clsx(
          "max-w-md border-l-4 border-brand-accent bg-brand-graphite-dark px-5 py-4 text-sm text-brand-bone shadow-mega transition-all duration-500",
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
        )}
      >
        {visible ? toast?.text : null}
      </p>
    </div>
  )
}

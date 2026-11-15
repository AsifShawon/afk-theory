import React from "react"
import clsx from "clsx"

export type BrandLogoVariant =
  | "responsive"
  | "horizontal-dark"
  | "horizontal-light"
  | "compact"
  | "compact-light"
  | "icon"

export interface BrandLogoProps {
  /**
   * Visual variant:
   * - "responsive": Desktop (>=1024px) renders horizontal wordmark, Mobile (<1024px) renders compact AFK mark
   * - "horizontal-dark": Matte graphite wordmark on light surfaces
   * - "horizontal-light": Light/chartreuse wordmark on dark/graphite surfaces
   * - "compact": Compact angular AFK + pause mark (graphite + chartreuse for light surfaces)
   * - "compact-light": Compact angular AFK + pause mark for dark surfaces
   * - "icon": Pure square pause symbol mark
   */
  variant?: BrandLogoVariant
  className?: string
  priority?: boolean
  alt?: string
}

export function BrandLogo({
  variant = "responsive",
  className,
  priority = false,
  alt = "AFK THEORY",
}: BrandLogoProps) {
  if (variant === "responsive") {
    return (
      <div className={clsx("flex items-center", className)}>
        {/* Desktop Wordmark (>= 1024px) */}
        <img
          src="/brand/afk-logo-horizontal-dark.png"
          alt={alt}
          width={2006}
          height={254}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="hidden lg:block h-7 xl:h-8 w-auto object-contain select-none"
        />

        {/* Mobile Compact Mark (< 1024px) */}
        <img
          src="/brand/afk-logo-compact-dark.png"
          alt={alt}
          width={1065}
          height={304}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="block lg:hidden h-7 sm:h-8 w-auto object-contain select-none"
        />
      </div>
    )
  }

  if (variant === "horizontal-dark") {
    return (
      <img
        src="/brand/afk-logo-horizontal-dark.png"
        alt={alt}
        width={2006}
        height={254}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={clsx("h-7 xl:h-8 w-auto object-contain select-none", className)}
      />
    )
  }

  if (variant === "horizontal-light") {
    return (
      <img
        src="/brand/afk-logo-horizontal-light.png"
        alt={alt}
        width={2018}
        height={263}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={clsx("h-7 xl:h-8 w-auto object-contain select-none", className)}
      />
    )
  }

  if (variant === "compact") {
    return (
      <img
        src="/brand/afk-logo-compact-dark.png"
        alt={alt}
        width={1065}
        height={304}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={clsx("h-7 sm:h-8 w-auto object-contain select-none", className)}
      />
    )
  }

  if (variant === "compact-light") {
    return (
      <img
        src="/brand/afk-logo-compact.png"
        alt={alt}
        width={1065}
        height={304}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={clsx("h-7 sm:h-8 w-auto object-contain select-none", className)}
      />
    )
  }

  return (
    <img
      src="/brand/afk-pause-mark.png"
      alt={alt}
      width={671}
      height={672}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={clsx("h-6 w-6 object-contain select-none", className)}
    />
  )
}

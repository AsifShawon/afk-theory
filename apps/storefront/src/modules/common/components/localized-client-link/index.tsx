"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import React from "react"

/**
 * Use this component to create a Next.js `<Link />` that persists the current country code in the url,
 * without having to explicitly pass it as a prop.
 */
const LocalizedClientLink = ({
  children,
  href,
  ...props
}: {
  children?: React.ReactNode
  href: string
  className?: string
  onClick?: () => void
  passHref?: true
  [x: string]: unknown
}) => {
  const { countryCode } = useParams()
  const code = (countryCode as string) || "bd"

  let finalHref = href
  if (
    !href.startsWith(`/${code}`) &&
    !href.startsWith("http://") &&
    !href.startsWith("https://") &&
    !href.startsWith("#") &&
    !href.startsWith("mailto:") &&
    !href.startsWith("tel:")
  ) {
    const cleanHref = href.startsWith("/") ? href : `/${href}`
    finalHref = `/${code}${cleanHref === "/" ? "" : cleanHref}`
  }

  return (
    <Link href={finalHref} {...props}>
      {children}
    </Link>
  )
}

export default LocalizedClientLink

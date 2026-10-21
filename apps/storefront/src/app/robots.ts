import { MetadataRoute } from "next"
import { getBaseURL } from "@lib/util/env"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseURL()

  // In staging / preview environments where indexing is explicitly disabled, block all search crawlers
  if (
    process.env.NEXT_PUBLIC_INDEXING_DISABLED === "true" ||
    process.env.VERCEL_ENV === "preview"
  ) {
    return {
      rules: [
        {
          userAgent: "*",
          disallow: "/",
        },
      ],
      sitemap: `${baseUrl}/sitemap.xml`,
    }
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/cart",
          "/*/checkout",
          "/*/account",
          "/*/account/*",
          "/*/order/*",
          "/*/verify-account",
          "/api/*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}

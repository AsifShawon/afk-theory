import type { MetadataRoute } from "next"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { products, generatedAt } = await getCatalogue()
  return [
    { url: absoluteUrl("/"), lastModified: generatedAt, changeFrequency: "weekly", priority: 1 },
    ...products.map((p) => ({
      url: absoluteUrl(`/products/${p.slug}/`),
      lastModified: generatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}

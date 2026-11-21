import type { MetadataRoute } from "next"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"
import { allCategoryNodes, productsBySlugs } from "@/lib/store"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogue = await getCatalogue()
  const { products, generatedAt } = catalogue
  const entry = (path: string, priority: number) => ({
    url: absoluteUrl(path),
    lastModified: generatedAt,
    changeFrequency: "weekly" as const,
    priority,
  })

  const collections = catalogue.collections.filter((c) => productsBySlugs(catalogue, c.productSlugs).length > 0)

  return [
    entry("/", 1),
    entry("/shop/", 0.9),
    ...allCategoryNodes(catalogue).map((node) => entry(node.href, 0.8)),
    ...(collections.length > 0 ? [entry("/collections/", 0.6), ...collections.map((c) => entry(c.href, 0.7))] : []),
    ...(catalogue.autoCollections.new.length > 0 ? [entry("/new/", 0.7)] : []),
    ...(catalogue.autoCollections.sale.length > 0 ? [entry("/sale/", 0.7)] : []),
    ...products.map((p) => entry(`/products/${p.slug}/`, 0.8)),
  ]
}

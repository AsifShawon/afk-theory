import type { MetadataRoute } from "next"
import { absoluteUrl, getCatalogue } from "@/lib/catalogue"
import { allCategoryNodes, productsBySlugs } from "@/lib/store"

export const dynamic = "force-static"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const catalogue = await getCatalogue()
  const { products, customDesigns, generatedAt } = catalogue
  const entry = (path: string, priority: number, lastModified: string = generatedAt) => ({
    url: absoluteUrl(path),
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
  })

  const customLastMod =
    customDesigns
      .map((d) => d.updatedAt)
      .filter((v) => Boolean(v) && !Number.isNaN(Date.parse(v)))
      .sort()
      .pop() ?? generatedAt

  const collections = catalogue.collections.filter((c) => productsBySlugs(catalogue, c.productSlugs).length > 0)

  return [
    entry("/", 1),
    entry("/shop/", 0.9),
    entry("/custom-design/", 0.8, customLastMod),
    entry("/custom-hoodie/", 0.8),
    entry("/custom-tee/", 0.8),
    ...allCategoryNodes(catalogue).map((node) => entry(node.href, 0.8)),
    ...(collections.length > 0 ? [entry("/collections/", 0.6), ...collections.map((c) => entry(c.href, 0.7))] : []),
    ...(catalogue.autoCollections.new.length > 0 ? [entry("/new/", 0.7)] : []),
    ...(catalogue.autoCollections.sale.length > 0 ? [entry("/sale/", 0.7)] : []),
    ...products.map((p) => entry(`/products/${p.slug}/`, 0.8)),
    entry("/lookbook/", 0.5),
    ...(catalogue.settings.faq.length > 0 ? [entry("/faq/", 0.5)] : []),
    ...catalogue.pages.map((p) => entry(`/${p.slug}/`, 0.4, p.updatedAt && !Number.isNaN(Date.parse(p.updatedAt)) ? p.updatedAt : generatedAt)),
  ]
}

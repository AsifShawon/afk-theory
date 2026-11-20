import { existsSync, readFileSync } from "fs"
import path from "path"
import { cache } from "react"
import { buildCatalogue, fetchRawCatalogue, type Catalogue, type CatalogueImage, type CatalogueProduct } from "@dtc/catalogue-core"
import { createPublicClient, readSiteSupabaseEnv, storageObjectUrl } from "./catalogue-source"

const GENERATED = path.join(process.cwd(), "src", "generated", "catalogue.json")

function readGenerated(): Catalogue {
  if (!existsSync(GENERATED)) {
    throw new Error("src/generated/catalogue.json is missing. Run `pnpm --filter @dtc/catalogue sync` first.")
  }
  return JSON.parse(readFileSync(GENERATED, "utf8")) as Catalogue
}

/**
 * The catalogue every page renders from.
 *
 * Builds read the JSON written by scripts/sync-catalogue.ts. In `next dev`
 * with Supabase configured, it reads Supabase live instead, so the admin's
 * Preview link shows saved changes without a rebuild.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  const env = readSiteSupabaseEnv()
  if (process.env.NODE_ENV === "development" && env && process.env.CATALOGUE_DEV_LIVE !== "0") {
    try {
      const raw = await fetchRawCatalogue(createPublicClient(env))
      return buildCatalogue(raw, (img, width) => storageObjectUrl(env, img.path, width), "supabase").catalogue
    } catch (err) {
      console.warn(`[catalogue] Live read failed, using the last sync: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  return readGenerated()
})

export async function getProduct(slug: string): Promise<CatalogueProduct | null> {
  const { products } = await getCatalogue()
  return products.find((p) => p.slug === slug) ?? null
}

export function getFeatured(catalogue: Catalogue): CatalogueProduct | null {
  return catalogue.products.find((p) => p.isFeatured) ?? catalogue.products[0] ?? null
}

/** Products in the same category first, then the rest. */
export function getRelated(catalogue: Catalogue, product: CatalogueProduct, limit = 4): CatalogueProduct[] {
  const others = catalogue.products.filter((p) => p.id !== product.id)
  const same = others.filter((p) => p.category?.id && p.category.id === product.category?.id)
  const rest = others.filter((p) => !same.includes(p))
  return [...same, ...rest].slice(0, limit)
}

/** On-model shots across the collection for the lookbook strip. */
export function getLookbook(catalogue: Catalogue, limit = 8): { image: CatalogueImage; product: CatalogueProduct }[] {
  const shots = catalogue.products.flatMap((product) =>
    product.images.filter((img) => img.role === "model").map((image) => ({ image, product }))
  )
  if (shots.length >= 3) {
    return shots.slice(0, limit)
  }
  return catalogue.products.flatMap((product) => product.images.map((image) => ({ image, product }))).slice(0, limit)
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8100").replace(/\/+$/, "")
}

export function absoluteUrl(pathname: string): string {
  return pathname.startsWith("http") ? pathname : `${siteUrl()}${pathname}`
}

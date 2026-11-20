/**
 * Loads the starter catalogue into Supabase: the T-Shirts category, the
 * Drop 01 Oversized Tee with its 5 photos, and default site settings.
 *
 *   pnpm catalogue-admin:seed
 *
 * Safe to run more than once: existing products are skipped and settings
 * that already have values are left alone.
 */
import { existsSync, readFileSync } from "fs"
import { createRequire } from "module"
import path from "path"
import { TABLES, type SiteSettingsRow } from "@dtc/catalogue-core"
import { SEED_CATEGORIES, SEED_MEDIA_DIR, SEED_PRODUCTS, SEED_SETTINGS } from "@dtc/catalogue-core/seed"
import { missingEnvKeys, readAdminEnv } from "../src/lib/env"
import { processAndUploadImage } from "../src/lib/images"
import { createAdminClient } from "../src/lib/supabase"

async function main() {
  const envFile = path.join(process.cwd(), ".env.local")
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile)
  }
  const env = readAdminEnv()
  const missing = missingEnvKeys(env)
  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(", ")}. Add them to apps/catalogue-admin/.env.local`)
  }
  const client = createAdminClient(env)

  const require = createRequire(path.join(process.cwd(), "package.json"))
  const mediaDir = path.join(path.dirname(require.resolve("@dtc/catalogue-core/package.json")), SEED_MEDIA_DIR)

  // Categories
  const { error: catError } = await client
    .from(TABLES.categories)
    .upsert(SEED_CATEGORIES.map((c, i) => ({ ...c, sort_order: i })), { onConflict: "slug", ignoreDuplicates: true })
  if (catError) throw new Error(`Categories: ${catError.message}`)
  const { data: categories, error: catReadError } = await client.from(TABLES.categories).select("id, slug")
  if (catReadError) throw new Error(catReadError.message)

  // Products
  for (const [index, seed] of SEED_PRODUCTS.entries()) {
    const { data: existing } = await client.from(TABLES.products).select("id").eq("slug", seed.slug).maybeSingle()
    if (existing) {
      console.log(`- ${seed.name}: already exists, skipped`)
      continue
    }

    const { data: product, error } = await client
      .from(TABLES.products)
      .insert({
        slug: seed.slug,
        name: seed.name,
        tagline: seed.tagline,
        description: seed.description,
        price_bdt: seed.priceBdt,
        compare_at_bdt: seed.compareAtBdt,
        category_id: categories?.find((c) => c.slug === seed.categorySlug)?.id ?? null,
        // Draft first: it only goes live after its images upload.
        status: "draft",
        is_featured: seed.isFeatured,
        sort_order: index,
        sizes: seed.sizes,
        sold_out_sizes: seed.soldOutSizes,
        details: seed.details,
        size_chart: seed.sizeChart,
      })
      .select("id")
      .single()
    if (error) throw new Error(`${seed.name}: ${error.message}`)

    const { data: colors, error: colorError } = await client
      .from(TABLES.colors)
      .insert(seed.colors.map((c, i) => ({ product_id: product.id, name: c.name, hex: c.hex, in_stock: c.inStock, sort_order: i })))
      .select("id, name")
    if (colorError) throw new Error(`${seed.name} colors: ${colorError.message}`)

    for (const [i, image] of seed.images.entries()) {
      const file = path.join(mediaDir, image.file)
      await processAndUploadImage(client, readFileSync(file), {
        productId: product.id,
        colorId: colors?.find((c) => c.name === image.color)?.id ?? null,
        role: image.role,
        alt: image.alt,
        sortOrder: i,
      })
      console.log(`  uploaded ${image.file}`)
    }

    const { error: publishError } = await client.from(TABLES.products).update({ status: "published" }).eq("id", product.id)
    if (publishError) throw new Error(publishError.message)
    console.log(`- ${seed.name}: created and published`)
  }

  // Settings: fill only what is still empty.
  const { data: row } = await client.from(TABLES.settings).select("*").eq("id", 1).maybeSingle()
  const current = row as SiteSettingsRow | null
  const { error: settingsError } = await client.from(TABLES.settings).upsert({
    id: 1,
    hero_title: current?.hero_title || SEED_SETTINGS.heroTitle,
    hero_subtitle: current?.hero_subtitle || SEED_SETTINGS.heroSubtitle,
    announcement: current?.announcement || SEED_SETTINGS.announcement,
    delivery_zones: current?.delivery_zones?.length ? current.delivery_zones : SEED_SETTINGS.deliveryZones,
    faq: current?.faq?.length ? current.faq : SEED_SETTINGS.faq,
  })
  if (settingsError) throw new Error(`Settings: ${settingsError.message}`)
  console.log("- Settings: defaults filled")

  console.log("\nDone. Set your WhatsApp number and Facebook page in the admin under Settings.")
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})

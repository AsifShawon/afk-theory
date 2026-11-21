/**
 * Pulls the published catalogue from Supabase into the static site.
 *
 *   1. Reads published products, colors, images, categories, collections,
 *      pages and settings with the publishable key (row level security
 *      hides drafts).
 *   2. Downloads every image width (product photos plus category and
 *      collection banners) into public/media/.
 *   3. Writes src/generated/catalogue.json, which every page renders from.
 *
 * Runs before `next dev` and `next build`. With no Supabase settings it falls
 * back to the starter catalogue in @dtc/catalogue-core (local dev and CI). On
 * a hosting provider a missing setting is an error, so a misconfigured build
 * never publishes the starter catalogue by accident.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "fs"
import { createRequire } from "module"
import path from "path"
import { buildCatalogue, fetchRawCatalogue, imageObjectKey, usedImageObjects, type RawCatalogue } from "@dtc/catalogue-core"
import { SEED_MEDIA_DIR, seedToRawCatalogue } from "@dtc/catalogue-core/seed"
import { createPublicClient, localMediaUrl, readSiteSupabaseEnv, storageObjectUrl, type SiteSupabaseEnv } from "../src/lib/catalogue-source"

const appDir = process.cwd()
const mediaDir = path.join(appDir, "public", "media")
const outFile = path.join(appDir, "src", "generated", "catalogue.json")
const DOWNLOAD_CONCURRENCY = 6

function isHostedBuild(): boolean {
  return Boolean(process.env.CF_PAGES || process.env.VERCEL || process.env.NETLIFY || process.env.CATALOGUE_REQUIRE_SUPABASE)
}

/** A product photo, or a category or collection banner. */
type StoredImage = { path: string; widths: number[] }

async function downloadAll(env: SiteSupabaseEnv, images: StoredImage[]) {
  const jobs = images.flatMap((img) =>
    img.widths.map((width) => ({ key: imageObjectKey(img.path, width), url: storageObjectUrl(env, img.path, width) }))
  )
  let next = 0
  let downloaded = 0

  async function worker() {
    while (next < jobs.length) {
      const job = jobs[next++]
      const target = path.join(mediaDir, job.key)
      // Image files never change once uploaded (each upload gets a new id).
      if (existsSync(target) && statSync(target).size > 0) continue
      const response = await fetch(job.url)
      if (!response.ok) {
        throw new Error(`Could not download ${job.key} (HTTP ${response.status})`)
      }
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, Buffer.from(await response.arrayBuffer()))
      downloaded++
    }
  }

  await Promise.all(Array.from({ length: Math.min(DOWNLOAD_CONCURRENCY, jobs.length) }, worker))
  return { total: jobs.length, downloaded }
}

function copySeedMedia(raw: RawCatalogue) {
  const require = createRequire(path.join(appDir, "package.json"))
  const seedDir = path.join(path.dirname(require.resolve("@dtc/catalogue-core/package.json")), SEED_MEDIA_DIR)
  for (const img of raw.images) {
    const file = path.join(seedDir, `${path.basename(img.path)}.webp`)
    for (const width of img.widths) {
      const target = path.join(mediaDir, imageObjectKey(img.path, width))
      mkdirSync(path.dirname(target), { recursive: true })
      copyFileSync(file, target)
    }
  }
}

/** Deletes media files that the built catalogue no longer uses. */
function pruneMedia(keep: Set<string>) {
  if (!existsSync(mediaDir)) return 0
  let removed = 0
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(full)
        if (readdirSync(full).length === 0) rmSync(full, { recursive: true })
      } else {
        const key = path.relative(mediaDir, full).split(path.sep).join("/")
        if (!keep.has(key)) {
          rmSync(full)
          removed++
        }
      }
    }
  }
  walk(mediaDir)
  return removed
}

async function main() {
  const envFile = path.join(appDir, ".env.local")
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile)
  }

  const env = readSiteSupabaseEnv()
  let raw: RawCatalogue
  let source: "supabase" | "fixture"

  if (env) {
    raw = await fetchRawCatalogue(createPublicClient(env))
    source = "supabase"
  } else if (isHostedBuild()) {
    throw new Error("SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY must be set in the hosting provider's build settings.")
  } else {
    console.warn("[catalogue] No Supabase settings found. Using the starter catalogue (fixture).")
    raw = seedToRawCatalogue()
    source = "fixture"
  }

  const { catalogue, skipped } = buildCatalogue(raw, (img, width) => localMediaUrl(img.path, width), source)
  const usedImages = usedImageObjects(raw, catalogue)

  mkdirSync(mediaDir, { recursive: true })
  if (env) {
    const { total, downloaded } = await downloadAll(env, usedImages)
    console.log(`[catalogue] Images: ${total} files, ${downloaded} downloaded`)
  } else {
    copySeedMedia(raw)
  }
  const removed = pruneMedia(new Set(usedImages.flatMap((img) => img.widths.map((w) => imageObjectKey(img.path, w)))))

  mkdirSync(path.dirname(outFile), { recursive: true })
  writeFileSync(outFile, JSON.stringify(catalogue, null, 2))

  for (const reason of skipped) {
    console.warn(`[catalogue] Skipped ${reason}`)
  }
  if (removed > 0) {
    console.log(`[catalogue] Removed ${removed} unused image files`)
  }
  console.log(`[catalogue] ${catalogue.products.length} products from ${source} written to src/generated/catalogue.json`)
  if (catalogue.products.length === 0) {
    console.warn("[catalogue] No published products. The site will show an empty state.")
  }
}

main().catch((err) => {
  console.error(`[catalogue] Sync failed: ${err instanceof Error ? err.message : String(err)}`)
  console.error("[catalogue] If Supabase is paused (free projects pause after a week of inactivity), restore it in the Supabase dashboard and build again.")
  process.exit(1)
})

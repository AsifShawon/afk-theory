import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import {
  createCollectionsWorkflow,
  createProductCategoriesWorkflow,
  updateProductsWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * One-off, additive catalog setup for the two product lines:
 *
 *   Collections: "Drop Shoulder Tees" (drop-shoulder-tees), "Hoodies" (hoodies)
 *   Categories:  "Basic Hoodie" (basic-hoodie), "Drop Shoulder Hoodie" (drop-shoulder-hoodie)
 *
 * It only creates what is missing. It never deletes or renames anything.
 * Pass the word assign-tees to also move existing tees (products in the
 * "Drop Shoulder T-Shirts" category) into the Drop Shoulder Tees collection.
 *
 * Run from apps/backend:
 *   pnpm exec medusa exec ./src/scripts/restructure-catalog.ts
 *   pnpm exec medusa exec ./src/scripts/restructure-catalog.ts assign-tees
 */

const COLLECTIONS = [
  { title: "Drop Shoulder Tees", handle: "drop-shoulder-tees" },
  { title: "Hoodies", handle: "hoodies" },
]

const CATEGORIES = [
  { name: "Basic Hoodie", handle: "basic-hoodie" },
  { name: "Drop Shoulder Hoodie", handle: "drop-shoulder-hoodie" },
]

const TEE_CATEGORY_HANDLE = "drop-shoulder-t-shirts"

export default async function restructureCatalog({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const assignTees = Boolean(args?.some((arg) => arg === "assign-tees" || arg === "--assign-tees"))

  // Collections
  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title", "handle"],
  })
  const existingCollectionHandles = new Set(
    existingCollections.map((c: { handle: string }) => c.handle)
  )
  const missingCollections = COLLECTIONS.filter((c) => !existingCollectionHandles.has(c.handle))

  if (missingCollections.length > 0) {
    await createCollectionsWorkflow(container).run({
      input: { collections: missingCollections },
    })
    logger.info(`Created collections: ${missingCollections.map((c) => c.title).join(", ")}`)
  } else {
    logger.info("Collections already exist.")
  }

  // Categories
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name", "handle"],
  })
  const existingCategoryHandles = new Set(
    existingCategories.map((c: { handle: string }) => c.handle)
  )
  const missingCategories = CATEGORIES.filter((c) => !existingCategoryHandles.has(c.handle))

  if (missingCategories.length > 0) {
    await createProductCategoriesWorkflow(container).run({
      input: {
        product_categories: missingCategories.map((c) => ({
          name: c.name,
          handle: c.handle,
          is_active: true,
        })),
      },
    })
    logger.info(`Created categories: ${missingCategories.map((c) => c.name).join(", ")}`)
  } else {
    logger.info("Categories already exist.")
  }

  // Optionally move existing tees into the Drop Shoulder Tees collection
  if (assignTees) {
    const { data: collections } = await query.graph({
      entity: "product_collection",
      fields: ["id", "handle"],
      filters: { handle: "drop-shoulder-tees" },
    })
    const teesCollectionId = collections[0]?.id as string | undefined

    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "collection_id", "categories.handle"],
    })
    const tees = products.filter((product) => {
      const categories = (product.categories ?? []) as ({ handle?: string } | null)[]
      const isTee = categories.some((c) => c?.handle === TEE_CATEGORY_HANDLE)
      return isTee && product.collection_id !== teesCollectionId
    })

    for (const tee of tees) {
      await updateProductsWorkflow(container).run({
        input: { selector: { id: tee.id }, update: { collection_id: teesCollectionId } },
      })
      logger.info(`Moved "${tee.title}" into Drop Shoulder Tees.`)
    }
    if (tees.length === 0) logger.info("No tees needed moving.")
  }

  logger.info("Catalog structure is ready.")
}

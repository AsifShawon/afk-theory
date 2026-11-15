import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"
import { markdownToHtml, STANDARD_STREETWEAR_TEMPLATE, sanitizeRichDescription } from "../utils/rich-description"

/**
 * Subscriber to initialize and ensure rich product description whenever
 * a new product is added via Medusa Admin, API, or workflows.
 */
export default async function productCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "description", "metadata"],
      filters: { id: data.id },
    })

    const product = products[0]
    if (!product) {
      return
    }

    const currentMetadata = (product.metadata as Record<string, unknown>) || {}
    const existingRich = currentMetadata.rich_description as string | undefined

    // If rich description already provided during creation, don't overwrite
    if (existingRich && existingRich.trim().length > 0) {
      return
    }

    // Convert plain description to structured rich HTML, or fallback to standard streetwear template
    let richHtml = ""
    if (product.description && product.description.trim().length > 0) {
      richHtml = markdownToHtml(product.description)
    } else {
      richHtml = STANDARD_STREETWEAR_TEMPLATE
    }

    const sanitized = sanitizeRichDescription(richHtml)

    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            metadata: {
              ...currentMetadata,
              rich_description: sanitized,
              fabric_tab_title:
                (currentMetadata.fabric_tab_title as string) ||
                "Fabric Engineering & Care",
              fabric_material:
                (currentMetadata.fabric_material as string) ||
                (currentMetadata.material as string) ||
                (product as any).material ||
                "240 GSM Combed Compact Cotton",
              fabric_origin:
                (currentMetadata.fabric_origin as string) ||
                (currentMetadata.origin as string) ||
                "Dhaka, Bangladesh",
              fabric_care_instructions:
                (currentMetadata.fabric_care_instructions as string) ||
                "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints.",
            },
          },
        ],
      },
    })

    logger.info(
      `[Subscriber: product.created] Successfully initialized rich description for product "${product.title}" (${product.id})`
    )
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    logger.error(
      `[Subscriber: product.created] Failed to initialize rich description for product ${data.id}: ${msg}`
    )
  }
}

export const config: SubscriberConfig = {
  event: "product.created",
}

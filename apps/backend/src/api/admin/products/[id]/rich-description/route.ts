import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Server-side sanitizer for rich product description HTML.
 * Strips script tags, style tags, iframes, and dangerous attributes.
 */
function sanitizeRichDescription(rawHtml: string): string {
  if (!rawHtml) return ""

  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim()
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "title", "material", "description", "metadata"],
      filters: { id },
    })

    const product = products[0]
    if (!product) {
      return res.status(404).json({
        message: `Product with id ${id} not found`,
        type: "not_found",
      })
    }

    const metadata = (product.metadata as Record<string, unknown>) || {}
    const richDescription = (metadata.rich_description as string) || null

    return res.json({
      product_id: id,
      rich_description: richDescription,
      plain_description: product.description,
      fabric_tab_title:
        (metadata.fabric_tab_title as string) || "Fabric Engineering & Care",
      fabric_material:
        (metadata.fabric_material as string) ||
        (metadata.material as string) ||
        product.material ||
        "240 GSM Combed Compact Cotton",
      fabric_origin:
        (metadata.fabric_origin as string) ||
        (metadata.origin as string) ||
        "Dhaka, Bangladesh",
      fabric_care_instructions:
        (metadata.fabric_care_instructions as string) ||
        (metadata.care_instructions as string) ||
        "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints.",
      fabric_custom_content: (metadata.fabric_custom_content as string) || "",
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to load rich description",
      type: "internal_error",
    })
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params
  const body = req.body as {
    rich_description?: string
    fabric_tab_title?: string
    fabric_material?: string
    fabric_origin?: string
    fabric_care_instructions?: string
    fabric_custom_content?: string
  }

  const rawHtml = body?.rich_description || ""

  // Content length guard: max 64KB
  if (rawHtml.length > 65536) {
    return res.status(400).json({
      message: "Rich description exceeds maximum allowed length of 64KB.",
      type: "invalid_data",
    })
  }

  const sanitized = sanitizeRichDescription(rawHtml)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    const { data: products } = await query.graph({
      entity: "product",
      fields: ["id", "metadata"],
      filters: { id },
    })

    const product = products[0]
    if (!product) {
      return res.status(404).json({
        message: `Product with id ${id} not found`,
        type: "not_found",
      })
    }

    const currentMetadata = (product.metadata as Record<string, unknown>) || {}

    const newMetadata: Record<string, unknown> = {
      ...currentMetadata,
      rich_description: sanitized,
    }

    if (body.fabric_tab_title !== undefined) {
      newMetadata.fabric_tab_title = body.fabric_tab_title.trim()
    }
    if (body.fabric_material !== undefined) {
      newMetadata.fabric_material = body.fabric_material.trim()
      newMetadata.material = body.fabric_material.trim()
    }
    if (body.fabric_origin !== undefined) {
      newMetadata.fabric_origin = body.fabric_origin.trim()
      newMetadata.origin = body.fabric_origin.trim()
    }
    if (body.fabric_care_instructions !== undefined) {
      newMetadata.fabric_care_instructions = body.fabric_care_instructions.trim()
    }
    if (body.fabric_custom_content !== undefined) {
      newMetadata.fabric_custom_content = sanitizeRichDescription(
        body.fabric_custom_content
      )
    }

    const { result } = await updateProductsWorkflow(req.scope).run({
      input: {
        products: [
          {
            id,
            metadata: newMetadata,
          },
        ],
      },
    })

    return res.json({
      success: true,
      product: result[0],
      rich_description: sanitized,
      fabric_tab_title: newMetadata.fabric_tab_title,
      fabric_material: newMetadata.fabric_material,
      fabric_origin: newMetadata.fabric_origin,
      fabric_care_instructions: newMetadata.fabric_care_instructions,
      fabric_custom_content: newMetadata.fabric_custom_content,
    })
  } catch (error: any) {
    return res.status(500).json({
      message: error?.message || "Failed to save rich description and fabric configuration",
      type: "internal_error",
    })
  }
}

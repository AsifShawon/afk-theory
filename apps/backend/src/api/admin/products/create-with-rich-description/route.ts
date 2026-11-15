import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { sanitizeRichDescription, STANDARD_STREETWEAR_TEMPLATE } from "../../../../utils/rich-description"

interface CreateProductBody {
  title: string
  subtitle?: string
  handle?: string
  material?: string
  price: number
  status?: "published" | "draft"
  colors?: string[]
  sizes?: string[]
  rich_description?: string
  fabric_tab_title?: string
  fabric_material?: string
  fabric_origin?: string
  fabric_care_instructions?: string
  fabric_custom_content?: string
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const body = req.body as CreateProductBody

  if (!body.title || !body.title.trim()) {
    return res.status(400).json({
      message: "Product title is required.",
      type: "invalid_data",
    })
  }

  const title = body.title.trim()
  const subtitle = body.subtitle?.trim() || ""
  const material = body.material?.trim() || "100% Pre-Shrunk Heavyweight Cotton"
  const price = typeof body.price === "number" && body.price >= 0 ? body.price : 1450
  const status = body.status === "draft" ? ProductStatus.DRAFT : ProductStatus.PUBLISHED

  const handle =
    body.handle?.trim() ||
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")

  const rawRich = body.rich_description?.trim() || STANDARD_STREETWEAR_TEMPLATE
  const sanitizedRich = sanitizeRichDescription(rawRich)

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  try {
    // 1. Resolve default sales channels if available
    const { data: salesChannels } = await query
      .graph({
        entity: "sales_channel",
        fields: ["id"],
      })
      .catch(() => ({ data: [] }))
    const salesChannelInputs =
      salesChannels && salesChannels.length > 0
        ? salesChannels.map((sc: { id: string }) => ({ id: sc.id }))
        : undefined

    // 2. Resolve default shipping profile if available
    const { data: shippingProfiles } = await query
      .graph({
        entity: "shipping_profile",
        fields: ["id"],
      })
      .catch(() => ({ data: [] }))
    const shippingProfileId = shippingProfiles?.[0]?.id

    // 3. Build Options and Variants
    const colors = (body.colors || [])
      .map((c) => c.trim())
      .filter((c) => c.length > 0)
    const sizes = (body.sizes || [])
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    const options: Array<{ title: string; values: string[] }> = []
    if (colors.length > 0) {
      options.push({ title: "Color", values: colors })
    }
    if (sizes.length > 0) {
      options.push({ title: "Size", values: sizes })
    }

    const variants: Array<{
      title: string
      sku: string
      options?: Record<string, string>
      prices: Array<{ amount: number; currency_code: string }>
      manage_inventory: boolean
      allow_backorder: boolean
    }> = []

    const prefix = handle.toUpperCase().slice(0, 10).replace(/[^A-Z0-9]/g, "")

    if (colors.length > 0 && sizes.length > 0) {
      for (const color of colors) {
        for (const size of sizes) {
          const colorCode = color.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, "")
          variants.push({
            title: `${color} / ${size}`,
            sku: `${prefix}-${colorCode}-${size}`,
            options: { Color: color, Size: size },
            prices: [{ amount: price, currency_code: "bdt" }],
            manage_inventory: true,
            allow_backorder: true,
          })
        }
      }
    } else if (sizes.length > 0) {
      for (const size of sizes) {
        variants.push({
          title: size,
          sku: `${prefix}-${size}`,
          options: { Size: size },
          prices: [{ amount: price, currency_code: "bdt" }],
          manage_inventory: true,
          allow_backorder: true,
        })
      }
    } else if (colors.length > 0) {
      for (const color of colors) {
        const colorCode = color.toUpperCase().slice(0, 3).replace(/[^A-Z]/g, "")
        variants.push({
          title: color,
          sku: `${prefix}-${colorCode}`,
          options: { Color: color },
          prices: [{ amount: price, currency_code: "bdt" }],
          manage_inventory: true,
          allow_backorder: true,
        })
      }
    } else {
      variants.push({
        title: "Standard",
        sku: `${prefix}-STD`,
        prices: [{ amount: price, currency_code: "bdt" }],
        manage_inventory: false,
        allow_backorder: true,
      })
    }

    // 4. Execute createProductsWorkflow
    const { result } = await createProductsWorkflow(req.scope).run({
      input: {
        products: [
          {
            title,
            subtitle,
            handle,
            material,
            status,
            description: subtitle || `${title} — Streetwear garment crafted by AFK THEORY.`,
            shipping_profile_id: shippingProfileId,
            sales_channels: salesChannelInputs,
            options: options.length > 0 ? options : undefined,
            variants,
            metadata: {
              rich_description: sanitizedRich,
              fabric_tab_title:
                body.fabric_tab_title?.trim() || "Fabric Engineering & Care",
              fabric_material:
                body.fabric_material?.trim() ||
                material ||
                "240 GSM Combed Compact Cotton",
              fabric_origin:
                body.fabric_origin?.trim() || "Dhaka, Bangladesh",
              fabric_care_instructions:
                body.fabric_care_instructions?.trim() ||
                "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints.",
              fabric_custom_content: body.fabric_custom_content
                ? sanitizeRichDescription(body.fabric_custom_content)
                : undefined,
            },
          },
        ],
      },
    })

    const createdProduct = result[0]

    return res.status(201).json({
      success: true,
      product: createdProduct,
      product_id: createdProduct.id,
      rich_description: sanitizedRich,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product"
    return res.status(500).json({
      message,
      type: "internal_error",
    })
  }
}

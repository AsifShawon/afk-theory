import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

export const CURATED_DROP_SHOULDER_HTML = `<p class="editorial-tagline"><em>Engineered for contemporary streetwear rotation with a relaxed, architectural drape.</em></p>

<p>The AFK THEORY Essential Oversized Drop Shoulder T-Shirt is constructed from 240 GSM combed compact cotton. Cut with an exaggerated boxy circumference and dropped shoulder seams, it balances substantial drape with breathability in all climates.</p>

<h3 class="spec-heading">// KEY SPECIFICATIONS &amp; ARCHITECTURE</h3>
<ul class="streetwear-features">
  <li><strong>240 GSM Compact Cotton:</strong> Heavyweight yet breathable knit structured to hold its boxy silhouette without sagging.</li>
  <li><strong>Engineered Drop Shoulder:</strong> Calibrated shoulder slope ensures a natural streetwear slouch without excess underarm bunching.</li>
  <li><strong>Reinforced Ribbed Crewneck:</strong> 1.25-inch high-density ribbed collar with double-needle topstitching to prevent neckline deformation.</li>
  <li><strong>Preshrunk Combed Yarn:</strong> Enzyme-washed fabric preserves dimensional stability and handfeel across repeated washes.</li>
  <li><strong>Twin-Needle Edge Stitching:</strong> Clean 6mm edge finishes along cuffs and bottom hem for refined streetwear minimalism.</li>
</ul>

<div class="spec-strip">
  <span class="spec-strip-label">STYLE PROFILE</span>
  <span class="spec-strip-val">Relaxed Streetwear / Boxy Dropped Shoulder</span>
</div>

<div class="fit-card">
  <strong class="fit-card-title">FIT GUIDANCE</strong>
  <p class="fit-card-body">Designed for an intentional relaxed oversized fit. Take your normal size for the intended streetwear drape, or size down one size for a more tailored standard fit.</p>
</div>`

export default async function upgradeDropShoulderDescription({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  logger.info("Executing product rich description upgrade script...")

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "metadata"],
  })

  logger.info(`Loaded ${products.length} products from database.`)

  for (const product of products) {
    logger.info(`Product: "${product.title}" (${product.id}, handle: ${product.handle})`)
    const existingMeta = (product.metadata as Record<string, unknown>) || {}

    // Target the drop shoulder t-shirt or any product with drop shoulder in title/handle
    const isTarget =
      product.handle?.includes("drop-shoulder") ||
      product.title?.toLowerCase().includes("drop shoulder") ||
      product.handle?.includes("afk-essential")

    if (isTarget) {
      logger.info(`Upgrading product "${product.title}" with curated luxury streetwear rich description...`)
      await updateProductsWorkflow(container).run({
        input: {
          products: [
            {
              id: product.id,
              metadata: {
                ...existingMeta,
                rich_description: CURATED_DROP_SHOULDER_HTML,
                rich_description_upgraded_at: new Date().toISOString(),
                fit: "Oversized / Dropped Shoulder (Size down for tailored fit)",
                origin: "Engineered & Ethically Crafted in Dhaka, Bangladesh",
                fabric_tab_title: "Fabric Engineering & Care",
                fabric_material: "240 GSM Combed Compact Cotton",
                fabric_origin: "Dhaka, Bangladesh",
                fabric_care_instructions:
                  "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints.",
              },
            },
          ],
        },
      })
      logger.info(`Product "${product.title}" (${product.id}) upgraded successfully.`)
    }
  }

  logger.info("Product rich description upgrade completed.")
}

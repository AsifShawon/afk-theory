import { MedusaContainer } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/medusa/core-flows"

/**
 * Deterministically converts markdown-like product copy into clean, structured HTML.
 */
export function convertMarkdownToRichHtml(raw: string): string {
  if (!raw || !raw.trim()) return ""

  const lines = raw.split(/\r?\n/)
  const htmlParts: string[] = []
  let inList = false
  let listType: "ul" | "ol" = "ul"

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${listType}>`)
      inList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      closeList()
      continue
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        closeList()
        htmlParts.push("<ul>")
        inList = true
        listType = "ul"
      }
      const itemContent = line.slice(2).trim()
      htmlParts.push(`<li>${inlineFormat(itemContent)}</li>`)
      continue
    }

    // Numbered list
    const numMatch = line.match(/^\d+\.\s+(.*)/)
    if (numMatch) {
      if (!inList || listType !== "ol") {
        closeList()
        htmlParts.push("<ol>")
        inList = true
        listType = "ol"
      }
      htmlParts.push(`<li>${inlineFormat(numMatch[1].trim())}</li>`)
      continue
    }

    closeList()

    // Standalone bold heading: **Heading Title**
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4 && !line.slice(2, -2).includes("**")) {
      const headingText = line.slice(2, -2).trim()
      htmlParts.push(`<h2>${headingText}</h2>`)
      continue
    }

    // Markdown headings
    if (line.startsWith("### ")) {
      htmlParts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      htmlParts.push(`<h2>${inlineFormat(line.replace(/^#+\s*/, ""))}</h2>`)
      continue
    }

    // Regular paragraph
    htmlParts.push(`<p>${inlineFormat(line)}</p>`)
  }

  closeList()
  return htmlParts.join("\n")
}

function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
}

export default async function migrate_rich_descriptions({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const isDryRun = process.env.DRY_RUN === "true"

  logger.info(
    `Starting safe, non-destructive rich description migration (Mode: ${
      isDryRun ? "DRY-RUN PREVIEW" : "APPLY"
    })...`
  )

  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "description", "metadata"],
  })

  logger.info(`Found ${products.length} products to evaluate for rich description migration.`)

  let migratedCount = 0
  let skippedCount = 0

  for (const product of products) {
    const existingMetadata = (product.metadata as Record<string, unknown>) || {}
    const existingRich = existingMetadata.rich_description as string | undefined

    if (existingRich && existingRich.trim().length > 0) {
      logger.info(
        `[SKIP] Product "${product.title}" (${product.id}) already has rich description.`
      )
      skippedCount++
      continue
    }

    const plainDesc = product.description || ""
    if (!plainDesc.trim()) {
      logger.info(
        `[SKIP] Product "${product.title}" (${product.id}) has no description to migrate.`
      )
      skippedCount++
      continue
    }

    const convertedHtml = convertMarkdownToRichHtml(plainDesc)

    if (isDryRun) {
      logger.info(`[DRY-RUN PREVIEW] Would migrate product "${product.title}" (${product.id}):`)
      logger.info(convertedHtml)
      migratedCount++
      continue
    }

    logger.info(`[MIGRATE] Applying rich description for "${product.title}" (${product.id})...`)

    await updateProductsWorkflow(container).run({
      input: {
        products: [
          {
            id: product.id,
            metadata: {
              ...existingMetadata,
              rich_description: convertedHtml,
              rich_description_migrated_at: new Date().toISOString(),
            },
          },
        ],
      },
    })

    migratedCount++
  }

  logger.info(
    `Rich description migration complete. Migrated: ${migratedCount}, Skipped: ${skippedCount}.`
  )
}

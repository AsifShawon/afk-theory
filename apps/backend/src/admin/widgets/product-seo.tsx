import { useState } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Badge, Button, Container, Heading, Input, Text, Textarea, toast } from "@medusajs/ui"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"

const TITLE_LIMIT = 60
const DESCRIPTION_LIMIT = 160
const BRAND = "AFK THEORY"

function readMetadata(product: AdminProduct, key: string): string {
  const value = product.metadata?.[key]
  return typeof value === "string" ? value : ""
}

function shorten(text: string, limit: number): string {
  const clean = text.replace(/\s+/g, " ").trim()
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1).trimEnd()}…`
}

function Counter({ value, limit }: { value: string; limit: number }) {
  const over = value.length > limit
  return (
    <Text size="xsmall" className={over ? "text-ui-fg-error" : "text-ui-fg-muted"}>
      {value.length} / {limit} characters
    </Text>
  )
}

/**
 * Lets the store owner write the search-result title and description for a
 * product. The storefront reads metadata.seo_title and metadata.seo_description.
 */
const ProductSeoWidget = ({ data: product }: DetailWidgetProps<AdminProduct>) => {
  const [savedTitle, setSavedTitle] = useState(readMetadata(product, "seo_title"))
  const [savedDescription, setSavedDescription] = useState(
    readMetadata(product, "seo_description")
  )
  const [title, setTitle] = useState(savedTitle)
  const [description, setDescription] = useState(savedDescription)
  const [isSaving, setIsSaving] = useState(false)

  const isDirty = title !== savedTitle || description !== savedDescription

  const previewTitle = `${title.trim() || product.title} | ${BRAND}`
  const previewDescription = shorten(
    description.trim() || product.description || product.subtitle || "",
    DESCRIPTION_LIMIT
  )
  const previewUrl = `/products/${product.handle}`

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Send the full metadata so nothing else on the product is lost.
      const res = await fetch(`/admin/products/${product.id}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...(product.metadata ?? {}),
            seo_title: title.trim(),
            seo_description: description.trim(),
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body?.message || "Could not save SEO settings")
      }
      setTitle(title.trim())
      setDescription(description.trim())
      setSavedTitle(title.trim())
      setSavedDescription(description.trim())
      toast.success("SEO settings saved")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save SEO settings")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Search engine listing (SEO)</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            How this product appears on Google. Leave blank to use the product title and
            description.
          </Text>
        </div>
        {isDirty && <Badge color="orange">Unsaved changes</Badge>}
      </div>

      <div className="grid gap-4 px-6 py-4">
        <div className="grid gap-1">
          <Text size="small" weight="plus">
            Page title
          </Text>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={product.title}
          />
          <Counter value={title} limit={TITLE_LIMIT} />
        </div>

        <div className="grid gap-1">
          <Text size="small" weight="plus">
            Meta description
          </Text>
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="One or two sentences that make someone want to click."
          />
          <Counter value={description} limit={DESCRIPTION_LIMIT} />
        </div>

        <div className="rounded-lg border border-ui-border-base bg-ui-bg-subtle p-4">
          <Text size="xsmall" className="text-ui-fg-muted">
            Preview (approximate)
          </Text>
          <Text size="small" className="text-ui-fg-interactive" weight="plus">
            {shorten(previewTitle, TITLE_LIMIT + BRAND.length + 3)}
          </Text>
          <Text size="xsmall" className="text-ui-fg-subtle">
            {previewUrl}
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {previewDescription || "No description yet."}
          </Text>
        </div>

        <div className="flex justify-end">
          <Button size="small" onClick={handleSave} isLoading={isSaving} disabled={!isDirty}>
            Save SEO settings
          </Button>
        </div>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.after",
})

export default ProductSeoWidget

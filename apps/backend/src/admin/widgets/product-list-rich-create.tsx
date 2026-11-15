import React, { useState, useMemo, useCallback } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  Select,
  FocusModal,
  toast,
} from "@medusajs/ui"
import { Plus, Sparkles } from "@medusajs/icons"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { STANDARD_STREETWEAR_TEMPLATE } from "../../utils/rich-description"

const ProductListRichCreateWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form Fields
  const [title, setTitle] = useState("")
  const [subtitle, setSubtitle] = useState("240 GSM Combed Compact Cotton")
  const [handle, setHandle] = useState("")
  const [material, setMaterial] = useState("100% Pre-Shrunk Heavyweight Cotton")
  const [price, setPrice] = useState("1450")
  const [status, setStatus] = useState<"published" | "draft">("published")
  const [colorsInput, setColorsInput] = useState("Black, Bone White, Vintage Charcoal")
  const [sizesInput, setSizesInput] = useState("S, M, L, XL")

  // Fabric & Care Customization
  const [fabricTabTitle, setFabricTabTitle] = useState("Fabric Engineering & Care")
  const [fabricOrigin, setFabricOrigin] = useState("Dhaka, Bangladesh")
  const [fabricCare, setFabricCare] = useState(
    "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints."
  )

  // Preview toggle in modal
  const [isPreview, setIsPreview] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-[#D8F452] underline underline-offset-2",
        },
      }),
    ],
    content: STANDARD_STREETWEAR_TEMPLATE,
  })

  // Auto-slugify handle when title changes
  const handleTitleChange = (val: string) => {
    setTitle(val)
    const slug = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
    setHandle(slug)
  }

  const setLink = useCallback(() => {
    if (!editor) return
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("Enter hyperlink URL:", previousUrl)

    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  const handleResetToTemplate = () => {
    if (!editor) return
    editor.commands.setContent(STANDARD_STREETWEAR_TEMPLATE)
    toast.info("Template Restored", {
      description: "Restored standard AFK THEORY streetwear template.",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) {
      toast.error("Validation Error", {
        description: "Product title is required.",
      })
      return
    }

    const numPrice = parseFloat(price)
    if (isNaN(numPrice) || numPrice < 0) {
      toast.error("Validation Error", {
        description: "Please enter a valid price in BDT.",
      })
      return
    }

    const richHtml = editor?.getHTML() || STANDARD_STREETWEAR_TEMPLATE

    const colors = colorsInput
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0)

    const sizes = sizesInput
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    setIsSubmitting(true)

    try {
      const response = await fetch(
        "/admin/products/create-with-rich-description",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            title,
            subtitle,
            handle,
            material,
            price: numPrice,
            status,
            colors,
            sizes,
            rich_description: richHtml,
            fabric_tab_title: fabricTabTitle,
            fabric_material: material,
            fabric_origin: fabricOrigin,
            fabric_care_instructions: fabricCare,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || "Failed to create product.")
      }

      toast.success("Product Created", {
        description: `Created "${title}" with rich description and BDT ${numPrice} pricing.`,
      })

      setIsOpen(false)

      // Redirect to the newly created product
      if (result.product_id) {
        window.location.href = `/app/products/${result.product_id}`
      } else {
        window.location.reload()
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Creation failed"
      toast.error("Creation Failed", { description: msg })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Container className="p-4 bg-[#18181B] border-[#27272A] text-[#F4F4F5] mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#27272A] border border-[#3F3F46] flex items-center justify-center text-[#D8F452]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Heading level="h3" className="text-white text-sm font-bold">
                  AFK THEORY Product Studio
                </Heading>
                <Badge color="green" className="text-[10px]">
                  Rich-Text Ready
                </Badge>
              </div>
              <p className="text-[#A1A1AA] text-xs">
                Author new streetwear garments with WYSIWYG formatted description, fabric specs, and BDT prices.
              </p>
            </div>
          </div>

          <Button
            size="small"
            variant="primary"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-1.5 text-xs bg-[#20241F] text-[#D8F452] hover:bg-black border border-[#D8F452]/40"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create with Rich Description</span>
          </Button>
        </div>
      </Container>

      {/* Product Creation Modal */}
      <FocusModal open={isOpen} onOpenChange={setIsOpen}>
        <FocusModal.Content className="bg-[#121214] text-[#F4F4F5] border-[#27272A]">
          <FocusModal.Header className="border-b border-[#27272A] px-6 py-4 flex items-center justify-between bg-[#18181B]">
            <div>
              <FocusModal.Title className="text-white text-base font-bold flex items-center gap-2">
                <span>Create Garment with Rich Description</span>
                <Badge color="blue" className="text-[10px]">
                  Studio Flow
                </Badge>
              </FocusModal.Title>
              <FocusModal.Description className="text-xs text-[#A1A1AA] mt-0.5">
                Configure garment identity, sizes, colors, and author the customer-facing rich description.
              </FocusModal.Description>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="small"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="small"
                onClick={handleSubmit}
                isLoading={isSubmitting}
                className="text-xs bg-[#20241F] text-[#D8F452] hover:bg-black border border-[#D8F452]/40"
              >
                Create Product
              </Button>
            </div>
          </FocusModal.Header>

          <FocusModal.Body className="p-6 overflow-y-auto max-h-[calc(100vh-140px)] space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
              {/* Section 1: Garment Identity */}
              <div className="p-5 rounded-lg bg-[#18181B] border border-[#27272A] space-y-4">
                <Heading level="h3" className="text-white text-sm font-bold border-b border-[#27272A] pb-2">
                  1. Garment Identity
                </Heading>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Title <span className="text-rose-400">*</span>
                    </Label>
                    <Input
                      placeholder="e.g. AFK THEORY Heavyweight Oversized Tee"
                      value={title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      required
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Subtitle / Fit Pitch
                    </Label>
                    <Input
                      placeholder="e.g. 240 GSM Combed Compact Cotton"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      URL Handle
                    </Label>
                    <Input
                      placeholder="e.g. afk-theory-heavyweight-oversized-tee"
                      value={handle}
                      onChange={(e) => setHandle(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs font-mono"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Material Specification
                    </Label>
                    <Input
                      placeholder="e.g. 100% Pre-Shrunk Heavyweight Cotton"
                      value={material}
                      onChange={(e) => setMaterial(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Selling Price (BDT ৳)
                    </Label>
                    <Input
                      type="number"
                      placeholder="1450"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Publication Status
                    </Label>
                    <Select
                      value={status}
                      onValueChange={(v: "published" | "draft") => setStatus(v)}
                    >
                      <Select.Trigger className="bg-[#0E0E10] border-[#27272A] text-white text-xs">
                        <Select.Value />
                      </Select.Trigger>
                      <Select.Content className="bg-[#18181B] border-[#27272A] text-white text-xs">
                        <Select.Item value="published">Published (Live on Storefront)</Select.Item>
                        <Select.Item value="draft">Draft (Hidden)</Select.Item>
                      </Select.Content>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Section 2: Colors and Sizes Options */}
              <div className="p-5 rounded-lg bg-[#18181B] border border-[#27272A] space-y-4">
                <Heading level="h3" className="text-white text-sm font-bold border-b border-[#27272A] pb-2">
                  2. Sizing &amp; Colorway Variants
                </Heading>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Colors (comma-separated)
                    </Label>
                    <Input
                      placeholder="e.g. Black, Bone White, Vintage Charcoal"
                      value={colorsInput}
                      onChange={(e) => setColorsInput(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                    <p className="text-[11px] text-[#71717A] mt-1">
                      Generates color swatches and variant combinations.
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Sizes (comma-separated)
                    </Label>
                    <Input
                      placeholder="e.g. S, M, L, XL"
                      value={sizesInput}
                      onChange={(e) => setSizesInput(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                    <p className="text-[11px] text-[#71717A] mt-1">
                      Generates Quick-Add size chips on the storefront card.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 3: Fabric & Care Accordion Customization */}
              <div className="p-5 rounded-lg bg-[#18181B] border border-[#27272A] space-y-4">
                <Heading level="h3" className="text-white text-sm font-bold border-b border-[#27272A] pb-2">
                  3. Fabric &amp; Care Accordion Customization
                </Heading>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Tab Title (Accordion Header)
                    </Label>
                    <Input
                      placeholder="Fabric Engineering & Care"
                      value={fabricTabTitle}
                      onChange={(e) => setFabricTabTitle(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                    <p className="text-[11px] text-[#71717A] mt-1">
                      Customize what this accordion tab is called on the product page (e.g. <em>Fabric Engineering &amp; Care</em>, <em>Materials &amp; Sustainability</em>).
                    </p>
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Manufacturing Origin
                    </Label>
                    <Input
                      placeholder="Dhaka, Bangladesh"
                      value={fabricOrigin}
                      onChange={(e) => setFabricOrigin(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white text-xs"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Fabric Composition
                    </Label>
                    <Input
                      placeholder="Inherits Material Specification"
                      value={material}
                      disabled
                      className="bg-[#0E0E10]/50 border-[#27272A] text-[#A1A1AA] text-xs"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label className="text-xs text-[#E4E4E7] font-semibold mb-1 block">
                      Maintenance Protocol (Format: Action: Detail)
                    </Label>
                    <Textarea
                      rows={3}
                      value={fabricCare}
                      onChange={(e) => setFabricCare(e.target.value)}
                      className="bg-[#0E0E10] border-[#27272A] text-white font-mono text-xs leading-relaxed"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Rich-Text Description */}
              <div className="p-5 rounded-lg bg-[#18181B] border border-[#27272A] space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272A] pb-2">
                  <div>
                    <Heading level="h3" className="text-white text-sm font-bold">
                      4. Rich Product Description
                    </Heading>
                    <p className="text-xs text-[#A1A1AA] mt-0.5">
                      WYSIWYG formatting rendered on the storefront product page.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="small"
                      variant="secondary"
                      onClick={handleResetToTemplate}
                      className="text-xs bg-[#27272A] text-white hover:bg-[#3F3F46]"
                    >
                      Reset to Template
                    </Button>
                    <Button
                      type="button"
                      size="small"
                      variant={isPreview ? "primary" : "secondary"}
                      onClick={() => setIsPreview(!isPreview)}
                      className="text-xs"
                    >
                      {isPreview ? "Edit Mode" : "Preview"}
                    </Button>
                  </div>
                </div>

                {editor && (
                  <div className="border border-[#27272A] rounded-lg overflow-hidden bg-[#121214] shadow-sm">
                    {/* Toolbar */}
                    {!isPreview && (
                      <div className="flex flex-wrap items-center gap-1 p-2 bg-[#1C1C1F] border-b border-[#27272A] text-xs">
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().setParagraph().run()}
                          className={`px-2 py-1 rounded font-medium transition-colors ${
                            editor.isActive("paragraph")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          P
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                          className={`px-2 py-1 rounded font-bold transition-colors ${
                            editor.isActive("heading", { level: 1 })
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          H1
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                          className={`px-2 py-1 rounded font-bold transition-colors ${
                            editor.isActive("heading", { level: 2 })
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          H2
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                          className={`px-2 py-1 rounded font-bold transition-colors ${
                            editor.isActive("heading", { level: 3 })
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          H3
                        </button>

                        <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleBold().run()}
                          className={`px-2 py-1 rounded font-bold transition-colors ${
                            editor.isActive("bold")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          B
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleItalic().run()}
                          className={`px-2 py-1 rounded italic transition-colors ${
                            editor.isActive("italic")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          I
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleUnderline().run()}
                          className={`px-2 py-1 rounded underline transition-colors ${
                            editor.isActive("underline")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleStrike().run()}
                          className={`px-2 py-1 rounded line-through transition-colors ${
                            editor.isActive("strike")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          S
                        </button>

                        <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleBulletList().run()}
                          className={`px-2 py-1 rounded transition-colors ${
                            editor.isActive("bulletList")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          • List
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleOrderedList().run()}
                          className={`px-2 py-1 rounded transition-colors ${
                            editor.isActive("orderedList")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          1. List
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().toggleBlockquote().run()}
                          className={`px-2 py-1 rounded transition-colors ${
                            editor.isActive("blockquote")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          &ldquo; Quote
                        </button>
                        <button
                          type="button"
                          onClick={setLink}
                          className={`px-2 py-1 rounded transition-colors ${
                            editor.isActive("link")
                              ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40"
                              : "text-[#A1A1AA] hover:text-white"
                          }`}
                        >
                          🔗 Link
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().setHorizontalRule().run()}
                          className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white transition-colors"
                        >
                          ― Divider
                        </button>

                        <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                        <button
                          type="button"
                          onClick={() => editor.chain().focus().undo().run()}
                          disabled={!editor.can().undo()}
                          className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white disabled:opacity-30"
                        >
                          ↶ Undo
                        </button>
                        <button
                          type="button"
                          onClick={() => editor.chain().focus().redo().run()}
                          disabled={!editor.can().redo()}
                          className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white disabled:opacity-30"
                        >
                          ↷ Redo
                        </button>
                      </div>
                    )}

                    {/* Content Input or Preview Area */}
                    <div className="p-5 min-h-[220px] bg-[#0E0E10]">
                      {isPreview ? (
                        <div
                          className="prose prose-sm dark:prose-invert max-w-none text-[#F4F4F5] space-y-3 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_p]:text-[#D4D4D8] [&_strong]:text-white [&_li]:text-[#D4D4D8] [&_li]:marker:text-[#D8F452] [&_blockquote]:border-l-[#D8F452] [&_blockquote]:text-[#A1A1AA]"
                          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
                        />
                      ) : (
                        <EditorContent
                          editor={editor}
                          className="outline-none min-h-[180px] prose prose-sm dark:prose-invert max-w-none text-[#F4F4F5] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror_p]:text-[#E4E4E7] [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h3]:text-white [&_.ProseMirror_strong]:text-white [&_.ProseMirror_li]:marker:text-[#D8F452] [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-[#D8F452] [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_a]:text-[#D8F452]"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </>
  )
}

export const config = defineWidgetConfig({
  zone: "product.list.before",
})

export default ProductListRichCreateWidget

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { DetailWidgetProps } from "@medusajs/admin-sdk"
import { HttpTypes } from "@medusajs/types"
import {
  Container,
  Heading,
  Button,
  Badge,
  Input,
  Textarea,
  Label,
  toast,
} from "@medusajs/ui"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import { STANDARD_STREETWEAR_TEMPLATE, markdownToHtml } from "../../utils/rich-description"

const ProductRichDescriptionWidget = ({
  data,
}: DetailWidgetProps<HttpTypes.AdminProduct>) => {
  const productId = data.id
  const metadata = (data.metadata as Record<string, unknown>) || {}

  const initialRichDescription =
    (metadata.rich_description as string) || ""
  const initialFabricTabTitle =
    (metadata.fabric_tab_title as string) || "Fabric Engineering & Care"
  const initialFabricMaterial =
    (metadata.fabric_material as string) ||
    (metadata.material as string) ||
    data.material ||
    "240 GSM Combed Compact Cotton"
  const initialFabricOrigin =
    (metadata.fabric_origin as string) ||
    (metadata.origin as string) ||
    "Dhaka, Bangladesh"
  const initialFabricCare =
    (metadata.fabric_care_instructions as string) ||
    (metadata.care_instructions as string) ||
    "Wash: Machine wash cold (30°C) inside-out with like dark colors.\nDry: Line dry in shade; do not tumble dry to preserve fabric density.\nIron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints."
  const initialFabricCustomContent =
    (metadata.fabric_custom_content as string) || ""

  // Active view tab inside widget
  const [activeTab, setActiveTab] = useState<"description" | "fabric">("description")

  // Description Editor State
  const [savedContent, setSavedContent] = useState<string>(initialRichDescription)
  const [isPreview, setIsPreview] = useState(false)
  const [previewTheme, setPreviewTheme] = useState<"dark" | "cream">("dark")
  const [isSaving, setIsSaving] = useState(false)

  // Fabric & Care Customization State
  const [fabricTabTitle, setFabricTabTitle] = useState(initialFabricTabTitle)
  const [fabricMaterial, setFabricMaterial] = useState(initialFabricMaterial)
  const [fabricOrigin, setFabricOrigin] = useState(initialFabricOrigin)
  const [fabricCare, setFabricCare] = useState(initialFabricCare)
  const [fabricCustomContent, setFabricCustomContent] = useState(initialFabricCustomContent)

  const [savedFabric, setSavedFabric] = useState({
    title: initialFabricTabTitle,
    material: initialFabricMaterial,
    origin: initialFabricOrigin,
    care: initialFabricCare,
    customContent: initialFabricCustomContent,
  })

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
    content: initialRichDescription,
  })

  // Synchronize if product data changes externally
  useEffect(() => {
    if (editor && initialRichDescription !== savedContent) {
      setSavedContent(initialRichDescription)
      editor.commands.setContent(initialRichDescription)
    }
  }, [initialRichDescription, editor, savedContent])

  const stats = useMemo(() => {
    if (!editor) return { words: 0, characters: 0 }
    const text = editor.getText()
    const words = text.trim() ? text.trim().split(/\s+/).length : 0
    const characters = text.length
    return { words, characters }
  }, [editor?.getText()])

  const isFabricDirty =
    fabricTabTitle !== savedFabric.title ||
    fabricMaterial !== savedFabric.material ||
    fabricOrigin !== savedFabric.origin ||
    fabricCare !== savedFabric.care ||
    fabricCustomContent !== savedFabric.customContent

  const isEditorDirty = editor ? editor.getHTML() !== savedContent : false
  const hasUnsavedChanges = isEditorDirty || isFabricDirty

  const handleSave = async () => {
    if (!editor || isSaving) return

    const htmlContent = editor.getHTML()
    setIsSaving(true)

    try {
      const response = await fetch(`/admin/products/${productId}/rich-description`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          rich_description: htmlContent,
          fabric_tab_title: fabricTabTitle,
          fabric_material: fabricMaterial,
          fabric_origin: fabricOrigin,
          fabric_care_instructions: fabricCare,
          fabric_custom_content: fabricCustomContent,
        }),
      })

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}))
        throw new Error(errJson.message || "Failed to save product details.")
      }

      setSavedContent(htmlContent)
      setSavedFabric({
        title: fabricTabTitle,
        material: fabricMaterial,
        origin: fabricOrigin,
        care: fabricCare,
        customContent: fabricCustomContent,
      })

      toast.success("Saved", {
        description: "Rich description and fabric specifications successfully updated.",
      })
    } catch (error: any) {
      toast.error("Save Failed", {
        description: error?.message || "Could not save product specifications.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "Discard unsaved changes and restore last saved state?"
      )
      if (!confirmed) return
    }
    if (editor) {
      editor.commands.setContent(savedContent)
    }
    setFabricTabTitle(savedFabric.title)
    setFabricMaterial(savedFabric.material)
    setFabricOrigin(savedFabric.origin)
    setFabricCare(savedFabric.care)
    setFabricCustomContent(savedFabric.customContent)
  }

  const handleImportLegacy = () => {
    if (!editor) return
    const plainDesc = data.description || ""
    if (!plainDesc.trim()) {
      editor.commands.setContent(STANDARD_STREETWEAR_TEMPLATE)
      toast.info("Template Loaded", {
        description: "Loaded standard AFK THEORY Drop Shoulder template. Edit and click Save.",
      })
      return
    }

    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        "Importing will replace the editor content with the formatted standard description. Continue?"
      )
      if (!confirmed) return
    }

    const converted = markdownToHtml(plainDesc)
    editor.commands.setContent(converted)
    toast.info("Imported", {
      description: "Converted standard markdown description into rich-text. Review and click Save.",
    })
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

  if (!editor) {
    return (
      <Container className="p-6 bg-[#18181B] border-[#27272A]">
        <div className="flex items-center justify-between">
          <Heading level="h2">Product Experience &amp; Architecture</Heading>
          <Badge color="grey">Loading Editor...</Badge>
        </div>
      </Container>
    )
  }

  return (
    <Container className="p-6 bg-[#18181B] border-[#27272A] text-[#F4F4F5] space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#27272A]">
        <div>
          <div className="flex items-center gap-2">
            <Heading level="h2" className="text-white font-bold text-base">
              Product Experience &amp; Garment Architecture
            </Heading>
            {hasUnsavedChanges ? (
              <Badge color="orange">Unsaved Changes</Badge>
            ) : savedContent ? (
              <Badge color="green">Published to Storefront</Badge>
            ) : (
              <Badge color="grey">Empty Description</Badge>
            )}
          </div>
          <p className="text-[#A1A1AA] text-xs mt-1">
            WYSIWYG editor for product presentation, plus full customization for the Fabric &amp; Care accordion tab.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {activeTab === "description" && (
            <>
              <Button
                size="small"
                variant="secondary"
                onClick={handleImportLegacy}
                title="Convert and load existing plain/markdown product description or template"
                className="text-xs bg-[#27272A] hover:bg-[#3F3F46] text-[#F4F4F5] border-[#3F3F46]"
              >
                Import Standard Description
              </Button>
              <Button
                size="small"
                variant={isPreview ? "primary" : "secondary"}
                onClick={() => setIsPreview(!isPreview)}
                className="text-xs"
              >
                {isPreview ? "Exit Preview" : "Storefront Preview"}
              </Button>
            </>
          )}
          {hasUnsavedChanges && (
            <Button
              size="small"
              variant="secondary"
              onClick={handleReset}
              className="text-xs text-rose-400 hover:text-rose-300"
            >
              Discard
            </Button>
          )}
          <Button
            size="small"
            variant="primary"
            disabled={!hasUnsavedChanges || isSaving}
            isLoading={isSaving}
            onClick={handleSave}
            className="text-xs"
          >
            Save Changes
          </Button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#27272A] pb-2 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab("description")}
          className={`px-3 py-1.5 rounded font-medium transition-all ${
            activeTab === "description"
              ? "bg-[#27272A] text-white border border-[#3F3F46] shadow-xs"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/40"
          }`}
        >
          Tab 1: Description &amp; Silhouette (WYSIWYG)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("fabric")}
          className={`px-3 py-1.5 rounded font-medium transition-all flex items-center gap-1.5 ${
            activeTab === "fabric"
              ? "bg-[#27272A] text-[#D8F452] border border-[#3F3F46] shadow-xs"
              : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/40"
          }`}
        >
          <span>Tab 2: Fabric Engineering &amp; Care</span>
          {isFabricDirty && (
            <span className="w-2 h-2 rounded-full bg-[#D8F452]" />
          )}
        </button>
      </div>

      {/* View 1: Main Description WYSIWYG Editor */}
      {activeTab === "description" && (
        <div>
          {isPreview ? (
            /* Preview Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-mono font-semibold text-[#A1A1AA] uppercase tracking-wider">
                  Storefront Customer View
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-[#71717A]">Theme:</span>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("dark")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      previewTheme === "dark"
                        ? "bg-[#27272A] text-white border border-[#3F3F46]"
                        : "text-[#71717A] hover:text-white"
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTheme("cream")}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      previewTheme === "cream"
                        ? "bg-[#F5F3ED] text-[#20241F] font-bold border border-[#E4E1D8]"
                        : "text-[#71717A] hover:text-white"
                    }`}
                  >
                    AFK Cream (#F5F3ED)
                  </button>
                </div>
              </div>

              <div
                className={`p-6 rounded-lg border transition-colors ${
                  previewTheme === "cream"
                    ? "bg-[#F5F3ED] text-[#20241F] border-[#E4E1D8]"
                    : "bg-[#121214] text-[#F4F4F5] border-[#27272A]"
                }`}
              >
                <div
                  className={`prose prose-sm max-w-none ${
                    previewTheme === "cream"
                      ? "text-[#20241F] [&_h1]:text-[#20241F] [&_h2]:text-[#20241F] [&_h3]:text-[#20241F] [&_strong]:text-[#20241F] [&_p]:text-[#20241F]/80 [&_li]:text-[#20241F]/85 [&_blockquote]:border-l-[#20241F] [&_blockquote]:bg-[#EBE8E0] [&_blockquote]:text-[#20241F]"
                      : "dark:prose-invert text-[#F4F4F5] [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-white [&_p]:text-[#E4E4E7] [&_blockquote]:border-l-[#D8F452] [&_blockquote]:bg-[#18181B] [&_blockquote]:text-[#A1A1AA]"
                  }`}
                  dangerouslySetInnerHTML={{
                    __html:
                      editor.getHTML() ||
                      "<p><em>No description provided yet.</em></p>",
                  }}
                />
              </div>
            </div>
          ) : (
            /* Dark Themed Tiptap Editor */
            <div className="rounded-lg border border-[#27272A] bg-[#121214] overflow-hidden focus-within:border-[#3F3F46] transition-colors">
              {/* Toolbar */}
              <div className="px-3 py-2 bg-[#18181B] border-b border-[#27272A] flex items-center gap-1 flex-wrap text-xs font-mono">
                {/* Headings */}
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  title="Heading 2 (Section Title)"
                  className={`px-2 py-1 rounded font-bold transition-colors ${
                    editor.isActive("heading", { level: 2 })
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 3 }).run()
                  }
                  title="Heading 3 (Sub-section / Spec Title)"
                  className={`px-2 py-1 rounded font-bold transition-colors ${
                    editor.isActive("heading", { level: 3 })
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  H3
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  title="Normal Paragraph"
                  className={`px-2 py-1 rounded transition-colors ${
                    editor.isActive("paragraph") &&
                    !editor.isActive("heading") &&
                    !editor.isActive("bulletList") &&
                    !editor.isActive("orderedList")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  ¶
                </button>

                <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                {/* Inline Formatting */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Bold (Ctrl+B)"
                  className={`px-2 py-1 rounded font-bold transition-colors ${
                    editor.isActive("bold")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Italic (Ctrl+I)"
                  className={`px-2 py-1 rounded italic transition-colors ${
                    editor.isActive("italic")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  title="Underline (Ctrl+U)"
                  className={`px-2 py-1 rounded underline transition-colors ${
                    editor.isActive("underline")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  U
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  title="Strikethrough"
                  className={`px-2 py-1 rounded line-through transition-colors ${
                    editor.isActive("strike")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  S
                </button>

                <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                {/* Lists and Quotes */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Bullet List"
                  className={`px-2 py-1 rounded transition-colors ${
                    editor.isActive("bulletList")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  • List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Numbered List"
                  className={`px-2 py-1 rounded transition-colors ${
                    editor.isActive("orderedList")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  1. List
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBlockquote().run()}
                  title="Blockquote"
                  className={`px-2 py-1 rounded transition-colors ${
                    editor.isActive("blockquote")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  &ldquo; Quote
                </button>
                <button
                  type="button"
                  onClick={setLink}
                  title="Hyperlink"
                  className={`px-2 py-1 rounded transition-colors ${
                    editor.isActive("link")
                      ? "bg-[#27272A] text-[#D8F452] border border-[#D8F452]/40 shadow-xs"
                      : "text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 border border-transparent"
                  }`}
                >
                  🔗 Link
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().setHorizontalRule().run()}
                  title="Divider Line"
                  className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 transition-colors border border-transparent"
                >
                  ― Divider
                </button>

                <span className="w-[1px] h-4 bg-[#27272A] mx-1" />

                {/* History */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  title="Undo (Ctrl+Z)"
                  className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 disabled:opacity-30 disabled:hover:bg-transparent border border-transparent transition-colors"
                >
                  ↶ Undo
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  title="Redo (Ctrl+Y)"
                  className="px-2 py-1 rounded text-[#A1A1AA] hover:text-white hover:bg-[#27272A]/50 disabled:opacity-30 disabled:hover:bg-transparent border border-transparent transition-colors"
                >
                  ↷ Redo
                </button>
              </div>

              {/* Content Input Area (Dark Mode) */}
              <div className="p-5 min-h-[220px] bg-[#0E0E10] focus-within:ring-1 focus-within:ring-[#D8F452]/50 transition-all">
                <EditorContent
                  editor={editor}
                  className="outline-none min-h-[180px] prose prose-sm dark:prose-invert max-w-none text-[#F4F4F5] [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[180px] [&_.ProseMirror_p]:text-[#E4E4E7] [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_h1]:text-white [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:border-b [&_.ProseMirror_h1]:border-[#27272A] [&_.ProseMirror_h1]:pb-1 [&_.ProseMirror_h2]:text-white [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-white [&_.ProseMirror_h3]:font-semibold [&_.ProseMirror_strong]:text-white [&_.ProseMirror_strong]:font-bold [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:text-[#E4E4E7] [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:text-[#E4E4E7] [&_.ProseMirror_li]:marker:text-[#D8F452] [&_.ProseMirror_blockquote]:border-l-2 [&_.ProseMirror_blockquote]:border-[#D8F452] [&_.ProseMirror_blockquote]:pl-3 [&_.ProseMirror_blockquote]:py-1 [&_.ProseMirror_blockquote]:bg-[#18181B] [&_.ProseMirror_blockquote]:text-[#A1A1AA] [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_code]:text-[#D8F452] [&_.ProseMirror_code]:bg-[#27272A] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:rounded [&_.ProseMirror_code]:font-mono [&_.ProseMirror_hr]:border-[#27272A] [&_.ProseMirror_a]:text-[#D8F452] [&_.ProseMirror_a]:underline"
                />
              </div>

              {/* Word Count & Status Strip */}
              <div className="px-4 py-2 bg-[#18181B] border-t border-[#27272A] flex items-center justify-between text-[11px] text-[#71717A] font-mono">
                <div className="flex items-center gap-3">
                  <span>{stats.words} words</span>
                  <span>•</span>
                  <span>{stats.characters} characters</span>
                </div>
                <div>
                  <span className="text-[#A1A1AA]">
                    {isEditorDirty ? "● Unsaved" : "✓ In Sync"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Fabric Engineering & Care Full Customization */}
      {activeTab === "fabric" && (
        <div className="space-y-5 bg-[#121214] p-5 rounded-lg border border-[#27272A]">
          {/* Section Heading */}
          <div className="flex items-center justify-between pb-3 border-b border-[#27272A]">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-heading">
                Storefront Accordion Tab Customizer
              </h3>
              <p className="text-xs text-[#A1A1AA] mt-0.5">
                Customize the tab title, material composition card, manufacturing provenance, and maintenance guidelines shown on the product page.
              </p>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#27272A] text-[#D8F452] border border-[#3F3F46]">
              Storefront PDP Tab #2
            </span>
          </div>

          {/* Form Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tab Title */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-[#E4E4E7] flex items-center gap-1.5">
                <span>Tab Title (Accordion Header)</span>
                <span className="text-[#D8F452] text-[10px] uppercase font-mono">(Fully Customizable)</span>
              </Label>
              <Input
                value={fabricTabTitle}
                onChange={(e) => setFabricTabTitle(e.target.value)}
                placeholder="Fabric Engineering & Care"
                className="bg-[#18181B] border-[#27272A] text-white focus:border-[#D8F452]"
              />
              <p className="text-[11px] text-[#71717A]">
                The header label displayed in the accordion (e.g. <em>Fabric Engineering &amp; Care</em>, <em>Materials &amp; Craftsmanship</em>, <em>Fabric &amp; Care Guide</em>).
              </p>
            </div>

            {/* Material Composition */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#E4E4E7]">
                Material Composition
              </Label>
              <Input
                value={fabricMaterial}
                onChange={(e) => setFabricMaterial(e.target.value)}
                placeholder="240 GSM Combed Compact Cotton"
                className="bg-[#18181B] border-[#27272A] text-white focus:border-[#D8F452]"
              />
              <p className="text-[11px] text-[#71717A]">
                Yarn density, fabric weight, and knit construction.
              </p>
            </div>

            {/* Manufacturing Origin */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-[#E4E4E7]">
                Manufacturing Origin
              </Label>
              <Input
                value={fabricOrigin}
                onChange={(e) => setFabricOrigin(e.target.value)}
                placeholder="Dhaka, Bangladesh"
                className="bg-[#18181B] border-[#27272A] text-white focus:border-[#D8F452]"
              />
              <p className="text-[11px] text-[#71717A]">
                Garment provenance and craftsmanship location.
              </p>
            </div>

            {/* Care Protocol */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold text-[#E4E4E7] flex items-center justify-between">
                <span>Garment Maintenance Protocol / Care Guide</span>
                <span className="text-[11px] text-[#71717A] font-normal">
                  Format lines as <code className="text-[#D8F452]">Action: Detail</code>
                </span>
              </Label>
              <Textarea
                value={fabricCare}
                onChange={(e) => setFabricCare(e.target.value)}
                rows={4}
                placeholder="Wash: Machine wash cold (30°C) inside-out with like dark colors.&#10;Dry: Line dry in shade; do not tumble dry to preserve fabric density.&#10;Iron: Low-to-medium heat on reverse; avoid direct heat on silicone or prints."
                className="bg-[#18181B] border-[#27272A] text-white font-mono text-xs focus:border-[#D8F452] leading-relaxed"
              />
              <p className="text-[11px] text-[#71717A]">
                Each line automatically renders a luxury circular bullet with bold tag prefixes on the storefront.
              </p>
            </div>

            {/* Custom Rich HTML Override */}
            <div className="space-y-1.5 md:col-span-2 pt-2 border-t border-[#27272A]">
              <Label className="text-xs font-semibold text-[#E4E4E7] flex items-center gap-1.5">
                <span>Custom Rich Content / HTML Override</span>
                <span className="text-[11px] text-[#71717A] font-normal">(Optional Freeform Mode)</span>
              </Label>
              <Textarea
                value={fabricCustomContent}
                onChange={(e) => setFabricCustomContent(e.target.value)}
                rows={3}
                placeholder="Leave blank to use the structured cards above, or enter custom HTML / Markdown to override entire tab content."
                className="bg-[#18181B] border-[#27272A] text-white font-mono text-xs focus:border-[#D8F452]"
              />
              <p className="text-[11px] text-[#71717A]">
                If filled, this custom content completely replaces the default cards on the storefront.
              </p>
            </div>
          </div>

          {/* Live Storefront Preview */}
          <div className="pt-4 border-t border-[#27272A] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-[#A1A1AA] uppercase tracking-wider">
                Storefront Accordion Preview
              </span>
              <Badge color="green">Live Preview</Badge>
            </div>

            <div className="p-4 rounded-md bg-[#F5F3ED] text-[#20241F] border border-[#E4E1D8]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#20241F]/10">
                <span className="text-xs font-heading font-bold uppercase tracking-wider text-[#20241F]">
                  {fabricTabTitle || "Fabric Engineering & Care"}
                </span>
                <span className="text-[10px] text-[#20241F]/60 font-mono">▲ Open</span>
              </div>

              {fabricCustomContent ? (
                <div
                  className="text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: fabricCustomContent }}
                />
              ) : (
                <div className="space-y-3 text-xs leading-relaxed">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="p-2.5 rounded bg-white border border-[#E4E1D8] flex flex-col gap-0.5">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#20241F]/60">
                        Material Composition
                      </span>
                      <span className="text-xs font-semibold text-[#20241F]">
                        {fabricMaterial || "240 GSM Combed Compact Cotton"}
                      </span>
                    </div>
                    <div className="p-2.5 rounded bg-white border border-[#E4E1D8] flex flex-col gap-0.5">
                      <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#20241F]/60">
                        Manufacturing Origin
                      </span>
                      <span className="text-xs font-semibold text-[#20241F]">
                        {fabricOrigin || "Dhaka, Bangladesh"}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded bg-white border border-[#E4E1D8] space-y-2">
                    <span className="text-[10px] font-heading font-bold uppercase tracking-wider text-[#20241F]/60 block">
                      Garment Maintenance Protocol
                    </span>
                    <ul className="space-y-1.5 pl-0 list-none text-xs text-[#20241F]/85">
                      {fabricCare
                        .split(/\r?\n/)
                        .filter((l) => l.trim())
                        .map((line, idx) => {
                          const colonIdx = line.indexOf(":")
                          const hasLabel = colonIdx > 0 && colonIdx < 25
                          return (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#20241F] mt-1.5 shrink-0" />
                              {hasLabel ? (
                                <span>
                                  <strong>{line.slice(0, colonIdx).trim()}:</strong>{" "}
                                  {line.slice(colonIdx + 1).trim()}
                                </span>
                              ) : (
                                <span>{line}</span>
                              )}
                            </li>
                          )
                        })}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductRichDescriptionWidget

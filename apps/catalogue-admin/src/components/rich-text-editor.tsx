"use client"

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { clsx } from "clsx"
import type { ReactNode } from "react"

/**
 * Formatted text editor for product descriptions and content pages. Stores
 * HTML. Headings are h2 and h3 only because the product name or page title
 * is already the page's h1. The site sanitizes the
 * HTML again at build time.
 */
export function RichTextEditor({
  value,
  onChange,
  label = "Product description",
}: {
  value: string
  onChange: (html: string) => void
  /** Accessible name of the editing area. */
  label?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        code: false,
        codeBlock: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: "https" },
      }),
    ],
    content: value,
    // Next.js renders this on the server first; let the editor mount on the client.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-[200px] px-4 py-3 focus:outline-none",
        "aria-label": label,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  })

  return (
    <div className="overflow-hidden rounded-base border border-brand-border bg-white focus-within:border-brand-graphite">
      {editor ? <Toolbar editor={editor} /> : <div className="h-11 border-b border-brand-border bg-brand-bone" />}
      <EditorContent editor={editor} />
    </div>
  )
}

function Toolbar({ editor }: { editor: Editor }) {
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      paragraph: e.isActive("paragraph"),
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      underline: e.isActive("underline"),
      strike: e.isActive("strike"),
      quote: e.isActive("blockquote"),
      bullets: e.isActive("bulletList"),
      numbers: e.isActive("orderedList"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  })

  const chain = () => editor.chain().focus()

  const editLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined
    const url = window.prompt("Link address (leave empty to remove the link)", previous ?? "https://")
    if (url === null) return
    if (!url.trim() || url.trim() === "https://") {
      chain().extendMarkRange("link").unsetLink().run()
      return
    }
    chain().extendMarkRange("link").setLink({ href: url.trim() }).run()
  }

  return (
    <div role="toolbar" aria-label="Text formatting" className="flex flex-wrap items-center gap-0.5 border-b border-brand-border bg-brand-bone px-2 py-1.5">
      <Tool
        label="Normal text"
        active={state.paragraph && !state.quote && !state.bullets && !state.numbers}
        onClick={() => chain().setParagraph().run()}
      >
        Text
      </Tool>
      <Tool label="Heading" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()}>
        H2
      </Tool>
      <Tool label="Subheading" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()}>
        H3
      </Tool>
      <Divider />
      <Tool label="Bold" active={state.bold} onClick={() => chain().toggleBold().run()}>
        <span className="font-black">B</span>
      </Tool>
      <Tool label="Italic" active={state.italic} onClick={() => chain().toggleItalic().run()}>
        <span className="font-serif italic">I</span>
      </Tool>
      <Tool label="Underline" active={state.underline} onClick={() => chain().toggleUnderline().run()}>
        <span className="underline">U</span>
      </Tool>
      <Tool label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()}>
        <span className="line-through">S</span>
      </Tool>
      <Divider />
      <Tool label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()}>
        Quote
      </Tool>
      <Tool label="Bulleted list" active={state.bullets} onClick={() => chain().toggleBulletList().run()}>
        • List
      </Tool>
      <Tool label="Numbered list" active={state.numbers} onClick={() => chain().toggleOrderedList().run()}>
        1. List
      </Tool>
      <Tool label="Link" active={state.link} onClick={editLink}>
        Link
      </Tool>
      <Tool label="Divider line" onClick={() => chain().setHorizontalRule().run()}>
        Line
      </Tool>
      <Divider />
      <Tool label="Undo" disabled={!state.canUndo} onClick={() => chain().undo().run()}>
        Undo
      </Tool>
      <Tool label="Redo" disabled={!state.canRedo} onClick={() => chain().redo().run()}>
        Redo
      </Tool>
    </div>
  )
}

function Tool({ label, active, disabled, onClick, children }: { label: string; active?: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the text selection while clicking a toolbar button.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={clsx(
        "h-8 min-w-8 rounded-soft px-2 text-xs font-semibold transition-colors disabled:opacity-30",
        active ? "bg-brand-graphite text-brand-bone" : "text-brand-graphite hover:bg-brand-stone"
      )}
    >
      {children}
    </button>
  )
}

function Divider() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-brand-border" />
}

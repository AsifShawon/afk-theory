import sanitizeHtml from "sanitize-html"

/**
 * Product descriptions are written in the admin's editor and stored as HTML.
 * Only these tags survive, so pasted content cannot inject scripts, styles or
 * layout. The product name is the page's only <h1>, so headings start at h2.
 */
const ALLOWED_TAGS = ["p", "br", "h2", "h3", "strong", "em", "s", "u", "blockquote", "ul", "ol", "li", "a", "hr"]

const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: { a: ["href", "target", "rel"] },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // An h1 pasted from elsewhere becomes an h2; h4-h6 become h3.
  transformTags: {
    h1: "h2",
    h4: "h3",
    h5: "h3",
    h6: "h3",
    b: "strong",
    i: "em",
    a: (tagName, attribs) => {
      const external = /^https?:/i.test(attribs.href ?? "")
      return {
        tagName,
        attribs: external ? { ...attribs, target: "_blank", rel: "noopener noreferrer" } : attribs,
      }
    },
  },
  exclusiveFilter: (frame) => frame.tag === "p" && !frame.text.trim() && !frame.mediaChildren.length,
}

/** True for editor output. Plain text such as "size < 40" or "<3" stays text. */
const looksLikeHtml = (value: string) => /<\/?(p|h[1-6]|strong|em|b|i|u|s|ul|ol|li|blockquote|br|hr|a|div|span)\b[^<>]*>/i.test(value)

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

/** Turns a stored description (HTML, or older plain text) into safe HTML. */
export function descriptionToHtml(value: string): string {
  const input = (value ?? "").trim()
  if (!input) return ""
  if (looksLikeHtml(input)) {
    return sanitizeHtml(input, OPTIONS).trim()
  }
  // Plain text: blank lines split paragraphs, single newlines become <br>.
  return input
    .split(/\n\s*\n/)
    .map((block) => `<p>${escapeHtml(block.trim()).replace(/\n/g, "<br>")}</p>`)
    .join("")
}

/** Plain text of a description, collapsed to one line, for meta tags. */
export function descriptionToText(value: string): string {
  const html = descriptionToHtml(value)
  return sanitizeHtml(html.replace(/<\/(p|h2|h3|li|blockquote)>|<br\s*\/?>/gi, " "), { allowedTags: [], allowedAttributes: {} })
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Shortens text at a word boundary for meta descriptions. */
export function truncateText(value: string, max: number): string {
  if (value.length <= max) return value
  const cut = value.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(" ")
  return `${(lastSpace > max * 0.5 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:-]+$/, "")}…`
}

/** Recommended lengths shown in the admin. Search engines cut longer text. */
export const SEO_LIMITS = { title: 60, description: 160 } as const

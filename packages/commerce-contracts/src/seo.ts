export const SEO_BRAND_NAME = "AFK THEORY"

/** Search results cut titles off at roughly this many characters. */
export const SEO_TITLE_MAX_LENGTH = 60

/** Search results cut descriptions off at roughly this many characters. */
export const SEO_DESCRIPTION_MAX_LENGTH = 160

/**
 * Removes a trailing brand suffix such as " | AFK THEORY" or " - AFK THEORY",
 * so the brand is added exactly once by the site-wide title template.
 */
export function stripBrandSuffix(title: string, brand: string = SEO_BRAND_NAME): string {
  const escaped = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  return title.replace(new RegExp(`\\s*[|\\-–—]\\s*${escaped}\\s*$`, "i"), "").trim()
}

export interface PageTitle {
  /**
   * Value for the page's `<title>`. A plain string gets the site-wide template
   * ("%s | AFK THEORY") applied; `{ absolute }` is used as written.
   */
  metaTitle: string | { absolute: string }
  /** Title for social cards (Open Graph, Twitter), which do not use the template. */
  socialTitle: string
}

/**
 * Builds a page title with the brand shown exactly once.
 * Titles that already lead with or contain the brand (the home page) are used as written.
 */
export function buildPageTitle(title: string, brand: string = SEO_BRAND_NAME): PageTitle {
  const bare = stripBrandSuffix(title, brand)

  if (bare.toLowerCase().includes(brand.toLowerCase())) {
    return { metaTitle: { absolute: bare }, socialTitle: bare }
  }

  return { metaTitle: bare, socialTitle: `${bare} | ${brand}` }
}

/**
 * Plain text from a string that may contain HTML or line breaks.
 */
export function cleanText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Meta description that fits a search result snippet: HTML and line breaks
 * removed, and shortened at a word boundary with an ellipsis when too long.
 */
export function truncateMetaDescription(
  text: string | null | undefined,
  maxLength: number = SEO_DESCRIPTION_MAX_LENGTH
): string {
  const clean = cleanText(text)
  if (clean.length <= maxLength) return clean

  const budget = maxLength - 1
  const slice = clean.slice(0, budget)
  const lastSpace = slice.lastIndexOf(" ")
  // Cut at a word boundary, unless that would throw away most of the text.
  const cut = lastSpace >= budget * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.replace(/[\s,.;:!\-–—]+$/, "")}…`
}

/**
 * SEO text a store owner entered on a product (metadata.seo_title and
 * metadata.seo_description in the admin). Blank values count as not set.
 */
export function getSeoOverrides(
  metadata: Record<string, unknown> | null | undefined
): { title?: string; description?: string } {
  const read = (key: string): string | undefined => {
    const value = metadata?.[key]
    if (typeof value !== "string") return undefined
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : undefined
  }

  return { title: read("seo_title"), description: read("seo_description") }
}

/**
 * Descriptive image alt text for accessibility and image search, for example
 * "Drop Shoulder Tee in Black, view 2". `position` is the zero-based index of
 * the image within its set.
 */
export function buildImageAlt({
  productTitle,
  color,
  position = 0,
}: {
  productTitle: string
  color?: string
  position?: number
}): string {
  const base = color ? `${productTitle} in ${color}` : productTitle
  return position > 0 ? `${base}, view ${position + 1}` : base
}

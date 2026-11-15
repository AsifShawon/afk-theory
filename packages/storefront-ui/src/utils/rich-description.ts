/**
 * Sanitizes and normalizes HTML for safe storefront injection.
 * Strips script tags, style tags, iframes, and dangerous event handlers.
 * Remaps h1 tags to h2 to preserve document SEO heading hierarchy.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return ""

  let clean = rawHtml
    // Strip scripts and handlers
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, "")
    .replace(/javascript:/gi, "")

  // Remap H1 to H2 so the page H1 remains unique to product title
  clean = clean.replace(/<h1(\s|>)/gi, "<h2$1").replace(/<\/h1>/gi, "</h2>")

  return clean
}

/**
 * Elevates product HTML into premium luxury streetwear commerce presentation.
 * Transforms flat paragraphs (e.g. "Key Features", feature lists, Fit Recommendations)
 * into rich structured headings, styled bullet lists, specification strips, and callouts.
 */
export function enhanceRichHtml(rawHtml: string): string {
  if (!rawHtml) return ""

  let html = rawHtml

  // 1. Elevate "Key Features" / "Features" paragraph or heading
  html = html.replace(
    /<p>(?:<strong>)?\s*(Key Features|Features|Highlights|Garment Architecture|Product Details):?\s*(?:<\/strong>)?<\/p>/gi,
    '<h3 class="spec-heading">// KEY SPECIFICATIONS &amp; ARCHITECTURE</h3>'
  )

  // 2. If flat paragraphs follow the spec heading, group them into a styled <ul> list
  const headingMarker = '<h3 class="spec-heading">// KEY SPECIFICATIONS &amp; ARCHITECTURE</h3>'
  if (html.includes(headingMarker)) {
    const parts = html.split(headingMarker)
    const afterHeading = parts[1]

    const pRegex = /<p>(.*?)<\/p>/gi
    let match: RegExpExecArray | null
    const featureItems: string[] = []
    let restIndex = 0

    while ((match = pRegex.exec(afterHeading)) !== null) {
      const text = match[1].trim()
      if (
        text.startsWith("Style:") ||
        text.startsWith("Fit Recommendation:") ||
        text.startsWith("<h") ||
        text.startsWith("<strong>Style") ||
        text.startsWith("<strong>Fit") ||
        text.startsWith("<div")
      ) {
        break
      }
      featureItems.push(text)
      restIndex = pRegex.lastIndex
    }

    if (featureItems.length > 0) {
      const listHtml = `<ul class="streetwear-features my-3 space-y-2">\n${featureItems
        .map((item) => `  <li class="feature-item">${item}</li>`)
        .join("\n")}\n</ul>`

      const remaining = afterHeading.slice(restIndex)
      html = parts[0] + headingMarker + "\n" + listHtml + "\n" + remaining
    }
  }

  // 3. Elevate "Fit Recommendation: ..." into a premium fit guidance card
  html = html.replace(
    /<p>(?:<strong>)?Fit Recommendation:?(?:<\/strong>)?\s*(.*?)<\/p>/gi,
    '<div class="fit-card"><strong class="fit-card-title">FIT GUIDANCE</strong><p class="fit-card-body">$1</p></div>'
  )

  // 4. Elevate "Style: ..." into a structured spec strip
  html = html.replace(
    /<p>(?:<strong>)?Style:?(?:<\/strong>)?\s*(.*?)<\/p>/gi,
    '<div class="spec-strip"><span class="spec-strip-label">STYLE PROFILE</span><span class="spec-strip-val">$1</span></div>'
  )

  // 5. Elevate subtitle taglines
  html = html.replace(
    /<p><em>(Made for comfort\..*?)<\/em><\/p>/gi,
    '<p class="editorial-tagline"><em>$1</em></p>'
  )

  return html
}

/**
 * Deterministically parses Markdown-like syntax into structured HTML.
 * Handles bold headings, bullet lists, numbered lists, and paragraphs.
 */
export function formatLegacyMarkdown(raw: string): string {
  if (!raw || !raw.trim()) return ""

  const lines = raw.split(/\r?\n/)
  const htmlParts: string[] = []
  let inList = false
  let listType: "ul" | "ol" = "ul"
  let inFeatureList = false

  const closeList = () => {
    if (inList) {
      htmlParts.push(`</${listType}>`)
      inList = false
    }
    if (inFeatureList) {
      htmlParts.push("</ul>")
      inFeatureList = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    if (!line) {
      closeList()
      continue
    }

    // Key Features Section Header
    if (
      line.toLowerCase() === "key features" ||
      line.toLowerCase() === "features" ||
      line.toLowerCase() === "key features:" ||
      line.toLowerCase() === "**key features**"
    ) {
      closeList()
      htmlParts.push('<h3 class="spec-heading">// KEY SPECIFICATIONS &amp; ARCHITECTURE</h3>')
      htmlParts.push('<ul class="streetwear-features my-3 space-y-2">')
      inFeatureList = true
      continue
    }

    // Style specification line
    if (line.toLowerCase().startsWith("style:")) {
      closeList()
      const val = line.replace(/^style:\s*/i, "").trim()
      htmlParts.push(
        `<div class="spec-strip"><span class="spec-strip-label">STYLE PROFILE</span><span class="spec-strip-val">${inlineFormat(val)}</span></div>`
      )
      continue
    }

    // Fit Recommendation line
    if (line.toLowerCase().startsWith("fit recommendation:")) {
      closeList()
      const val = line.replace(/^fit recommendation:\s*/i, "").trim()
      htmlParts.push(
        `<div class="fit-card"><strong class="fit-card-title">FIT GUIDANCE</strong><p class="fit-card-body">${inlineFormat(val)}</p></div>`
      )
      continue
    }

    // If currently inside a feature list block
    if (inFeatureList) {
      if (
        line.startsWith("#") ||
        line.startsWith("**") ||
        line.toLowerCase().startsWith("style:") ||
        line.toLowerCase().startsWith("fit")
      ) {
        closeList()
      } else {
        const itemContent = line.replace(/^[-*]\s*/, "").trim()
        htmlParts.push(`<li class="feature-item">${inlineFormat(itemContent)}</li>`)
        continue
      }
    }

    // Bullet list item
    if (line.startsWith("- ") || line.startsWith("* ")) {
      if (!inList || listType !== "ul") {
        closeList()
        htmlParts.push('<ul class="streetwear-features list-disc pl-5 space-y-1.5 my-3 marker:text-brand-primary">')
        inList = true
        listType = "ul"
      }
      const itemContent = line.slice(2).trim()
      const formatted = inlineFormat(itemContent)
      htmlParts.push(`<li class="leading-relaxed text-sm text-[#20241F]/85">${formatted}</li>`)
      continue
    }

    // Numbered list item
    const numMatch = line.match(/^\d+\.\s+(.*)/)
    if (numMatch) {
      if (!inList || listType !== "ol") {
        closeList()
        htmlParts.push('<ol class="list-decimal pl-5 space-y-1.5 my-3 marker:text-brand-primary">')
        inList = true
        listType = "ol"
      }
      const formatted = inlineFormat(numMatch[1].trim())
      htmlParts.push(`<li class="leading-relaxed text-sm text-[#20241F]/85">${formatted}</li>`)
      continue
    }

    // If it was in a list, close it now
    closeList()

    // Standalone bold heading: **Heading Title**
    if (line.startsWith("**") && line.endsWith("**") && line.length > 4 && !line.slice(2, -2).includes("**")) {
      const headingText = line.slice(2, -2).trim()
      htmlParts.push(`<h3 class="font-heading font-bold text-base text-[#20241F] mt-4 mb-2 tracking-tight">${headingText}</h3>`)
      continue
    }

    // Standard markdown headings: ## or ###
    if (line.startsWith("### ")) {
      htmlParts.push(`<h4 class="font-heading font-bold text-sm text-[#20241F] mt-3 mb-1.5">${inlineFormat(line.slice(4))}</h4>`)
      continue
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      htmlParts.push(`<h3 class="font-heading font-bold text-base text-[#20241F] mt-4 mb-2 tracking-tight">${inlineFormat(line.replace(/^#+\s*/, ""))}</h3>`)
      continue
    }

    // Regular paragraph
    htmlParts.push(`<p class="text-sm leading-relaxed text-[#20241F]/85 mb-3">${inlineFormat(line)}</p>`)
  }

  closeList()
  return htmlParts.join("\n")
}

/**
 * Parses inline formatting: **bold**, *italic*, [link](url)
 */
export function inlineFormat(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-[#20241F]">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-brand-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">$1</a>')
}

/**
 * Standard AFK THEORY Drop Shoulder Streetwear Template.
 */
export const STANDARD_STREETWEAR_TEMPLATE = `<h2>AFK THEORY Essential Oversized Drop Shoulder T-Shirt</h2>
<p>Engineered for contemporary streetwear rotation. Combines a calibrated boxy circumference with dropped shoulder seams and dense pre-shrunk cotton.</p>

<h3>FABRIC ARCHITECTURE</h3>
<ul>
  <li><strong>240–260 GSM Heavyweight Cotton:</strong> Dense, breathable compact knit engineered for tropical and subtropical humidity.</li>
  <li><strong>100% Combed Cotton:</strong> Pre-shrunk to retain boxy silhouette and dimensional stability after washing.</li>
  <li><strong>Reinforced Ribbed Collar:</strong> Double-needle bound 1.25" crew neckline preventing collar sagging.</li>
</ul>

<h3>SILHOUETTE &amp; CUT</h3>
<ul>
  <li>Calibrated dropped shoulder angle for natural drape without armpit bunching.</li>
  <li>Wide chest circumference providing relaxed boxy drape.</li>
  <li>Clean twin-needle stitched hems.</li>
</ul>

<h3>GARMENT CARE</h3>
<ul>
  <li>Machine wash cold inside-out with like colors.</li>
  <li>Do not tumble dry; line dry in shade to maintain fabric density.</li>
  <li>Warm iron inside-out; do not iron directly over graphics or labels.</li>
</ul>`

/**
 * Sanitizes rich description HTML.
 */
export function sanitizeRichDescription(rawHtml: string): string {
  if (!rawHtml) return ""

  return rawHtml
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/\son\w+\s*=\s*["'][^"']*["']/gi, "")
    .replace(/\son\w+\s*=\s*[^"'\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim()
}

/**
 * Converts legacy Markdown or plain text into structured HTML.
 */
export function markdownToHtml(raw: string): string {
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

    if (line.startsWith("**") && line.endsWith("**") && line.length > 4 && !line.slice(2, -2).includes("**")) {
      const headingText = line.slice(2, -2).trim()
      htmlParts.push(`<h2>${headingText}</h2>`)
      continue
    }

    if (line.startsWith("### ")) {
      htmlParts.push(`<h3>${inlineFormat(line.slice(4))}</h3>`)
      continue
    }
    if (line.startsWith("## ") || line.startsWith("# ")) {
      htmlParts.push(`<h2>${inlineFormat(line.replace(/^#+\s*/, ""))}</h2>`)
      continue
    }

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

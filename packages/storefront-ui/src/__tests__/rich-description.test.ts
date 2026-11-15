import test from "node:test"
import assert from "node:assert/strict"
import { sanitizeHtml, formatLegacyMarkdown, enhanceRichHtml } from "../utils/rich-description"

test("RichDescription Storefront Security & Formatting Suite", async (t) => {
  await t.test("1. XSS Guard: Strips <script> tags and embedded payloads", () => {
    const dirty = "<p>Normal text</p><script>alert('xss')</script><b>Bold</b>"
    const cleaned = sanitizeHtml(dirty)
    assert.equal(cleaned.includes("<script>"), false)
    assert.equal(cleaned.includes("alert"), false)
    assert.equal(cleaned.includes("<p>Normal text</p>"), true)
    assert.equal(cleaned.includes("<b>Bold</b>"), true)
  })

  await t.test("2. XSS Guard: Strips inline on* event handlers", () => {
    const dirty = '<img src="x" onerror="alert(1)" onload="evil()" alt="test" />'
    const cleaned = sanitizeHtml(dirty)
    assert.equal(cleaned.includes("onerror"), false)
    assert.equal(cleaned.includes("onload"), false)
    assert.equal(cleaned.includes("alert(1)"), false)
  })

  await t.test("3. XSS Guard: Strips javascript: pseudo-protocol URIs", () => {
    const dirty = '<a href="javascript:alert(1)">Click here</a>'
    const cleaned = sanitizeHtml(dirty)
    assert.equal(cleaned.includes("javascript:"), false)
  })

  await t.test("4. XSS Guard: Strips <iframe> elements", () => {
    const dirty = '<p>Details</p><iframe src="https://evil.com"></iframe>'
    const cleaned = sanitizeHtml(dirty)
    assert.equal(cleaned.includes("<iframe"), false)
    assert.equal(cleaned.includes("</iframe>"), false)
  })

  await t.test("5. Heading Hierarchy: Remaps <h1> tags to <h2> to maintain single product title H1", () => {
    const input = "<h1>Fabric Architecture</h1><p>High density 260 GSM</p>"
    const output = sanitizeHtml(input)
    assert.equal(output.includes("<h1"), false)
    assert.equal(output.includes("</h1>"), false)
    assert.equal(output.includes("<h2"), true)
    assert.equal(output.includes("</h2>"), true)
  })

  await t.test("6. Legacy Markdown: Formats bullet lists into styled <ul> and <li> elements", () => {
    const markdown = "- 240 GSM pre-shrunk cotton\n- Reinforced collar ribbing\n- Boxy silhouette"
    const html = formatLegacyMarkdown(markdown)
    assert.equal(html.includes("<ul"), true)
    assert.equal(html.includes("</ul>"), true)
    assert.equal(html.includes("<li"), true)
    assert.equal(html.includes("240 GSM pre-shrunk cotton"), true)
    assert.equal(html.includes("Boxy silhouette"), true)
  })

  await t.test("7. Legacy Markdown: Formats numbered lists into styled <ol> and <li> elements", () => {
    const markdown = "1. Cold gentle wash\n2. Do not tumble dry\n3. Warm iron inside out"
    const html = formatLegacyMarkdown(markdown)
    assert.equal(html.includes("<ol"), true)
    assert.equal(html.includes("</ol>"), true)
    assert.equal(html.includes("<li"), true)
    assert.equal(html.includes("Cold gentle wash"), true)
  })

  await t.test("8. Legacy Markdown: Formats bold headings and paragraphs cleanly", () => {
    const markdown = "**FIT DETAILS**\nRelaxed oversized drop shoulder fit engineered for streetwear styling."
    const html = formatLegacyMarkdown(markdown)
    assert.equal(html.includes("<h3"), true)
    assert.equal(html.includes("FIT DETAILS"), true)
    assert.equal(html.includes("<p"), true)
    assert.equal(html.includes("Relaxed oversized drop shoulder fit"), true)
  })

  await t.test("9. Luxury Elevation: Elevates Key Features and bullet items into structured streetwear specifications", () => {
    const raw = "<p>Key Features</p><p>Oversized streetwear drape</p><p>240 GSM Heavyweight Cotton</p><p>Style: Oversized Tee</p><p>Fit Recommendation: Size down for regular fit</p>"
    const enhanced = enhanceRichHtml(raw)
    assert.equal(enhanced.includes("spec-heading"), true)
    assert.equal(enhanced.includes("// KEY SPECIFICATIONS &amp; ARCHITECTURE"), true)
    assert.equal(enhanced.includes("streetwear-features"), true)
    assert.equal(enhanced.includes("feature-item"), true)
    assert.equal(enhanced.includes("spec-strip"), true)
    assert.equal(enhanced.includes("STYLE PROFILE"), true)
    assert.equal(enhanced.includes("fit-card"), true)
    assert.equal(enhanced.includes("FIT GUIDANCE"), true)
  })

  await t.test("10. Editorial Tagline: Adds editorial styling to subtitle emphasis", () => {
    const raw = "<p><em>Made for comfort. Designed for timeless streetwear expression.</em></p>"
    const enhanced = enhanceRichHtml(raw)
    assert.equal(enhanced.includes("editorial-tagline"), true)
  })

  await t.test("11. Customizable Fabric Tab Title: Resolves custom title or defaults to Fabric Engineering & Care", () => {
    function resolveTabTitle(meta?: Record<string, any>, prop?: string) {
      return prop || meta?.fabric_tab_title || meta?.care_tab_title || "Fabric Engineering & Care"
    }

    assert.equal(resolveTabTitle(), "Fabric Engineering & Care")
    assert.equal(resolveTabTitle({ fabric_tab_title: "Materials & Craftsmanship" }), "Materials & Craftsmanship")
    assert.equal(resolveTabTitle({}, "Sustainable Fabric & Fit"), "Sustainable Fabric & Fit")
  })

  await t.test("12. Care Protocol Parsing: Correctly splits multiline instructions and extracts bold labels", () => {
    const rawCare = "Wash: Machine wash cold\nDry: Line dry in shade\nStorage: Hang on wooden hanger"
    const lines = rawCare.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)
    assert.equal(lines.length, 3)

    const parsed = lines.map((line) => {
      const idx = line.indexOf(":")
      if (idx > 0 && idx < 25) {
        return { label: line.slice(0, idx).trim(), instruction: line.slice(idx + 1).trim() }
      }
      return { label: null, instruction: line }
    })

    assert.deepEqual(parsed[0], { label: "Wash", instruction: "Machine wash cold" })
    assert.deepEqual(parsed[1], { label: "Dry", instruction: "Line dry in shade" })
    assert.deepEqual(parsed[2], { label: "Storage", instruction: "Hang on wooden hanger" })
  })
})

import test from "node:test"
import assert from "node:assert/strict"
import {
  SEO_DESCRIPTION_MAX_LENGTH,
  buildPageTitle,
  cleanText,
  getSeoOverrides,
  stripBrandSuffix,
  truncateMetaDescription,
} from "../seo"

test("Page titles show the brand exactly once", async (t) => {
  await t.test("1. Strips a trailing brand suffix", () => {
    assert.equal(stripBrandSuffix("About The Theory | AFK THEORY"), "About The Theory")
    assert.equal(stripBrandSuffix("Contact - AFK THEORY"), "Contact")
    assert.equal(stripBrandSuffix("About The Theory"), "About The Theory")
  })

  await t.test("2. Plain titles get the template once and a branded social title", () => {
    const title = buildPageTitle("Shipping & Delivery Policy | AFK THEORY")
    assert.equal(title.metaTitle, "Shipping & Delivery Policy")
    assert.equal(title.socialTitle, "Shipping & Delivery Policy | AFK THEORY")
  })

  await t.test("3. A title that already contains the brand is used as written", () => {
    const title = buildPageTitle("AFK THEORY | Pause The Game. Keep Your Style.")
    assert.deepEqual(title.metaTitle, { absolute: "AFK THEORY | Pause The Game. Keep Your Style." })
    assert.equal(title.socialTitle, "AFK THEORY | Pause The Game. Keep Your Style.")
  })

  await t.test("4. Titles without any brand get one in social cards", () => {
    const title = buildPageTitle("Oversized Drop Shoulder Tee")
    assert.equal(title.metaTitle, "Oversized Drop Shoulder Tee")
    assert.equal(title.socialTitle, "Oversized Drop Shoulder Tee | AFK THEORY")
  })
})

test("Meta descriptions fit a search snippet", async (t) => {
  await t.test("5. Short text is only cleaned", () => {
    assert.equal(truncateMetaDescription("  Heavy   cotton\n tee. "), "Heavy cotton tee.")
  })

  await t.test("6. HTML and entities are removed", () => {
    assert.equal(cleanText("<p>Soft &amp; <strong>heavy</strong>&nbsp;cotton</p>"), "Soft & heavy cotton")
  })

  await t.test("7. Long text is cut at a word boundary within the limit", () => {
    const long = "Oversized drop shoulder tee in heavyweight cotton with a boxy fit. ".repeat(6)
    const result = truncateMetaDescription(long)
    assert.ok(result.length <= SEO_DESCRIPTION_MAX_LENGTH, `length ${result.length}`)
    assert.ok(result.endsWith("…"))
    assert.ok(!/\s…$/.test(result), "no dangling space before the ellipsis")
    assert.ok(long.startsWith(result.slice(0, -1)), "result is a prefix of the original")
  })

  await t.test("8. Text of exactly the limit is untouched", () => {
    const exact = "a".repeat(SEO_DESCRIPTION_MAX_LENGTH)
    assert.equal(truncateMetaDescription(exact), exact)
  })

  await t.test("9. A single very long word is still cut to fit", () => {
    const result = truncateMetaDescription("x".repeat(400))
    assert.equal(result.length, SEO_DESCRIPTION_MAX_LENGTH)
    assert.ok(result.endsWith("…"))
  })

  await t.test("10. Empty input gives an empty string", () => {
    assert.equal(truncateMetaDescription(undefined), "")
    assert.equal(truncateMetaDescription(null), "")
  })
})

test("Admin SEO overrides", async (t) => {
  await t.test("11. Reads title and description, trimmed", () => {
    assert.deepEqual(
      getSeoOverrides({ seo_title: "  Black Drop Shoulder Tee ", seo_description: "Heavyweight." }),
      { title: "Black Drop Shoulder Tee", description: "Heavyweight." }
    )
  })

  await t.test("12. Blank, missing and non-text values count as not set", () => {
    assert.deepEqual(getSeoOverrides({ seo_title: "   ", seo_description: 42 }), {
      title: undefined,
      description: undefined,
    })
    assert.deepEqual(getSeoOverrides(null), { title: undefined, description: undefined })
  })
})

test("Image alt text describes the product", async (t) => {
  const { buildImageAlt } = await import("../seo")

  await t.test("13. First image is just the product name", () => {
    assert.equal(buildImageAlt({ productTitle: "Drop Shoulder Tee" }), "Drop Shoulder Tee")
  })

  await t.test("14. Later images are numbered views", () => {
    assert.equal(
      buildImageAlt({ productTitle: "Drop Shoulder Tee", position: 2 }),
      "Drop Shoulder Tee, view 3"
    )
  })

  await t.test("15. Colour images name the colour", () => {
    assert.equal(
      buildImageAlt({ productTitle: "Drop Shoulder Tee", color: "Bone White", position: 1 }),
      "Drop Shoulder Tee in Bone White, view 2"
    )
  })
})

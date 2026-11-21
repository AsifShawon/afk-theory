import assert from "node:assert/strict"
import { buildGallery, findByParam, firstSlideFor, optionParam } from "../gallery"

let passed = 0
function test(name: string, fn: () => void) {
  fn()
  passed++
  console.log(`  ok - ${name}`)
}

const img = (id: string, colorId: string | null, designId?: string | null) => ({ id, colorId, designId })

test("groups photos by color in the product's color order", () => {
  const images = [img("cover", null), img("m1", "maroon"), img("g1", "green"), img("m2", "maroon"), img("detail", null), img("g2", "green")]
  const { slides, groups } = buildGallery(images, ["green", "maroon"])
  assert.deepEqual(
    slides.map((s) => s.image.id),
    ["cover", "g1", "g2", "m1", "m2", "detail"]
  )
  assert.deepEqual(
    groups.map((g) => [g.colorId, g.start, g.count]),
    [
      [null, 0, 1],
      ["green", 1, 2],
      ["maroon", 3, 2],
      [null, 5, 1],
    ]
  )
})

test("treats photos of unknown colors as shared", () => {
  const { slides } = buildGallery([img("a", "gone"), img("b", "black")], ["black"])
  assert.deepEqual(
    slides.map((s) => [s.image.id, s.colorId]),
    [
      ["a", null],
      ["b", "black"],
    ]
  )
})

test("orders by design first, then color", () => {
  const images = [img("bk-m", "maroon", "back"), img("fr-g", "green", "front"), img("bk-g", "green", "back"), img("fr-m", "maroon", "front")]
  const { slides } = buildGallery(images, ["green", "maroon"], ["front", "back"])
  assert.deepEqual(
    slides.map((s) => s.image.id),
    ["fr-g", "fr-m", "bk-g", "bk-m"]
  )
  assert.equal(firstSlideFor(slides, "maroon", "back"), 3)
  assert.equal(firstSlideFor(slides, "maroon"), 1)
  assert.equal(firstSlideFor(slides, "green", "missing"), 0)
  assert.equal(firstSlideFor(slides, "blue"), -1)
})

test("maps option names to URL values and back", () => {
  assert.equal(optionParam("Bottle Green"), "bottle-green")
  const colors = [{ name: "Bottle Green" }, { name: "Maroon" }]
  assert.equal(findByParam(colors, "MAROON")?.name, "Maroon")
  assert.equal(findByParam(colors, "pink"), undefined)
  assert.equal(findByParam(colors, null), undefined)
})

console.log(`gallery: ${passed} tests passed`)

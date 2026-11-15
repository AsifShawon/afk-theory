import { test, describe } from "node:test"
import assert from "node:assert/strict"
import {
  AUTOPLAY_INTERVAL_MS,
  AUTOPLAY_RESUME_DELAY_MS,
  AutoplayState,
  nextIndex,
  shouldAutoAdvance,
} from "../components/product/carousel-autoplay"

const base: AutoplayState = {
  count: 4,
  isHovered: false,
  hasFocus: false,
  isInView: true,
  isTabVisible: true,
  isUserPaused: false,
  prefersReducedMotion: false,
  lastInteractionAt: null,
  now: 100_000,
}

describe("Gallery and card carousel autoplay rules", () => {
  test("1. Rotation interval is 3 seconds", () => {
    assert.equal(AUTOPLAY_INTERVAL_MS, 3000)
  })

  test("2. nextIndex wraps from the last image to the first", () => {
    assert.equal(nextIndex(0, 4), 1)
    assert.equal(nextIndex(3, 4), 0)
    assert.equal(nextIndex(0, 0), 0)
  })

  test("3. Advances when nothing blocks it", () => {
    assert.equal(shouldAutoAdvance(base), true)
  })

  test("4. Never advances with fewer than two images", () => {
    assert.equal(shouldAutoAdvance({ ...base, count: 1 }), false)
    assert.equal(shouldAutoAdvance({ ...base, count: 0 }), false)
  })

  test("5. Pauses while hovered or focused", () => {
    assert.equal(shouldAutoAdvance({ ...base, isHovered: true }), false)
    assert.equal(shouldAutoAdvance({ ...base, hasFocus: true }), false)
  })

  test("6. Does not run off-screen or in a hidden tab", () => {
    assert.equal(shouldAutoAdvance({ ...base, isInView: false }), false)
    assert.equal(shouldAutoAdvance({ ...base, isTabVisible: false }), false)
  })

  test("7. Respects reduced motion and the pause button", () => {
    assert.equal(shouldAutoAdvance({ ...base, prefersReducedMotion: true }), false)
    assert.equal(shouldAutoAdvance({ ...base, isUserPaused: true }), false)
  })

  test("8. Stays off shortly after a manual interaction, then resumes", () => {
    const justNow = { ...base, lastInteractionAt: base.now - 1000 }
    assert.equal(shouldAutoAdvance(justNow), false)

    const longAgo = { ...base, lastInteractionAt: base.now - AUTOPLAY_RESUME_DELAY_MS }
    assert.equal(shouldAutoAdvance(longAgo), true)
  })

  test("9. Resume delay can be overridden", () => {
    const state = { ...base, lastInteractionAt: base.now - 2000, resumeDelayMs: 1500 }
    assert.equal(shouldAutoAdvance(state), true)
  })
})

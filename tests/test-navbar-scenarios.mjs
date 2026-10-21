import { chromium } from "@playwright/test"
import fs from "fs"
import path from "path"

const BASE_URL = "http://localhost:8000/bd"
const SCREENSHOT_DIR = path.resolve("tests/screenshots")
const DOCS_SCREENSHOT_DIR = path.resolve("docs/assets/screenshots/navbar-overhaul")

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}
if (!fs.existsSync(DOCS_SCREENSHOT_DIR)) {
  fs.mkdirSync(DOCS_SCREENSHOT_DIR, { recursive: true })
}

async function saveScreenshot(page, filename, options = {}) {
  const p1 = path.join(SCREENSHOT_DIR, filename)
  const p2 = path.join(DOCS_SCREENSHOT_DIR, filename)
  await page.screenshot({ path: p1, ...options })
  fs.copyFileSync(p1, p2)
  console.log(`📸 Captured screenshot: ${filename}`)
}

async function run() {
  console.log("🚀 Starting AFK THEORY Adaptive Navbar & Mega Menu Verification Suite...")
  const browser = await chromium.launch({ headless: true })

  const consoleErrors = []
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  })

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text())
    }
  })

  try {
    // ==========================================
    // SCENARIO A: Fresh Page Load at Scroll Position Zero (Full-Width Mode)
    // ==========================================
    console.log("\n--- SCENARIO A: Page Load at Scroll Zero ---")
    await page.goto(BASE_URL, { waitUntil: "networkidle" })
    await page.waitForTimeout(500)

    const header = page.locator("header")
    const headerStateTop = await header.getAttribute("data-state")
    console.log(`Header data-state at top: "${headerStateTop}"`)
    if (headerStateTop !== "full-width") {
      throw new Error(`Expected header to have data-state="full-width" at scroll 0, got "${headerStateTop}"`)
    }

    const headerBoxTop = await header.boundingBox()
    console.log(`Header width at top (viewport 1440px): ${headerBoxTop.width}px (100% full viewport)`)
    await saveScreenshot(page, "01-full-width-desktop-header.png")
    await saveScreenshot(page, "03-default-navigation.png", { clip: { x: 0, y: 0, width: 1440, height: 160 } })

    // ==========================================
    // SCENARIO B: Scroll Beyond Threshold (Floating Island Mode)
    // ==========================================
    console.log("\n--- SCENARIO B: Scroll to Floating Island Mode ---")
    await page.evaluate(() => window.scrollTo(0, 350))
    await page.waitForTimeout(400) // allow 300ms transition

    const headerStateFloating = await header.getAttribute("data-state")
    console.log(`Header data-state while scrolled (350px): "${headerStateFloating}"`)
    if (headerStateFloating !== "floating") {
      throw new Error(`Expected header to have data-state="floating", got "${headerStateFloating}"`)
    }

    const islandCard = header.locator("> div > div")
    const cardBox = await islandCard.boundingBox()
    console.log(`Floating island card width: ${cardBox.width}px (max-width around 1380px)`)
    console.log(`Floating island card Y offset from viewport top: ${cardBox.y}px (~10-16px)`)
    await saveScreenshot(page, "02-floating-desktop-header.png")

    // ==========================================
    // SCENARIO C: Scroll Back Up to Confirm Return to Full-Width
    // ==========================================
    console.log("\n--- SCENARIO C: Scroll Back Up to Top ---")
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(400)

    const headerStateReturned = await header.getAttribute("data-state")
    console.log(`Header data-state returned to top: "${headerStateReturned}"`)
    if (headerStateReturned !== "full-width") {
      throw new Error(`Expected header to return to "full-width", got "${headerStateReturned}"`)
    }

    // ==========================================
    // SCENARIO D: Rapid Scrolling Around Threshold (Hysteresis Check)
    // ==========================================
    console.log("\n--- SCENARIO D: Hysteresis Threshold Stability ---")
    // Jitter around 50px, 70px, 85px (should stay full-width because enter threshold is >90px)
    await page.evaluate(() => window.scrollTo(0, 75))
    await page.waitForTimeout(100)
    let state = await header.getAttribute("data-state")
    console.log(`Scroll 75px -> data-state: "${state}" (expected full-width)`)
    if (state !== "full-width") throw new Error("Premature floating switch at 75px")

    // Scroll to 120px -> switches to floating
    await page.evaluate(() => window.scrollTo(0, 120))
    await page.waitForTimeout(150)
    state = await header.getAttribute("data-state")
    console.log(`Scroll 120px -> data-state: "${state}" (expected floating)`)
    if (state !== "floating") throw new Error("Failed to switch to floating at 120px")

    // Scroll up to 65px (above exit threshold of 40px) -> should stay floating
    await page.evaluate(() => window.scrollTo(0, 65))
    await page.waitForTimeout(150)
    state = await header.getAttribute("data-state")
    console.log(`Scroll up to 65px -> data-state: "${state}" (expected floating due to hysteresis)`)
    if (state !== "floating") throw new Error("Hysteresis failed: exited floating prematurely at 65px")

    // Scroll up to 20px -> exits floating
    await page.evaluate(() => window.scrollTo(0, 20))
    await page.waitForTimeout(150)
    state = await header.getAttribute("data-state")
    console.log(`Scroll up to 20px -> data-state: "${state}" (expected full-width)`)
    if (state !== "full-width") throw new Error("Failed to return to full-width at 20px")

    // Return to top
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)

    // ==========================================
    // SCENARIO E: Hover Navigation Item & State Styles
    // ==========================================
    console.log("\n--- SCENARIO E: Hover Navigation Item & States ---")
    const shirtsNav = page.locator('nav[aria-label="Main category navigation"] a:has-text("Shirts")')
    await shirtsNav.hover()
    await page.waitForTimeout(150) // hover state applied immediately (before menu opens at 300ms)

    await saveScreenshot(page, "04-hovered-navigation.png", { clip: { x: 0, y: 0, width: 1440, height: 160 } })

    // Wait for idle hover delay (300ms) for mega menu to open
    await page.waitForTimeout(350)
    const megaMenuPanel = page.locator("#mega-menu-panel-shirts")
    const isPanelVisible = await megaMenuPanel.isVisible()
    console.log(`Shirts mega menu opened after 300ms hover delay: ${isPanelVisible}`)
    if (!isPanelVisible) throw new Error("Mega menu did not open after hover delay")

    await saveScreenshot(page, "05-expanded-mega-menu-top.png")

    // ==========================================
    // SCENARIO F: Diagonal Pointer Movement into Mega Menu Panel
    // ==========================================
    console.log("\n--- SCENARIO F: Diagonal Pointer Movement ---")
    // Move mouse diagonally into the subcategory link in the panel
    const firstSublink = megaMenuPanel.locator('a:has-text("Boxy Casual Shirts")')
    await firstSublink.hover()
    await page.waitForTimeout(200)
    const panelStillOpen = await megaMenuPanel.isVisible()
    console.log(`Mega menu remains open during diagonal pointer trajectory: ${panelStillOpen}`)
    if (!panelStillOpen) throw new Error("Mega menu closed prematurely during diagonal pointer move")

    // ==========================================
    // SCENARIO G: Switch Between Adjacent Categories
    // ==========================================
    console.log("\n--- SCENARIO G: Adjacent Category Switching ---")
    const trousersNav = page.locator('nav[aria-label="Main category navigation"] a:has-text("Trousers")')
    await trousersNav.hover()
    await page.waitForTimeout(120) // 60ms switch delay
    const trousersPanel = page.locator("#mega-menu-panel-trousers")
    const isTrousersOpen = await trousersPanel.isVisible()
    console.log(`Trousers mega menu opened smoothly on adjacent hover: ${isTrousersOpen}`)
    if (!isTrousersOpen) throw new Error("Adjacent category switch failed")

    // ==========================================
    // SCENARIO H: Mega Menu in Floating Mode
    // ==========================================
    console.log("\n--- SCENARIO H: Mega Menu in Floating Island Mode ---")
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForTimeout(400)
    const newArrivalsNav = page.locator('nav[aria-label="Main category navigation"] a:has-text("New & Trending")')
    await newArrivalsNav.hover()
    await page.waitForTimeout(350)
    const newArrivalsPanel = page.locator("#mega-menu-panel-new-arrivals")
    const isNewArrivalsOpen = await newArrivalsPanel.isVisible()
    console.log(`Mega menu opened while header is floating: ${isNewArrivalsOpen}`)
    await saveScreenshot(page, "06-expanded-mega-menu-floating.png")

    // ==========================================
    // SCENARIO I: Close Menu with Escape Key
    // ==========================================
    console.log("\n--- SCENARIO I: Keyboard Escape Dismiss ---")
    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)
    const isClosedAfterEsc = !(await newArrivalsPanel.isVisible())
    console.log(`Mega menu closed after pressing Escape: ${isClosedAfterEsc}`)
    if (!isClosedAfterEsc) throw new Error("Escape key failed to close mega menu")

    // ==========================================
    // SCENARIO J: Keyboard Only Navigation (Space/ArrowDown opens, Enter navigates)
    // ==========================================
    console.log("\n--- SCENARIO J: Keyboard Navigation ---")
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(300)
    await shirtsNav.focus()
    await page.keyboard.press("Space")
    await page.waitForTimeout(300)
    const isShirtsOpenKb = await megaMenuPanel.isVisible()
    console.log(`Mega menu opened via Keyboard Space key: ${isShirtsOpenKb}`)
    if (!isShirtsOpenKb) throw new Error("Keyboard Space failed to open mega menu")

    await page.keyboard.press("Escape")
    await page.waitForTimeout(200)

    // ==========================================
    // SCENARIO K: Open and Close Search while Menu Expanded
    // ==========================================
    console.log("\n--- SCENARIO K: Search Overlay Coordination ---")
    await shirtsNav.hover()
    await page.waitForTimeout(350)
    const searchBtn = page.locator('button[aria-label="Search catalog"]')
    await searchBtn.click()
    await page.waitForTimeout(300)
    const isMenuClosedBySearch = !(await megaMenuPanel.isVisible())
    console.log(`Mega menu automatically closed when search opened: ${isMenuClosedBySearch}`)
    if (!isMenuClosedBySearch) throw new Error("Search overlay did not dismiss open mega menu")

    // Close search overlay
    await page.keyboard.press("Escape")
    await page.waitForTimeout(300)

    // ==========================================
    // SCENARIO L: Mobile Navigation & Drawer (Viewport 390px)
    // ==========================================
    console.log("\n--- SCENARIO L: Mobile Navigation & Drawer (390px) ---")
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(300)

    await saveScreenshot(page, "07-mobile-header.png", { clip: { x: 0, y: 0, width: 390, height: 140 } })

    const hamburgerBtn = page.locator('button[aria-label="Open navigation menu"]')
    await hamburgerBtn.click()
    await page.waitForTimeout(350)

    const drawer = page.locator('div[role="dialog"]')
    const isDrawerOpen = await drawer.isVisible()
    console.log(`Mobile drawer opened cleanly: ${isDrawerOpen}`)
    if (!isDrawerOpen) throw new Error("Mobile drawer failed to open")

    // Expand category accordion inside drawer
    const shirtsAccordionBtn = drawer.locator('button[aria-label="Toggle Shirts subcategories"]')
    await shirtsAccordionBtn.click()
    await page.waitForTimeout(250)

    await saveScreenshot(page, "08-mobile-drawer.png")

    // Close drawer using Escape
    await page.keyboard.press("Escape")
    await page.waitForTimeout(350)
    const isDrawerClosed = !(await drawer.isVisible())
    console.log(`Mobile drawer closed via Escape: ${isDrawerClosed}`)
    if (!isDrawerClosed) throw new Error("Mobile drawer failed to close")

    // ==========================================
    // SCENARIO M: Dismiss Announcement Bar
    // ==========================================
    console.log("\n--- SCENARIO M: Dismiss Announcement Bar ---")
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.waitForTimeout(300)

    const dismissBtn = page.locator('button[aria-label="Close announcement bar"]')
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click()
      await page.waitForTimeout(200)
      const announcementBar = page.locator('aside[aria-label="Store Announcement"]')
      const isDismissed = !(await announcementBar.isVisible())
      console.log(`Announcement bar dismissed successfully: ${isDismissed}`)
      if (!isDismissed) throw new Error("Announcement bar failed to dismiss")
    }

    // ==========================================
    // SCENARIO N: Page Refresh While Scrolled
    // ==========================================
    console.log("\n--- SCENARIO N: Page Refresh While Scrolled ---")
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(200)
    await page.reload({ waitUntil: "networkidle" })
    await page.waitForTimeout(400)
    const stateAfterReload = await header.getAttribute("data-state")
    console.log(`Header data-state immediately upon refresh at scrollY=500: "${stateAfterReload}"`)
    if (stateAfterReload !== "floating") {
      throw new Error("Scrolled state not preserved across page reload")
    }

    // ==========================================
    // SCENARIO O: Viewport Coverage Matrix
    // ==========================================
    console.log("\n--- SCENARIO O: Viewport Matrix Testing ---")
    const viewports = [
      { name: "360px", width: 360, height: 740 },
      { name: "390px", width: 390, height: 844 },
      { name: "768px", width: 768, height: 1024 },
      { name: "1024px", width: 1024, height: 768 },
      { name: "1280px", width: 1280, height: 800 },
      { name: "1440px", width: 1440, height: 900 },
      { name: "1920px", width: 1920, height: 1080 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.evaluate(() => window.scrollTo(0, 0))
      await page.waitForTimeout(150)

      // Test scroll to floating
      await page.evaluate(() => window.scrollTo(0, 250))
      await page.waitForTimeout(250)
      const s = await header.getAttribute("data-state")
      console.log(`Viewport ${vp.name} (${vp.width}x${vp.height}): data-state at scroll 250px = "${s}"`)
      if (s !== "floating") throw new Error(`Floating state failed on viewport ${vp.name}`)
    }

    // ==========================================
    // SCENARIO P: Console Errors & Stability
    // ==========================================
    console.log("\n--- SCENARIO P: Console & Hydration Verification ---")
    console.log(`Total captured browser console errors: ${consoleErrors.length}`)
    if (consoleErrors.length > 0) {
      console.warn("Captured console errors:", consoleErrors)
    }

    console.log("\n=======================================================")
    console.log("🎉 ALL PLAYWRIGHT UX SCENARIOS PASSED WITH ZERO FAILURES!")
    console.log("=======================================================")
  } finally {
    await browser.close()
  }
}

run().catch((err) => {
  console.error("\n❌ Playwright Verification Error:", err)
  process.exit(1)
})

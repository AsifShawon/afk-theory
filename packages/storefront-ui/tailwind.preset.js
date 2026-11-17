/** @type {import('tailwindcss').Config} */

// "rgb(var(--name) / <alpha-value>)" lets Tailwind apply opacity modifiers to a CSS variable colour.
const themeColor = (name) => `rgb(var(--${name}) / <alpha-value>)`

module.exports = {
  theme: {
    extend: {
      transitionProperty: {
        width: "width margin",
        height: "height",
        bg: "background-color",
        display: "display opacity",
        visibility: "visibility",
        padding: "padding-top padding-right padding-bottom padding-left",
      },
      // Colours are CSS variables (see src/styles/storefront.css) so the whole store can be
      // themed from one place. Channels are stored as "R G B" to keep opacity utilities working
      // (bg-surface/80, border-line/50, ...).
      colors: {
        // ---- Role tokens (use these in new code) ----
        canvas: themeColor("canvas"), // page background
        surface: themeColor("surface"), // cards, sections, panels on the page
        raised: themeColor("raised"), // inputs, hover fills, drawers
        panel: themeColor("panel"), // always-dark blocks: hero tiles, footer, top bar
        ink: themeColor("ink"), // main text
        bone: themeColor("bone"), // off-white that stays light in every theme (text on photos/panels)
        muted: themeColor("muted"),
        faint: themeColor("faint"),
        line: themeColor("line"), // hairlines and card borders
        "line-strong": themeColor("line-strong"),
        control: themeColor("control"), // borders of inputs and buttons (3:1 contrast)
        accent: themeColor("accent"), // chartreuse
        "accent-hover": themeColor("accent-hover"),
        "on-accent": themeColor("on-accent"), // text on accent fills
        band: themeColor("band"), // light bands on a dark page
        "band-ink": themeColor("band-ink"),
        ok: themeColor("ok"),
        err: themeColor("err"),
        warn: themeColor("warn"),

        // ---- Legacy names, kept so older markup keeps working. Prefer the role tokens above. ----
        brand: {
          primary: themeColor("ink"),
          secondary: themeColor("canvas"),
          accent: themeColor("accent"),
          "accent-hover": themeColor("accent-hover"),
          "accent-alt": themeColor("on-accent"),
          chartreuse: "#D8F452",
          stone: themeColor("raised"),
          "stone-light": themeColor("surface"),
          olive: themeColor("muted"),
          graphite: themeColor("panel"),
          "graphite-dark": themeColor("panel"),
          "graphite-light": themeColor("raised"),
          bone: themeColor("bone"),
          "bone-light": themeColor("bone"),
          muted: themeColor("muted"),
          "muted-light": themeColor("faint"),
          surface: themeColor("surface"),
          card: themeColor("raised"),
          border: themeColor("line"),
          "border-light": themeColor("line"),
          "border-dark": themeColor("line-strong"),
          sand: themeColor("bone"),
          ivory: themeColor("canvas"),
          subtle: themeColor("raised"),
        },
        grey: {
          0: "#FFFFFF",
          5: "#FCFAF5",
          10: "#F5F3ED",
          20: "#E4E1D8",
          30: "#D3CFBF",
          40: "#8E968B",
          50: "#687065",
          60: "#4D544A",
          70: "#323730",
          80: "#20241F",
          90: "#161815",
        },
      },
      borderRadius: {
        none: "0px",
        soft: "4px",
        base: "6px",
        rounded: "8px",
        panel: "16px",
        canvas: "20px",
        large: "24px",
        pill: "9999px",
        circle: "9999px",
      },
      maxWidth: {
        "8xl": "100rem",
        editorial: "1600px",
        content: "1440px",
        narrow: "1120px",
      },
      boxShadow: {
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)",
        editorial: "0 10px 30px -5px rgba(0, 0, 0, 0.06), 0 4px 6px -2px rgba(0, 0, 0, 0.02)",
        mega: "0 20px 40px -15px rgba(0, 0, 0, 0.08)",
      },
      screens: {
        "2xsmall": "320px",
        xsmall: "512px",
        small: "1024px",
        medium: "1280px",
        large: "1440px",
        xlarge: "1600px",
        "2xlarge": "1920px",
      },
      fontSize: {
        "3xl": "2rem",
      },
      fontFamily: {
        display: ["var(--font-dm-serif)", "Georgia", "serif"],
        heading: ["var(--font-manrope)", "sans-serif"],
        sans: [
          "var(--font-manrope)",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "sans-serif",
        ],
      },
      keyframes: {
        ring: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in-right": {
          "0%": { opacity: "0", transform: "translateX(10px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        "fade-in-top": {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out-top": {
          "0%": { height: "100%" },
          "99%": { height: "0" },
          "100%": { visibility: "hidden" },
        },
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "mega-enter": {
          "0%": { opacity: "0", transform: "translateY(-4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-slide-up": {
          "0%": { height: "var(--radix-accordion-content-height)", opacity: "1" },
          "100%": { height: "0", opacity: "0" },
        },
        "accordion-slide-down": {
          "0%": { "min-height": "0", "max-height": "0", opacity: "0" },
          "100%": { "min-height": "var(--radix-accordion-content-height)", "max-height": "none", opacity: "1" },
        },
        enter: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        leave: {
          "0%": { transform: "scale(1)", opacity: "1" },
          "100%": { transform: "scale(0.9)", opacity: "0" },
        },
        "slide-in": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        "drawer-enter-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "drawer-exit-right": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(100%)" },
        },
        "drawer-enter-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "drawer-exit-left": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        "sheet-enter-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "sheet-exit-bottom": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(100%)" },
        },
      },
      animation: {
        ring: "ring 2.2s cubic-bezier(0.5, 0, 0.5, 1) infinite",
        "fade-in-right": "fade-in-right 0.3s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-in-top": "fade-in-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        "fade-out-top": "fade-out-top 0.2s cubic-bezier(0.5, 0, 0.5, 1) forwards",
        // "backwards" (not "both"): after the animation the element has no leftover transform.
        "reveal-up": "reveal-up 600ms cubic-bezier(0.16, 1, 0.3, 1) backwards",
        "mega-enter": "mega-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "accordion-open": "accordion-slide-down 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        "accordion-close": "accordion-slide-up 300ms cubic-bezier(0.87, 0, 0.13, 1) forwards",
        enter: "enter 200ms ease-out",
        "slide-in": "slide-in 1.2s cubic-bezier(.41,.73,.51,1.02)",
        leave: "leave 150ms ease-in forwards",
        "fade-in": "fade-in 200ms ease-out forwards",
        "fade-out": "fade-out 200ms ease-in forwards",
        "drawer-enter": "drawer-enter-right 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "drawer-exit": "drawer-exit-right 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "drawer-left-enter": "drawer-enter-left 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "drawer-left-exit": "drawer-exit-left 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-enter": "sheet-enter-bottom 300ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "sheet-exit": "sheet-exit-bottom 250ms cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
}

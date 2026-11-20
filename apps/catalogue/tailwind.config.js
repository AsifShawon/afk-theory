/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@dtc/storefront-ui/tailwind.preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",
      },
      screens: {
        md: "768px",
      },
    },
  },
  plugins: [],
}

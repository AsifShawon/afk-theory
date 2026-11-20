/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("@dtc/storefront-ui/tailwind.preset")],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}

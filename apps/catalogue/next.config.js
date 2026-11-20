const path = require("path")

/**
 * The public catalogue is a static export: `next build` writes plain HTML,
 * JS, CSS and images to `out/`, which any static host can serve
 * (Cloudflare Pages, Netlify, Vercel). It never talks to Supabase at runtime.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "export",
  // /products/tee/ -> /products/tee/index.html works on every static host.
  trailingSlash: true,
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  transpilePackages: ["@dtc/catalogue-core"],
  // Images are already resized to webp variants by the admin.
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
}

module.exports = nextConfig

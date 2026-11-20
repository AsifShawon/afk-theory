const path = require("path")

/**
 * LOCAL-ONLY admin. It holds the Supabase secret key, so it must never be
 * deployed. `dev` and `start` bind to 127.0.0.1 so it is not reachable from
 * other devices on the network.
 *
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  transpilePackages: ["@dtc/catalogue-core"],
  serverExternalPackages: ["sharp"],
  experimental: {
    serverActions: {
      // Several product photos per upload.
      bodySizeLimit: "40mb",
      allowedOrigins: ["127.0.0.1:8200", "localhost:8200"],
    },
  },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
}

module.exports = nextConfig

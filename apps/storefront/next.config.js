const path = require("path")
const checkEnvVariables = require("./check-env-variables")

checkEnvVariables()

/**
 * Custom Cloud & Object Storage hostnames
 */
const S3_HOSTNAME = process.env.MEDUSA_CLOUD_S3_HOSTNAME
const S3_PATHNAME = process.env.MEDUSA_CLOUD_S3_PATHNAME

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true,
  // Do not advertise the framework in every response.
  poweredByHeader: false,
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  transpilePackages: ["@dtc/commerce-contracts", "@dtc/storefront-ui"],
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },

  async headers() {
    const isProduction = process.env.NODE_ENV === "production"

    return [
      {
        source: "/:path*",
        headers: [
          // Stop browsers guessing file types (blocks content-sniffing attacks).
          { key: "X-Content-Type-Options", value: "nosniff" },
          // The store should not be embedded in other sites' frames (clickjacking).
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Do not leak full URLs (order pages, search terms) to other sites.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The store does not use these features, so deny them.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=()",
          },
          // Only meaningful over HTTPS, so production only. No includeSubDomains/preload:
          // those are hard to undo and should be a deliberate choice.
          ...(isProduction
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ]
  },

  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    // Uploads are capped at 2048px wide, so generating 2048/3840px variants only wastes
    // cache space and bandwidth.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
      },
      {
        protocol: "https",
        hostname: "media.afktheory.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
      {
        protocol: "https",
        hostname: "*.r2.dev",
      },
      {
        protocol: "https",
        hostname: "*.s3.*.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "*.s3.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      ...(S3_HOSTNAME && S3_PATHNAME
        ? [
            {
              protocol: "https",
              hostname: S3_HOSTNAME,
              pathname: S3_PATHNAME,
            },
          ]
        : []),
    ],
  },
}

module.exports = nextConfig

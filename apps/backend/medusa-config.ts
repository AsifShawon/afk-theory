import { loadEnv, defineConfig, MedusaError } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

if (process.env.NODE_ENV === "production") {
  const jwtSecret = process.env.JWT_SECRET
  const cookieSecret = process.env.COOKIE_SECRET
  if (!jwtSecret || jwtSecret.length < 32 || jwtSecret.includes("supersecret")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CRITICAL SECURITY CONFIGURATION: In production, JWT_SECRET must be explicitly set and contain at least 32 characters. Do not use default or placeholder secrets."
    )
  }
  if (!cookieSecret || cookieSecret.length < 32 || cookieSecret.includes("supersecret")) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "CRITICAL SECURITY CONFIGURATION: In production, COOKIE_SECRET must be explicitly set and contain at least 32 characters. Do not use default or placeholder secrets."
    )
  }
}

// Stripe Payment Provider Configuration (Disabled by default; AFK THEORY launches with pure Cash on Delivery)
const stripeApiKey =
  process.env.ENABLE_STRIPE === "true" ? process.env.STRIPE_API_KEY : undefined
const stripeWebhookSecret =
  process.env.ENABLE_STRIPE === "true" ? process.env.STRIPE_WEBHOOK_SECRET : undefined

const paymentProviders: {
  resolve: string
  id: string
  options: Record<string, unknown>
}[] = []

if (stripeApiKey) {
  paymentProviders.push({
    resolve: "@medusajs/medusa/payment-stripe",
    id: "stripe",
    options: {
      apiKey: stripeApiKey,
      webhookSecret: stripeWebhookSecret,
      capture: true,
    },
  })
}

// Object Storage (Cloudflare R2 / S3-Compatible) Configuration
const s3Url = process.env.S3_URL
const s3AccessKeyId = process.env.S3_ACCESS_KEY_ID
const s3SecretAccessKey = process.env.S3_SECRET_ACCESS_KEY
const s3Bucket = process.env.S3_BUCKET
const s3Region = process.env.S3_REGION || "auto"
const s3Endpoint = process.env.S3_ENDPOINT

const isRealS3Config = Boolean(
  s3Url &&
    s3AccessKeyId &&
    !s3AccessKeyId.includes("placeholder") &&
    s3SecretAccessKey &&
    !s3SecretAccessKey.includes("placeholder") &&
    s3Bucket &&
    s3Endpoint &&
    !s3Endpoint.includes("<account_id>")
)

const fileProviders = [
  isRealS3Config
    ? {
        resolve: "@medusajs/medusa/file-s3",
        id: "s3",
        options: {
          fileUrl: s3Url,
          accessKeyId: s3AccessKeyId,
          secretAccessKey: s3SecretAccessKey,
          region: s3Region,
          bucket: s3Bucket,
          endpoint: s3Endpoint,
          additionalClientConfig: {
            forcePathStyle: true,
          },
        },
      }
    : {
        resolve: "./src/modules/file-provider",
        id: "local",
        options: {
          upload_dir: "static",
          backend_url: `${process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"}/static`,
        },
      },
]

module.exports = defineConfig({
  admin: {
    disable: process.env.ADMIN_DISABLED === "true",
    path: "/app",
    backendUrl: process.env.MEDUSA_BACKEND_URL || "http://localhost:9000",
    maxUploadFileSize: 25 * 1024 * 1024, // 25MB upload limit (permits high-resolution garment media)
  },
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: fileProviders,
      },
    },
    {
      resolve: "./src/modules/campaign",
    },
    ...(paymentProviders.length > 0
      ? [
          {
            resolve: "@medusajs/medusa/payment",
            options: {
              providers: paymentProviders,
            },
          },
        ]
      : []),
  ],
})

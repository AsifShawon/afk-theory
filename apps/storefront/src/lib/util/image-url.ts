/**
 * Normalizes image URLs for local development and CDN environments.
 * Ensures local uploaded static images are routed via `/static/`.
 */
export function normalizeImageUrl(url?: string | null): string | undefined {
  if (!url || typeof url !== "string") return undefined
  let normalized = url.trim()
  if (!normalized) return undefined

  if (
    normalized.startsWith("http://localhost:9000/") &&
    !normalized.startsWith("http://localhost:9000/static/")
  ) {
    normalized = normalized.replace("http://localhost:9000/", "http://localhost:9000/static/")
  } else if (
    normalized.startsWith("http://127.0.0.1:9000/") &&
    !normalized.startsWith("http://127.0.0.1:9000/static/")
  ) {
    normalized = normalized.replace("http://127.0.0.1:9000/", "http://127.0.0.1:9000/static/")
  }

  return normalized
}

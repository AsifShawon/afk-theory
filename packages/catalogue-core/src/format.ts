/** Formats a whole-taka amount, for example 1450 -> "৳1,450". */
export function formatBdt(amount: number): string {
  return `৳${Math.round(amount).toLocaleString("en-US")}`
}

/** Plain-text price for chat messages, where the taka sign may not render. */
export function formatBdtPlain(amount: number): string {
  return `BDT ${Math.round(amount).toLocaleString("en-US")}`
}

/** "Drop 01 Oversized Tee!" -> "drop-01-oversized-tee" */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** Storage object key for one width of an image. */
export function imageObjectKey(path: string, width: number): string {
  return `${path}-${width}.webp`
}

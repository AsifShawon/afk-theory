/**
 * Normalizes a WhatsApp number to the digits-only international form that
 * wa.me expects. Bangladeshi local numbers (01XXXXXXXXX) get the 88 prefix.
 * Returns "" when the input cannot be a phone number.
 */
export function normalizeWhatsappNumber(input: string): string {
  let digits = input.replace(/\D/g, "")
  if (digits.startsWith("00")) {
    digits = digits.slice(2)
  }
  if (digits.length === 11 && digits.startsWith("01")) {
    digits = `88${digits}`
  }
  if (digits.length < 8 || digits.length > 15) {
    return ""
  }
  return digits
}

/** Keeps only characters allowed in a Facebook page username. */
export function normalizeMessengerPage(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\/(www\.)?(m\.me|facebook\.com|fb\.com)\//i, "")
  return trimmed.split(/[/?#]/)[0].replace(/[^A-Za-z0-9.]/g, "")
}

export function normalizeInstagramHandle(input: string): string {
  const trimmed = input.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
  return trimmed.split(/[/?#]/)[0].replace(/^@/, "").replace(/[^A-Za-z0-9._]/g, "")
}

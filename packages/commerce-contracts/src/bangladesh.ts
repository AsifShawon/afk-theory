/**
 * Bangladesh Location and Logistics Contracts for AFK THEORY
 * Covers all 64 administrative districts across 8 divisions
 * and provides delivery zone classification logic for Bangladesh courier networks.
 */

export type BangladeshDivision =
  | "Dhaka"
  | "Chittagong"
  | "Rajshahi"
  | "Khulna"
  | "Barisal"
  | "Sylhet"
  | "Rangpur"
  | "Mymensingh"

export type BangladeshShippingZone =
  | "inside_dhaka"
  | "dhaka_suburban"
  | "outside_dhaka"

export interface BangladeshDistrictInfo {
  id: string
  name: string
  bnName: string
  division: BangladeshDivision
  defaultZone: BangladeshShippingZone
  aliases?: string[]
}

export const BANGLADESH_DIVISIONS: BangladeshDivision[] = [
  "Dhaka",
  "Chittagong",
  "Rajshahi",
  "Khulna",
  "Barisal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
]

/**
 * 64 Administrative Districts of Bangladesh with official English names,
 * Bengali names, divisions, and phonetic/common spelling aliases.
 */
export const BANGLADESH_DISTRICTS: BangladeshDistrictInfo[] = [
  // Dhaka Division (13)
  { id: "dhaka", name: "Dhaka", bnName: "ঢাকা", division: "Dhaka", defaultZone: "inside_dhaka", aliases: ["dhaka metro", "dacca"] },
  { id: "gazipur", name: "Gazipur", bnName: "গাজীপুর", division: "Dhaka", defaultZone: "dhaka_suburban" },
  { id: "narayanganj", name: "Narayanganj", bnName: "নারায়ণগঞ্জ", division: "Dhaka", defaultZone: "dhaka_suburban", aliases: ["narayangonj"] },
  { id: "narsingdi", name: "Narsingdi", bnName: "নরসিংদী", division: "Dhaka", defaultZone: "outside_dhaka", aliases: ["narsingdhi"] },
  { id: "manikganj", name: "Manikganj", bnName: "মানিকগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka", aliases: ["manikgonj"] },
  { id: "munshiganj", name: "Munshiganj", bnName: "মুন্সীগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka", aliases: ["munshigonj"] },
  { id: "tangail", name: "Tangail", bnName: "টাঙ্গাইল", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "kishoreganj", name: "Kishoreganj", bnName: "কিশোরগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka", aliases: ["kishoregonj"] },
  { id: "faridpur", name: "Faridpur", bnName: "ফরিদপুর", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "gopalganj", name: "Gopalganj", bnName: "গোপালগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka", aliases: ["gopalgonj"] },
  { id: "madaripur", name: "Madaripur", bnName: "মাদারীপুর", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "rajbari", name: "Rajbari", bnName: "রাজবাড়ী", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "shariatpur", name: "Shariatpur", bnName: "শরীয়তপুর", division: "Dhaka", defaultZone: "outside_dhaka" },

  // Chittagong Division (11)
  { id: "chittagong", name: "Chittagong", bnName: "চট্টগ্রাম", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["chattogram", "ctg"] },
  { id: "coxs-bazar", name: "Cox's Bazar", bnName: "কক্সবাজার", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["coxsbazar", "cox's-bazar"] },
  { id: "comilla", name: "Comilla", bnName: "কুমিল্লা", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["cumilla"] },
  { id: "feni", name: "Feni", bnName: "ফেনী", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "brahmanbaria", name: "Brahmanbaria", bnName: "ব্রাহ্মণবাড়িয়া", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["brahmanbaris"] },
  { id: "rangamati", name: "Rangamati", bnName: "রাঙ্গামাটি", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "noakhali", name: "Noakhali", bnName: "নোয়াখালী", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "chandpur", name: "Chandpur", bnName: "চাঁদপুর", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "lakshmipur", name: "Lakshmipur", bnName: "লক্ষ্মীপুর", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["laxmipur"] },
  { id: "khagrachhari", name: "Khagrachhari", bnName: "খাগড়াছড়ি", division: "Chittagong", defaultZone: "outside_dhaka", aliases: ["khagrachari"] },
  { id: "bandarban", name: "Bandarban", bnName: "বান্দরবান", division: "Chittagong", defaultZone: "outside_dhaka" },

  // Rajshahi Division (8)
  { id: "rajshahi", name: "Rajshahi", bnName: "রাজশাহী", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "bogura", name: "Bogura", bnName: "বগুড়া", division: "Rajshahi", defaultZone: "outside_dhaka", aliases: ["bogra"] },
  { id: "pabna", name: "Pabna", bnName: "পাবনা", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "sirajganj", name: "Sirajganj", bnName: "সিরাজগঞ্জ", division: "Rajshahi", defaultZone: "outside_dhaka", aliases: ["sirajgonj"] },
  { id: "naogaon", name: "Naogaon", bnName: "নওগাঁ", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "natore", name: "Natore", bnName: "নাটোর", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "joypurhat", name: "Joypurhat", bnName: "জয়পুরহাট", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "chapainawabganj", name: "Chapainawabganj", bnName: "চাঁপাইনবাবগঞ্জ", division: "Rajshahi", defaultZone: "outside_dhaka", aliases: ["nawabganj", "chapai"] },

  // Khulna Division (10)
  { id: "khulna", name: "Khulna", bnName: "খুলনা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "jessore", name: "Jessore", bnName: "যশোর", division: "Khulna", defaultZone: "outside_dhaka", aliases: ["jashore"] },
  { id: "satkhira", name: "Satkhira", bnName: "সাতক্ষীরা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "jhenaidah", name: "Jhenaidah", bnName: "ঝিনাইদহ", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "bagerhat", name: "Bagerhat", bnName: "বাগেরহাট", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "kushtia", name: "Kushtia", bnName: "কুষ্টিয়া", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "magura", name: "Magura", bnName: "মাগুরা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "meherpur", name: "Meherpur", bnName: "মেহেরপুর", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "narail", name: "Narail", bnName: "নড়াইল", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "chuadanga", name: "Chuadanga", bnName: "চুয়াডাঙ্গা", division: "Khulna", defaultZone: "outside_dhaka" },

  // Barisal Division (6)
  { id: "barisal", name: "Barisal", bnName: "বরিশাল", division: "Barisal", defaultZone: "outside_dhaka", aliases: ["barishal"] },
  { id: "bhola", name: "Bhola", bnName: "ভোলা", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "jhalokati", name: "Jhalokati", bnName: "ঝালকাঠি", division: "Barisal", defaultZone: "outside_dhaka", aliases: ["jhalakathi"] },
  { id: "patuakhali", name: "Patuakhali", bnName: "পটুয়াখালী", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "pirojpur", name: "Pirojpur", bnName: "পিরোজপুর", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "barguna", name: "Barguna", bnName: "বরগুনা", division: "Barisal", defaultZone: "outside_dhaka" },

  // Sylhet Division (4)
  { id: "sylhet", name: "Sylhet", bnName: "সিলেট", division: "Sylhet", defaultZone: "outside_dhaka" },
  { id: "moulvibazar", name: "Moulvibazar", bnName: "মৌলভীবাজার", division: "Sylhet", defaultZone: "outside_dhaka", aliases: ["maulvibazar"] },
  { id: "habiganj", name: "Habiganj", bnName: "হবিগঞ্জ", division: "Sylhet", defaultZone: "outside_dhaka", aliases: ["habigonj"] },
  { id: "sunamganj", name: "Sunamganj", bnName: "সুনামগঞ্জ", division: "Sylhet", defaultZone: "outside_dhaka", aliases: ["sunamgonj"] },

  // Rangpur Division (8)
  { id: "rangpur", name: "Rangpur", bnName: "রংপুর", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "dinajpur", name: "Dinajpur", bnName: "দিনাজপুর", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "gaibandha", name: "Gaibandha", bnName: "গাইবান্ধা", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "kurigram", name: "Kurigram", bnName: "কুড়িগ্রাম", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "lalmonirhat", name: "Lalmonirhat", bnName: "লালমনিরহাট", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "nilphamari", name: "Nilphamari", bnName: "নীলফামারী", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "panchagarh", name: "Panchagarh", bnName: "পঞ্চগড়", division: "Rangpur", defaultZone: "outside_dhaka" },
  { id: "thakurgaon", name: "Thakurgaon", bnName: "ঠাকুরগাঁও", division: "Rangpur", defaultZone: "outside_dhaka" },

  // Mymensingh Division (4)
  { id: "mymensingh", name: "Mymensingh", bnName: "ময়মনসিংহ", division: "Mymensingh", defaultZone: "outside_dhaka" },
  { id: "jamalpur", name: "Jamalpur", bnName: "জামালপুর", division: "Mymensingh", defaultZone: "outside_dhaka" },
  { id: "netrokona", name: "Netrokona", bnName: "নেত্রকোণা", division: "Mymensingh", defaultZone: "outside_dhaka", aliases: ["netrakona"] },
  { id: "sherpur", name: "Sherpur", bnName: "শেরপুর", division: "Mymensingh", defaultZone: "outside_dhaka" },
]

/**
 * Key suburban thanas/areas of Dhaka district that fall under Dhaka Suburban delivery.
 */
export const DHAKA_SUBURBAN_KEYWORDS = [
  "savar",
  "keraniganj",
  "keranigonj",
  "ashulia",
  "dhamrai",
  "tongi",
  "fatullah",
  "siddhirganj",
  "aminbazar",
  "hemayetpur",
  "birulia",
  "dohar",
  "nawabganj (dhaka)",
]

/**
 * Look up a district from structured identifiers, English names, Bengali names, or aliases.
 */
export function findBangladeshDistrict(input?: string): BangladeshDistrictInfo | null {
  if (!input) return null
  const clean = input.trim().toLowerCase().replace(/[\s\-_]/g, "")
  if (!clean) return null

  for (const d of BANGLADESH_DISTRICTS) {
    if (d.id.replace(/[\s\-_]/g, "") === clean) return d
    if (d.name.toLowerCase().replace(/[\s\-_]/g, "") === clean) return d
    if (d.bnName === input.trim()) return d
    if (d.aliases?.some((a) => a.toLowerCase().replace(/[\s\-_]/g, "") === clean)) {
      return d
    }
  }

  return null
}

export interface DeliveryClassificationResult {
  isValid: boolean
  zone: BangladeshShippingZone | null
  district: BangladeshDistrictInfo | null
  error?: string
}

/**
 * Authoritatively classifies a Bangladesh delivery address into one of the 3 courier delivery zones.
 * Validates district integrity and rejects invalid districts.
 */
export function classifyBangladeshDeliveryAddress(params: {
  district?: string
  division?: string
  city?: string
  addressLine?: string
}): DeliveryClassificationResult {
  const { district: rawDistrict, division: rawDivision, city: rawCity, addressLine } = params

  // 1. Resolve structured district
  let matchedDistrict = findBangladeshDistrict(rawDistrict)

  // Fallback checks if district was passed in city or division
  if (!matchedDistrict && rawCity) {
    matchedDistrict = findBangladeshDistrict(rawCity)
  }
  if (!matchedDistrict && rawDivision) {
    matchedDistrict = findBangladeshDistrict(rawDivision)
  }

  // Reject invalid/unknown district
  if (!matchedDistrict) {
    const attempted = rawDistrict || rawCity || rawDivision || "Unknown"
    return {
      isValid: false,
      zone: null,
      district: null,
      error: `Invalid or unrecognized Bangladesh district "${attempted}". Please select a valid Bangladesh district from the 64 administrative districts.`,
    }
  }

  // 2. Classify zone based on resolved district
  // Direct suburban districts
  if (matchedDistrict.id === "gazipur" || matchedDistrict.id === "narayanganj") {
    return {
      isValid: true,
      zone: "dhaka_suburban",
      district: matchedDistrict,
    }
  }

  // Dhaka district: check for suburban thanas/areas
  if (matchedDistrict.id === "dhaka") {
    const combinedContext = `${rawCity || ""} ${addressLine || ""}`.toLowerCase()
    const isSuburban = DHAKA_SUBURBAN_KEYWORDS.some((kw) =>
      combinedContext.includes(kw)
    )
    return {
      isValid: true,
      zone: isSuburban ? "dhaka_suburban" : "inside_dhaka",
      district: matchedDistrict,
    }
  }

  // All remaining 61 districts are Outside Dhaka
  return {
    isValid: true,
    zone: "outside_dhaka",
    district: matchedDistrict,
  }
}

/**
 * Backward-compatible helper for determining shipping zone.
 * Returns default "outside_dhaka" if district is unclassified.
 */
export function determineBangladeshShippingZone(
  districtName?: string,
  cityOrArea?: string,
  addressLine?: string,
  division?: string
): BangladeshShippingZone {
  const res = classifyBangladeshDeliveryAddress({
    district: districtName,
    city: cityOrArea,
    addressLine,
    division,
  })
  return res.zone || "outside_dhaka"
}

/**
 * Expected Medusa shipping option naming tokens mapped to Bangladesh delivery zones
 */
export const ZONE_SHIPPING_OPTION_PATTERNS: Record<BangladeshShippingZone, RegExp[]> = {
  inside_dhaka: [/inside\s*dhaka/i, /dhaka\s*metro/i, /dhaka\s*city/i],
  dhaka_suburban: [/dhaka\s*suburban/i, /suburban/i, /sub-urban/i],
  outside_dhaka: [/outside\s*dhaka/i, /all\s*bangladesh/i, /nationwide/i, /district/i],
}

/**
 * Matches a Medusa shipping option (by code, zone identifier, or name) to a Bangladesh shipping zone.
 */
export function matchShippingOptionToZone(
  optionNameOrCode: string
): BangladeshShippingZone | null {
  const norm = (optionNameOrCode || "").trim().toLowerCase()
  if (norm === "inside_dhaka" || norm === "dhaka_suburban" || norm === "outside_dhaka") {
    return norm as BangladeshShippingZone
  }

  for (const [zone, patterns] of Object.entries(ZONE_SHIPPING_OPTION_PATTERNS) as [
    BangladeshShippingZone,
    RegExp[]
  ][]) {
    if (patterns.some((pattern) => pattern.test(optionNameOrCode))) {
      return zone
    }
  }
  return null
}

export const ZONE_DISPLAY_LABELS: Record<BangladeshShippingZone, string> = {
  inside_dhaka: "Inside Dhaka (Metro)",
  dhaka_suburban: "Dhaka Suburban",
  outside_dhaka: "Outside Dhaka (Nationwide)",
}

/**
 * Validates whether a selected shipping option matches the customer's delivery destination.
 * Rejects incompatible or unrecognized delivery options without hardcoding prices.
 */
export function validateShippingOptionForAddress(
  shippingOptionNameOrCode: string,
  district?: string,
  cityOrArea?: string,
  addressLine?: string,
  division?: string
): {
  isValid: boolean
  expectedZone: BangladeshShippingZone | null
  optionZone: BangladeshShippingZone | null
  message?: string
} {
  const classification = classifyBangladeshDeliveryAddress({
    district,
    city: cityOrArea,
    addressLine,
    division,
  })

  if (!classification.isValid || !classification.zone) {
    return {
      isValid: false,
      expectedZone: null,
      optionZone: null,
      message: classification.error || "Invalid shipping destination.",
    }
  }

  const expectedZone = classification.zone
  const optionZone = matchShippingOptionToZone(shippingOptionNameOrCode)

  if (!optionZone) {
    return {
      isValid: false,
      expectedZone,
      optionZone: null,
      message: `Unknown or unsupported delivery method "${shippingOptionNameOrCode}". Please select an official Bangladesh delivery method.`,
    }
  }

  if (expectedZone !== optionZone) {
    const destinationLabel = classification.district?.name || district || "your address"
    return {
      isValid: false,
      expectedZone,
      optionZone,
      message: `The selected shipping method "${shippingOptionNameOrCode}" does not match your delivery destination (${destinationLabel}). Expected delivery zone: ${ZONE_DISPLAY_LABELS[expectedZone]}.`,
    }
  }

  return { isValid: true, expectedZone, optionZone }
}

/**
 * Standard Bangladesh Shipping Zones Metadata.
 * NOTE: Authoritative pricing is managed directly in Medusa Admin / API.
 */
export const BANGLADESH_SHIPPING_RATES = {
  inside_dhaka: {
    zone: "inside_dhaka" as const,
    name: "Inside Dhaka (Metro)",
    rateBdt: 60,
    estimatedDays: "1–2 business days",
    description: "Dhaka City Corporation metropolitan areas (cash on delivery)",
  },
  dhaka_suburban: {
    zone: "dhaka_suburban" as const,
    name: "Dhaka Suburban",
    rateBdt: 100,
    estimatedDays: "2–3 business days",
    description: "Gazipur, Narayanganj, Savar, Keraniganj & peri-urban Dhaka",
  },
  outside_dhaka: {
    zone: "outside_dhaka" as const,
    name: "Outside Dhaka",
    rateBdt: 130,
    estimatedDays: "3–5 business days",
    description: "All other 61 districts across Bangladesh (cash on delivery)",
  },
}

/**
 * Validates a Bangladeshi mobile phone number.
 * Must be 11 digits starting with 013-019 (optionally with +880 or 880 prefix).
 */
export function isValidBangladeshPhone(phone: string): boolean {
  if (!phone) return false
  const cleaned = phone.replace(/[\s\-\(\)]/g, "")
  return /^(?:\+?880|880|0)?1[3-9]\d{8}$/.test(cleaned)
}

/**
 * Normalizes a Bangladeshi phone number into standard 11-digit local format: 01XXXXXXXXX
 */
export function normalizeBangladeshPhone(phone: string): string {
  if (!phone) return ""
  let cleaned = phone.replace(/[\s\-\(\)]/g, "")
  if (cleaned.startsWith("+880")) {
    cleaned = "0" + cleaned.slice(4)
  } else if (cleaned.startsWith("880")) {
    cleaned = "0" + cleaned.slice(3)
  }
  return cleaned
}

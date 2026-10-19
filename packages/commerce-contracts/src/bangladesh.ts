/**
 * Bangladesh Location and Logistics Constants for AFK THEORY
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
 * 64 Administrative Districts of Bangladesh
 */
export const BANGLADESH_DISTRICTS: BangladeshDistrictInfo[] = [
  // Dhaka Division (13)
  { id: "dhaka", name: "Dhaka", bnName: "ঢাকা", division: "Dhaka", defaultZone: "inside_dhaka" },
  { id: "gazipur", name: "Gazipur", bnName: "গাজীপুর", division: "Dhaka", defaultZone: "dhaka_suburban" },
  { id: "narayanganj", name: "Narayanganj", bnName: "নারায়ণগঞ্জ", division: "Dhaka", defaultZone: "dhaka_suburban" },
  { id: "narsingdi", name: "Narsingdi", bnName: "নরসিংদী", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "manikganj", name: "Manikganj", bnName: "মানিকগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "munshiganj", name: "Munshiganj", bnName: "মুন্সীগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "tangail", name: "Tangail", bnName: "টাঙ্গাইল", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "kishoreganj", name: "Kishoreganj", bnName: "কিশোরগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "faridpur", name: "Faridpur", bnName: "ফরিদপুর", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "gopalganj", name: "Gopalganj", bnName: "গোপালগঞ্জ", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "madaripur", name: "Madaripur", bnName: "মাদারীপুর", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "rajbari", name: "Rajbari", bnName: "রাজবাড়ী", division: "Dhaka", defaultZone: "outside_dhaka" },
  { id: "shariatpur", name: "Shariatpur", bnName: "শরীয়তপুর", division: "Dhaka", defaultZone: "outside_dhaka" },

  // Chittagong Division (11)
  { id: "chittagong", name: "Chittagong", bnName: "চট্টগ্রাম", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "coxs-bazar", name: "Cox's Bazar", bnName: "কক্সবাজার", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "comilla", name: "Comilla", bnName: "কুমিল্লা", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "feni", name: "Feni", bnName: "ফেনী", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "brahmanbaria", name: "Brahmanbaria", bnName: "ব্রাহ্মণবাড়িয়া", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "rangamati", name: "Rangamati", bnName: "রাঙ্গামাটি", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "noakhali", name: "Noakhali", bnName: "নোয়াখালী", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "chandpur", name: "Chandpur", bnName: "চাঁদপুর", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "lakshmipur", name: "Lakshmipur", bnName: "লক্ষ্মীপুর", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "khagrachhari", name: "Khagrachhari", bnName: "খাগড়াছড়ি", division: "Chittagong", defaultZone: "outside_dhaka" },
  { id: "bandarban", name: "Bandarban", bnName: "বান্দরবান", division: "Chittagong", defaultZone: "outside_dhaka" },

  // Rajshahi Division (8)
  { id: "rajshahi", name: "Rajshahi", bnName: "রাজশাহী", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "bogura", name: "Bogura", bnName: "বগুড়া", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "pabna", name: "Pabna", bnName: "পাবনা", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "sirajganj", name: "Sirajganj", bnName: "সিরাজগঞ্জ", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "naogaon", name: "Naogaon", bnName: "নওগাঁ", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "natore", name: "Natore", bnName: "নাটোর", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "joypurhat", name: "Joypurhat", bnName: "জয়পুরহাট", division: "Rajshahi", defaultZone: "outside_dhaka" },
  { id: "chapainawabganj", name: "Chapainawabganj", bnName: "চাঁপাইনবাবগঞ্জ", division: "Rajshahi", defaultZone: "outside_dhaka" },

  // Khulna Division (10)
  { id: "khulna", name: "Khulna", bnName: "খুলনা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "jessore", name: "Jessore", bnName: "যশোর", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "satkhira", name: "Satkhira", bnName: "সাতক্ষীরা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "jhenaidah", name: "Jhenaidah", bnName: "ঝিনাইদহ", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "bagerhat", name: "Bagerhat", bnName: "বাগেরহাট", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "kushtia", name: "Kushtia", bnName: "কুষ্টিয়া", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "magura", name: "Magura", bnName: "মাগুরা", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "meherpur", name: "Meherpur", bnName: "মেহেরপুর", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "narail", name: "Narail", bnName: "নড়াইল", division: "Khulna", defaultZone: "outside_dhaka" },
  { id: "chuadanga", name: "Chuadanga", bnName: "চুয়াডাঙ্গা", division: "Khulna", defaultZone: "outside_dhaka" },

  // Barisal Division (6)
  { id: "barisal", name: "Barisal", bnName: "বরিশাল", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "bhola", name: "Bhola", bnName: "ভোলা", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "jhalokati", name: "Jhalokati", bnName: "ঝালকাঠি", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "patuakhali", name: "Patuakhali", bnName: "পটুয়াখালী", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "pirojpur", name: "Pirojpur", bnName: "পিরোজপুর", division: "Barisal", defaultZone: "outside_dhaka" },
  { id: "barguna", name: "Barguna", bnName: "বরগুনা", division: "Barisal", defaultZone: "outside_dhaka" },

  // Sylhet Division (4)
  { id: "sylhet", name: "Sylhet", bnName: "সিলেট", division: "Sylhet", defaultZone: "outside_dhaka" },
  { id: "moulvibazar", name: "Moulvibazar", bnName: "মৌলভীবাজার", division: "Sylhet", defaultZone: "outside_dhaka" },
  { id: "habiganj", name: "Habiganj", bnName: "হবিগঞ্জ", division: "Sylhet", defaultZone: "outside_dhaka" },
  { id: "sunamganj", name: "Sunamganj", bnName: "সুনামগঞ্জ", division: "Sylhet", defaultZone: "outside_dhaka" },

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
  { id: "netrokona", name: "Netrokona", bnName: "নেত্রকোণা", division: "Mymensingh", defaultZone: "outside_dhaka" },
  { id: "sherpur", name: "Sherpur", bnName: "শেরপুর", division: "Mymensingh", defaultZone: "outside_dhaka" },
]

/**
 * Key sub-areas and thanas of Dhaka that fall under Dhaka Suburban rates (৳100)
 */
export const DHAKA_SUBURBAN_KEYWORDS = [
  "savar",
  "keraniganj",
  "keranigonj",
  "ashulia",
  "dhamrai",
  "gazipur",
  "narayanganj",
  "narayangonj",
  "fatullah",
  "siddhirganj",
  "tongi",
  "kaliakair",
  "kapasia",
  "sreepur",
]

/**
 * Standard Bangladesh Shipping Zones and Rates
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
    description: "All other 60 districts across Bangladesh (cash on delivery)",
  },
}

/**
 * Classifies an address into one of the three Bangladesh delivery zones
 */
export function determineBangladeshShippingZone(
  districtName?: string,
  cityOrArea?: string,
  addressLine?: string
): BangladeshShippingZone {
  const normDistrict = (districtName || "").trim().toLowerCase()
  const combinedText = `${cityOrArea || ""} ${addressLine || ""}`.toLowerCase()

  // 1. Direct suburban district check
  if (normDistrict === "gazipur" || normDistrict === "narayanganj") {
    return "dhaka_suburban"
  }

  // 2. Check if district is Dhaka
  if (normDistrict === "dhaka") {
    const isSuburbanArea = DHAKA_SUBURBAN_KEYWORDS.some((kw) =>
      combinedText.includes(kw)
    )
    return isSuburbanArea ? "dhaka_suburban" : "inside_dhaka"
  }

  // 3. Fallback check on combined address text for Dhaka or suburban keywords
  if (!normDistrict || normDistrict === "metro" || normDistrict === "dhaka metro") {
    const isSuburbanArea = DHAKA_SUBURBAN_KEYWORDS.some((kw) =>
      combinedText.includes(kw)
    )
    if (isSuburbanArea) return "dhaka_suburban"
    if (combinedText.includes("dhaka")) return "inside_dhaka"
  }

  // 4. Any other district is Outside Dhaka
  return "outside_dhaka"
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

/**
 * Bangladesh Delivery Zone Validation and Verification for Medusa Backend
 * Enforces authoritative server-side logistics integrity.
 */

export type BangladeshShippingZone =
  | "inside_dhaka"
  | "dhaka_suburban"
  | "outside_dhaka"

export interface BangladeshDistrictInfo {
  id: string
  name: string
  bnName: string
  division: string
  defaultZone: BangladeshShippingZone
  aliases?: string[]
}

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
]

export function findDistrict(input?: string): BangladeshDistrictInfo | null {
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

export function classifyAddress(address: Record<string, any>): {
  isValid: boolean
  zone: BangladeshShippingZone | null
  district: BangladeshDistrictInfo | null
  error?: string
} {
  const metadataDistrict = address.metadata?.district_name || address.metadata?.district
  const rawDistrict = metadataDistrict || address.city || address.province
  const rawCity = address.city
  const rawDivision = address.province
  const addressLine = address.address_1 || ""

  let matchedDistrict = findDistrict(rawDistrict)
  if (!matchedDistrict && rawCity) {
    matchedDistrict = findDistrict(rawCity)
  }
  if (!matchedDistrict && rawDivision) {
    matchedDistrict = findDistrict(rawDivision)
  }

  if (!matchedDistrict) {
    return {
      isValid: false,
      zone: null,
      district: null,
      error: `Invalid or unrecognized Bangladesh district "${rawDistrict || "unknown"}".`,
    }
  }

  if (matchedDistrict.id === "gazipur" || matchedDistrict.id === "narayanganj") {
    return {
      isValid: true,
      zone: "dhaka_suburban",
      district: matchedDistrict,
    }
  }

  if (matchedDistrict.id === "dhaka") {
    const combined = `${rawCity || ""} ${addressLine}`.toLowerCase()
    const isSuburban = DHAKA_SUBURBAN_KEYWORDS.some((kw) => combined.includes(kw))
    return {
      isValid: true,
      zone: isSuburban ? "dhaka_suburban" : "inside_dhaka",
      district: matchedDistrict,
    }
  }

  return {
    isValid: true,
    zone: "outside_dhaka",
    district: matchedDistrict,
  }
}

export function matchOptionZone(option: {
  name: string
  data?: Record<string, any> | null
  type?: { code?: string } | null
}): BangladeshShippingZone | null {
  const dataZone = option.data?.zone
  if (dataZone === "inside_dhaka" || dataZone === "dhaka_suburban" || dataZone === "outside_dhaka") {
    return dataZone
  }

  const typeCode = option.type?.code
  if (typeCode === "inside_dhaka" || typeCode === "dhaka_suburban" || typeCode === "outside_dhaka") {
    return typeCode
  }

  const name = (option.name || "").toLowerCase()
  if (/inside\s*dhaka|dhaka\s*metro|dhaka\s*city/.test(name)) return "inside_dhaka"
  if (/dhaka\s*suburban|suburban|sub-urban/.test(name)) return "dhaka_suburban"
  if (/outside\s*dhaka|all\s*bangladesh|nationwide|district/.test(name)) return "outside_dhaka"

  return null
}

export function validateDeliveryOptionForAddress(
  option: {
    name: string
    data?: Record<string, any> | null
    type?: { code?: string } | null
  },
  address: Record<string, any>
): {
  isValid: boolean
  message?: string
} {
  const classification = classifyAddress(address)
  if (!classification.isValid || !classification.zone) {
    return {
      isValid: false,
      message: classification.error || "Invalid delivery destination.",
    }
  }

  const optionZone = matchOptionZone(option)
  if (!optionZone) {
    return {
      isValid: false,
      message: `Unknown or incompatible delivery option "${option.name}". Please select an official Bangladesh delivery method.`,
    }
  }

  if (classification.zone !== optionZone) {
    const zoneLabels: Record<BangladeshShippingZone, string> = {
      inside_dhaka: "Inside Dhaka (Metro)",
      dhaka_suburban: "Dhaka Suburban",
      outside_dhaka: "Outside Dhaka (Nationwide)",
    }
    const target = classification.district?.name || address.city || "your address"
    return {
      isValid: false,
      message: `Delivery method "${option.name}" cannot be applied to ${target}. Expected zone: ${zoneLabels[classification.zone]}.`,
    }
  }

  return { isValid: true }
}

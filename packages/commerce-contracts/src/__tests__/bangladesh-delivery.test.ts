import test from "node:test"
import assert from "node:assert/strict"
import {
  classifyBangladeshDeliveryAddress,
  findBangladeshDistrict,
  determineBangladeshShippingZone,
  validateShippingOptionForAddress,
  matchShippingOptionToZone,
  isValidBangladeshPhone,
  normalizeBangladeshPhone,
} from "../bangladesh"

test("Bangladesh Logistics & Delivery Zone Authoritative Verification", async (t) => {
  await t.test("1. Dhanmondi, Dhaka classifies as Inside Dhaka (Metro)", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Dhaka",
      city: "Dhanmondi",
      addressLine: "Road 27, Dhanmondi",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "inside_dhaka")
    assert.equal(res.district?.name, "Dhaka")
  })

  await t.test("2. Banani, Dhaka classifies as Inside Dhaka (Metro)", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Dhaka",
      city: "Banani",
      addressLine: "Block E, Road 11, Banani",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "inside_dhaka")
    assert.equal(res.district?.name, "Dhaka")
  })

  await t.test("3. Savar, Dhaka classifies as Dhaka Suburban", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Dhaka",
      city: "Savar",
      addressLine: "Bank Town, Savar",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "dhaka_suburban")
    assert.equal(res.district?.name, "Dhaka")
  })

  await t.test("4. Keraniganj, Dhaka classifies as Dhaka Suburban", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Dhaka",
      city: "Keraniganj",
      addressLine: "Rohitpur, Keraniganj",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "dhaka_suburban")
  })

  await t.test("5. Gazipur classifies as Dhaka Suburban", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Gazipur",
      city: "Tongi",
      addressLine: "Station Road, Tongi",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "dhaka_suburban")
    assert.equal(res.district?.id, "gazipur")
  })

  await t.test("6. Narayanganj classifies as Dhaka Suburban", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Narayanganj",
      city: "Chashara",
      addressLine: "BB Road, Chashara",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "dhaka_suburban")
    assert.equal(res.district?.id, "narayanganj")
  })

  await t.test("7. Chattogram (and Chittagong alias) classifies as Outside Dhaka", () => {
    const res1 = classifyBangladeshDeliveryAddress({
      district: "Chattogram",
      city: "Agrabad",
      addressLine: "CDA Avenue",
    })
    assert.equal(res1.isValid, true)
    assert.equal(res1.zone, "outside_dhaka")
    assert.equal(res1.district?.id, "chittagong")

    const res2 = classifyBangladeshDeliveryAddress({
      district: "Chittagong",
      city: "Nasirabad",
    })
    assert.equal(res2.isValid, true)
    assert.equal(res2.zone, "outside_dhaka")
  })

  await t.test("8. Rajshahi classifies as Outside Dhaka", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Rajshahi",
      city: "Shaheb Bazar",
    })
    assert.equal(res.isValid, true)
    assert.equal(res.zone, "outside_dhaka")
    assert.equal(res.district?.id, "rajshahi")
  })

  await t.test("9. Invalid district is strictly rejected (isValid: false)", () => {
    const res = classifyBangladeshDeliveryAddress({
      district: "Atlantis",
      city: "Lost City",
      addressLine: "Ocean Floor",
    })
    assert.equal(res.isValid, false)
    assert.equal(res.zone, null)
    assert.match(res.error || "", /Invalid or unrecognized Bangladesh district/i)
  })

  await t.test("10. Incompatible shipping method is rejected by validator", () => {
    // Attempting to use Inside Dhaka shipping option for a Rajshahi address
    const check1 = validateShippingOptionForAddress(
      "Standard Delivery (Inside Dhaka)",
      "Rajshahi",
      "Shaheb Bazar"
    )
    assert.equal(check1.isValid, false)
    assert.equal(check1.expectedZone, "outside_dhaka")
    assert.equal(check1.optionZone, "inside_dhaka")
    assert.match(check1.message || "", /does not match your delivery destination/i)

    // Attempting to use Outside Dhaka shipping option for a Dhanmondi (Inside Dhaka) address
    const check2 = validateShippingOptionForAddress(
      "Standard Delivery (Outside Dhaka)",
      "Dhaka",
      "Dhanmondi",
      "Road 4"
    )
    assert.equal(check2.isValid, false)
    assert.equal(check2.expectedZone, "inside_dhaka")
    assert.equal(check2.optionZone, "outside_dhaka")

    // Matching shipping option passes
    const check3 = validateShippingOptionForAddress(
      "Dhaka Suburban Delivery",
      "Gazipur",
      "Gazipur Sadar"
    )
    assert.equal(check3.isValid, true)
    assert.equal(check3.expectedZone, "dhaka_suburban")
    assert.equal(check3.optionZone, "dhaka_suburban")
  })

  await t.test("11. Unknown shipping option is rejected", () => {
    const check = validateShippingOptionForAddress(
      "Express Teleportation Carrier",
      "Dhaka",
      "Gulshan"
    )
    assert.equal(check.isValid, false)
    assert.equal(check.optionZone, null)
    assert.match(check.message || "", /Unknown or unsupported delivery method/i)
  })

  await t.test("12. 11-Digit BD Mobile Phone Validation & Normalization", () => {
    assert.equal(isValidBangladeshPhone("01712345678"), true)
    assert.equal(isValidBangladeshPhone("+8801812345678"), true)
    assert.equal(isValidBangladeshPhone("8801912345678"), true)
    assert.equal(isValidBangladeshPhone("017-1234-5678"), true)
    assert.equal(isValidBangladeshPhone("01234567890"), false) // Invalid operator 012
    assert.equal(isValidBangladeshPhone("12345"), false) // Too short
    assert.equal(isValidBangladeshPhone("017123456789"), false) // 12 digits

    assert.equal(normalizeBangladeshPhone("+8801712345678"), "01712345678")
    assert.equal(normalizeBangladeshPhone("8801812345678"), "01812345678")
    assert.equal(normalizeBangladeshPhone("01912345678"), "01912345678")
  })
})

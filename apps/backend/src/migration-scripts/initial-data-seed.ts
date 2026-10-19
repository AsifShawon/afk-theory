import { MedusaContainer } from "@medusajs/framework"
import {
  ContainerRegistrationKeys,
  ModuleRegistrationName,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createCollectionsWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductTagsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  deleteRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  updateStoresWorkflow,
  updateRegionsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  deleteProductsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function initial_data_seed({
  container,
}: {
  container: MedusaContainer
}) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const fulfillmentModuleService = container.resolve(
    ModuleRegistrationName.FULFILLMENT
  )

  // 1. Production Safety Guard
  if (process.env.NODE_ENV === "production" && !process.env.ALLOW_PROD_SEED) {
    logger.warn("Skipping development seed script in production environment.")
    return
  }

  logger.info("Starting AFK THEORY store seed (Bangladesh / BDT)...")

  // 2. Sales Channel
  let defaultSalesChannel: { id: string; name: string }
  const { data: existingSalesChannels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })

  const afkChannel = existingSalesChannels.find((sc: { name: string }) =>
    sc.name.includes("AFK THEORY")
  )

  if (afkChannel) {
    defaultSalesChannel = afkChannel
    logger.info(`Using existing sales channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)
  } else if (existingSalesChannels.length > 0) {
    defaultSalesChannel = existingSalesChannels[0]
    logger.info(`Using primary sales channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)
  } else {
    logger.info("Creating AFK THEORY Default Sales Channel...")
    const {
      result: [channel],
    } = await createSalesChannelsWorkflow(container).run({
      input: {
        salesChannelsData: [
          {
            name: "AFK THEORY Default Channel",
            description: "Default sales channel for AFK THEORY streetwear e-commerce storefront",
          },
        ],
      },
    })
    defaultSalesChannel = channel
  }

  // 3. Publishable API Key
  let publishableApiKey: { id: string; token?: string; title: string }
  const { data: existingApiKeys } = await query.graph({
    entity: "api_key",
    fields: ["id", "token", "title", "type"],
  })

  const publishableKeyFound = existingApiKeys.find(
    (k: { type: string; title: string }) => k.type === "publishable"
  )
  if (publishableKeyFound) {
    publishableApiKey = publishableKeyFound
    logger.info(`Using existing publishable API key: ${publishableApiKey.title} (${publishableApiKey.id})`)
  } else {
    logger.info("Creating AFK THEORY Storefront Publishable API Key...")
    const {
      result: [key],
    } = await createApiKeysWorkflow(container).run({
      input: {
        api_keys: [
          {
            title: "AFK THEORY Storefront Key",
            type: "publishable",
            created_by: "",
          },
        ],
      },
    })
    publishableApiKey = key
  }

  try {
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: {
        id: publishableApiKey.id,
        add: [defaultSalesChannel.id],
      },
    })
  } catch (err) {
    logger.debug(`Sales channel link to API key already exists or skipped: ${err}`)
  }

  // 4. Store Details
  const { data: existingStores } = await query.graph({
    entity: "store",
    fields: ["id", "name"],
  })

  if (existingStores.length > 0) {
    logger.info("Updating existing store settings for AFK THEORY...")
    await updateStoresWorkflow(container).run({
      input: {
        selector: { id: existingStores[0].id },
        update: {
          name: "AFK THEORY",
          supported_currencies: [
            {
              currency_code: "bdt",
              is_default: true,
            },
            {
              currency_code: "usd",
              is_default: false,
            },
          ],
          default_sales_channel_id: defaultSalesChannel.id,
        },
      },
    })
  } else {
    logger.info("Creating AFK THEORY Store...")
    await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "AFK THEORY",
            supported_currencies: [
              {
                currency_code: "bdt",
                is_default: true,
              },
              {
                currency_code: "usd",
                is_default: false,
              },
            ],
            default_sales_channel_id: defaultSalesChannel.id,
          },
        ],
      },
    })
  }

  // 5. Region (Bangladesh - BDT)
  let region: { id: string; name: string }
  const { data: existingRegions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
  })

  const nonBdRegions = existingRegions.filter(
    (r: { currency_code: string }) => r.currency_code !== "bdt"
  )
  if (nonBdRegions.length > 0) {
    logger.info(`Cleaning up ${nonBdRegions.length} old non-BD region(s)...`)
    try {
      await deleteRegionsWorkflow(container).run({
        input: { ids: nonBdRegions.map((r: { id: string }) => r.id) },
      })
    } catch (e) {
      logger.debug(`Note on removing old regions: ${e}`)
    }
  }

  const bdRegion = existingRegions.find(
    (r: { currency_code: string }) => r.currency_code === "bdt"
  )

  const desiredPaymentProviders = process.env.STRIPE_API_KEY
    ? ["pp_stripe_stripe", "pp_system_default"]
    : ["pp_system_default"]

  if (bdRegion) {
    region = bdRegion
    logger.info(`Using existing Bangladesh region: ${region.name} (${region.id})`)
    try {
      await updateRegionsWorkflow(container).run({
        input: {
          selector: { id: region.id },
          update: {
            payment_providers: desiredPaymentProviders,
          },
        },
      })
    } catch {
      logger.warn("Could not update region payment providers, proceeding with existing configuration.")
    }
  } else {
    logger.info("Creating Bangladesh Region (BDT)...")
    const { result: regionResult } = await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Bangladesh",
            currency_code: "bdt",
            countries: ["bd"],
            payment_providers: desiredPaymentProviders,
          },
        ],
      },
    })
    region = regionResult[0]
  }

  // 6. Tax Region
  const { data: existingTaxRegions } = await query.graph({
    entity: "tax_region",
    fields: ["id", "country_code"],
  })
  if (!existingTaxRegions.some((tr: { country_code: string }) => tr.country_code === "bd")) {
    logger.info("Creating Bangladesh Tax Region...")
    await createTaxRegionsWorkflow(container).run({
      input: [
        {
          country_code: "bd",
          provider_id: "tp_system",
        },
      ],
    })
  }

  // 7. Stock Location
  let stockLocation: { id: string; name: string }
  const { data: existingStockLocations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
  })

  const dhakaLocation = existingStockLocations.find(
    (sl: { name: string }) => sl.name === "Dhaka Central Warehouse"
  )
  if (dhakaLocation) {
    stockLocation = dhakaLocation
    logger.info(`Using existing stock location: ${stockLocation.name} (${stockLocation.id})`)
  } else {
    logger.info("Creating Dhaka Central Warehouse Stock Location...")
    const { result: stockLocationResult } = await createStockLocationsWorkflow(
      container
    ).run({
      input: {
        locations: [
          {
            name: "Dhaka Central Warehouse",
            address: {
              city: "Dhaka",
              country_code: "BD",
              address_1: "Tejgaon Industrial Area",
            },
          },
        ],
      },
    })
    stockLocation = stockLocationResult[0]

    try {
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_provider_id: "manual_manual",
        },
      })
    } catch (e) {
      logger.debug(`Stock location fulfillment provider link already exists: ${e}`)
    }

    try {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: {
          id: stockLocation.id,
          add: [defaultSalesChannel.id],
        },
      })
    } catch (e) {
      logger.debug(`Stock location sales channel link already exists: ${e}`)
    }
  }

  // 8. Shipping Profile & Fulfillment Set
  const { data: shippingProfileResult } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  const shippingProfile = shippingProfileResult[0]

  const { data: existingFulfillmentSets } = await query.graph({
    entity: "fulfillment_set",
    fields: ["id", "name", "service_zones.id", "service_zones.name"],
  })

  let serviceZoneId: string
  const existingBdFulfillment = existingFulfillmentSets.find(
    (fs: { name: string }) => fs.name === "Bangladesh Delivery Network"
  )

  if (existingBdFulfillment && existingBdFulfillment.service_zones?.length > 0) {
    serviceZoneId = existingBdFulfillment.service_zones[0].id
    logger.info("Using existing Bangladesh fulfillment service zone.")
  } else {
    logger.info("Creating Bangladesh Fulfillment Set and Service Zones...")
    const fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "Bangladesh Delivery Network",
      type: "shipping",
      service_zones: [
        {
          name: "Bangladesh Nationwide",
          geo_zones: [
            {
              country_code: "bd",
              type: "country",
            },
          ],
        },
      ],
    })
    serviceZoneId = fulfillmentSet.service_zones[0].id

    try {
      await link.create({
        [Modules.STOCK_LOCATION]: {
          stock_location_id: stockLocation.id,
        },
        [Modules.FULFILLMENT]: {
          fulfillment_set_id: fulfillmentSet.id,
        },
      })
    } catch (e) {
      logger.debug(`Stock location fulfillment set link already exists: ${e}`)
    }

    logger.info("Creating standard shipping options for Bangladesh in BDT...")
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard Delivery (Inside Dhaka)",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Inside Dhaka",
            description: "Delivered within 24-48 hours in Dhaka Metro.",
            code: "inside_dhaka",
          },
          prices: [
            {
              currency_code: "bdt",
              amount: 60,
            },
            {
              currency_code: "usd",
              amount: 1,
            },
            {
              region_id: region.id,
              amount: 60,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
        {
          name: "Dhaka Suburban Delivery",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Dhaka Suburban",
            description: "Delivered in 2-3 business days (Gazipur, Savar, Narayanganj, Keraniganj).",
            code: "dhaka_suburban",
          },
          prices: [
            {
              currency_code: "bdt",
              amount: 100,
            },
            {
              currency_code: "usd",
              amount: 1.5,
            },
            {
              region_id: region.id,
              amount: 100,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
        {
          name: "Standard Delivery (Outside Dhaka)",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: serviceZoneId,
          shipping_profile_id: shippingProfile.id,
          type: {
            label: "Outside Dhaka",
            description: "Nationwide courier delivery across all 60 Bangladesh districts in 3-5 business days.",
            code: "outside_dhaka",
          },
          prices: [
            {
              currency_code: "bdt",
              amount: 130,
            },
            {
              currency_code: "usd",
              amount: 2,
            },
            {
              region_id: region.id,
              amount: 130,
            },
          ],
          rules: [
            {
              attribute: "enabled_in_store",
              value: "true",
              operator: "eq",
            },
            {
              attribute: "is_return",
              value: "false",
              operator: "eq",
            },
          ],
        },
      ],
    })
  }

  // 9. Categories: Drop Shoulder T-Shirts, Regular T-Shirts, Shirts, Trousers & Pants, Accessories
  logger.info("Setting up AFK THEORY product categories...")
  const categoryNames = [
    "Drop Shoulder T-Shirts",
    "Regular T-Shirts",
    "Shirts",
    "Trousers & Pants",
    "Accessories",
  ]
  const { data: existingCategories } = await query.graph({
    entity: "product_category",
    fields: ["id", "name"],
  })

  const missingCategories = categoryNames.filter(
    (name) => !existingCategories.some((c: { name: string }) => c.name === name)
  )

  let allCategories: any[] = [...existingCategories]
  if (missingCategories.length > 0) {
    const { result: createdCategories } = await createProductCategoriesWorkflow(
      container
    ).run({
      input: {
        product_categories: missingCategories.map((name) => ({
          name,
          is_active: true,
        })),
      },
    })
    allCategories = [...allCategories, ...createdCategories]
  }

  const catMap = Object.fromEntries(
    allCategories.map((c: { name: string; id: string }) => [c.name, c.id])
  )

  // 10. Collections: Drop 01: Offline by Choice, Essentials, Archive
  logger.info("Setting up AFK THEORY product collections...")
  const collectionData = [
    { title: "Drop 01: Offline by Choice", handle: "drop-01-offline-by-choice" },
    { title: "Essentials", handle: "essentials" },
    { title: "Archive", handle: "archive" },
  ]
  const { data: existingCollections } = await query.graph({
    entity: "product_collection",
    fields: ["id", "title", "handle"],
  })

  const missingCollections = collectionData.filter(
    (col) => !existingCollections.some((c: { handle: string }) => c.handle === col.handle)
  )

  let allCollections: any[] = [...existingCollections]
  if (missingCollections.length > 0) {
    const { result: createdCollections } = await createCollectionsWorkflow(
      container
    ).run({
      input: {
        collections: missingCollections,
      },
    })
    allCollections = [...allCollections, ...createdCollections]
  }

  const colMap = Object.fromEntries(
    allCollections.map((c: { handle: string; id: string }) => [c.handle, c.id])
  )

  // 11. Clean Up Old Legacy Products If Existing
  const { data: existingProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })

  const legacyHandlesToDelete = [
    "heavyweight-t-shirt",
    "oxford-button-down-shirt",
    "regent-knit-polo",
    "mayfair-tailored-chinos",
    "chelsea-relaxed-linen-shirt",
    "soho-cotton-twill-cap",
    "t-shirt",
    "sweatshirt",
    "sweatpants",
    "shorts",
  ]
  const legacyProductIds = existingProducts
    .filter((p: { handle: string }) => legacyHandlesToDelete.includes(p.handle))
    .map((p: { id: string }) => p.id)

  if (legacyProductIds.length > 0) {
    logger.info(`Purging legacy product catalog items: ${legacyProductIds.length} items...`)
    try {
      await deleteProductsWorkflow(container).run({
        input: { ids: legacyProductIds },
      })
    } catch (e) {
      logger.debug(`Note on deleting legacy products: ${e}`)
    }
  }

  // 12. Check if AFK THEORY sample Drop Shoulder product already exists
  const { data: currentProducts } = await query.graph({
    entity: "product",
    fields: ["id", "handle"],
  })
  const currentHandles = new Set(currentProducts.map((p: { handle: string }) => p.handle))

  // 13. Product Tags Setup
  logger.info("Setting up AFK THEORY product tags...")
  const tagValues = [
    "drop-shoulder",
    "oversized",
    "streetwear",
    "heavyweight",
    "drop-01",
    "cotton",
    "t-shirt",
    "box-fit",
  ]
  const { data: existingTags } = await query.graph({
    entity: "product_tag",
    fields: ["id", "value"],
  })

  const missingTags = tagValues.filter(
    (val) => !existingTags.some((t: { value: string }) => t.value === val)
  )

  let allTags: any[] = [...existingTags]
  if (missingTags.length > 0) {
    const { result: createdTags } = await createProductTagsWorkflow(
      container
    ).run({
      input: {
        product_tags: missingTags.map((value) => ({ value })),
      },
    })
    allTags = [...allTags, ...createdTags]
  }

  const tagMap = Object.fromEntries(
    allTags.map((t: { value: string; id: string }) => [t.value, t.id])
  )

  // 14. Stock Allocation Map (SKU -> Units)
  // Configured with genuine inventory per variant, with XXL/Chartreuse set to 0 to verify sold-out UI
  const skuStockMap: Record<string, number> = {
    // Graphite Black variants
    "AFK-DS-BLK-S": 25,
    "AFK-DS-BLK-M": 40,
    "AFK-DS-BLK-L": 35,
    "AFK-DS-BLK-XL": 20,
    "AFK-DS-BLK-XXL": 15,

    // Bone White variants
    "AFK-DS-WHT-S": 30,
    "AFK-DS-WHT-M": 45,
    "AFK-DS-WHT-L": 30,
    "AFK-DS-WHT-XL": 15,
    "AFK-DS-WHT-XXL": 10,

    // Electric Chartreuse variants
    "AFK-DS-CHA-S": 20,
    "AFK-DS-CHA-M": 30,
    "AFK-DS-CHA-L": 25,
    "AFK-DS-CHA-XL": 15,
    "AFK-DS-CHA-XXL": 0, // Zero inventory: verifies sold-out behavior in storefront
  }

  // 15. Create Single Configurable Sample Drop Shoulder Product (DRAFT STATUS)
  // As required: "Create one configurable sample Drop Shoulder product as a draft or development-only fixture.
  // The final product must remain unpublished until I provide real details."
  logger.info("Configuring AFK THEORY inaugural Drop Shoulder sample fixture (status: draft)...")

  const productsToCreate: any[] = []

  if (!currentHandles.has("drop-shoulder-t-shirt")) {
    productsToCreate.push({
      title: "AFK THEORY Drop 01 Oversized Drop Shoulder T-Shirt",
      handle: "drop-shoulder-t-shirt",
      subtitle: "Sample Streetwear Drop Shoulder Fixture (Draft Spec)",
      description:
        "The foundational AFK THEORY silhouette. Engineered with fallen shoulder seams, wide chest ease, robust rib-knit collar retention, and generous boxy streetwear drape. Created as a configurable development fixture awaiting final production specifications.",
      material: "100% Combed Heavyweight Cotton (Development Fixture)",
      status: ProductStatus.DRAFT, // MUST REMAIN DRAFT UNTIL USER DETAILS PROVIDED
      shipping_profile_id: shippingProfile.id,
      collection_id:
        colMap["drop-01-offline-by-choice"] || colMap["essentials"],
      category_ids: [
        catMap["Drop Shoulder T-Shirts"],
        catMap["Regular T-Shirts"],
      ].filter(Boolean),
      tag_ids: [
        tagMap["drop-shoulder"],
        tagMap["oversized"],
        tagMap["streetwear"],
        tagMap["heavyweight"],
        tagMap["drop-01"],
      ].filter(Boolean),
      metadata: {
        care_instructions:
          "Machine wash cold inside out with like colors. Do not bleach. Dry flat in shade. Cool iron on reverse. Do not iron over graphic print.",
        fit: "Intentional Oversized Streetwear Fit with Dropped Shoulder Seams",
        origin: "Engineered and crafted in Bangladesh",
        sample_spec: "true",
        placeholder_asset: "true",
      },
      images: [
        {
          url: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80",
        },
        {
          url: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=1000&q=80",
        },
        {
          url: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80",
        },
      ],
      options: [
        { title: "Size", values: ["S", "M", "L", "XL", "XXL"] },
        {
          title: "Color",
          values: ["Graphite Black", "Bone White", "Electric Chartreuse"],
        },
      ],
      variants: [
        // Graphite Black
        {
          title: "S / Graphite Black",
          sku: "AFK-DS-BLK-S",
          manage_inventory: true,
          options: { Size: "S", Color: "Graphite Black" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "M / Graphite Black",
          sku: "AFK-DS-BLK-M",
          manage_inventory: true,
          options: { Size: "M", Color: "Graphite Black" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "L / Graphite Black",
          sku: "AFK-DS-BLK-L",
          manage_inventory: true,
          options: { Size: "L", Color: "Graphite Black" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XL / Graphite Black",
          sku: "AFK-DS-BLK-XL",
          manage_inventory: true,
          options: { Size: "XL", Color: "Graphite Black" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XXL / Graphite Black",
          sku: "AFK-DS-BLK-XXL",
          manage_inventory: true,
          options: { Size: "XXL", Color: "Graphite Black" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },

        // Bone White
        {
          title: "S / Bone White",
          sku: "AFK-DS-WHT-S",
          manage_inventory: true,
          options: { Size: "S", Color: "Bone White" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "M / Bone White",
          sku: "AFK-DS-WHT-M",
          manage_inventory: true,
          options: { Size: "M", Color: "Bone White" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "L / Bone White",
          sku: "AFK-DS-WHT-L",
          manage_inventory: true,
          options: { Size: "L", Color: "Bone White" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XL / Bone White",
          sku: "AFK-DS-WHT-XL",
          manage_inventory: true,
          options: { Size: "XL", Color: "Bone White" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XXL / Bone White",
          sku: "AFK-DS-WHT-XXL",
          manage_inventory: true,
          options: { Size: "XXL", Color: "Bone White" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },

        // Electric Chartreuse
        {
          title: "S / Electric Chartreuse",
          sku: "AFK-DS-CHA-S",
          manage_inventory: true,
          options: { Size: "S", Color: "Electric Chartreuse" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "M / Electric Chartreuse",
          sku: "AFK-DS-CHA-M",
          manage_inventory: true,
          options: { Size: "M", Color: "Electric Chartreuse" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "L / Electric Chartreuse",
          sku: "AFK-DS-CHA-L",
          manage_inventory: true,
          options: { Size: "L", Color: "Electric Chartreuse" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XL / Electric Chartreuse",
          sku: "AFK-DS-CHA-XL",
          manage_inventory: true,
          options: { Size: "XL", Color: "Electric Chartreuse" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
        {
          title: "XXL / Electric Chartreuse (Out of Stock Test Variant)",
          sku: "AFK-DS-CHA-XXL",
          manage_inventory: true,
          options: { Size: "XXL", Color: "Electric Chartreuse" },
          prices: [
            { amount: 1450, currency_code: "bdt" },
            { amount: 13, currency_code: "usd" },
          ],
        },
      ],
      sales_channels: [{ id: defaultSalesChannel.id }],
    })
  }

  if (productsToCreate.length > 0) {
    logger.info(`Creating ${productsToCreate.length} AFK THEORY sample draft product...`)
    await createProductsWorkflow(container).run({
      input: {
        products: productsToCreate,
      },
    })
    logger.info("AFK THEORY draft product fixture created successfully.")
  } else {
    logger.info("AFK THEORY drop shoulder product already present in catalog.")
  }

  // 16. Inventory Allocation per Variant
  logger.info("Assigning variant inventory levels to Dhaka Central Warehouse...")
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.id", "location_levels.location_id"],
  })

  const inventoryLevelsToCreate: any[] = []
  for (const item of inventoryItems) {
    const hasLevel = item.location_levels?.some(
      (lvl: any) => lvl?.location_id === stockLocation.id
    )
    if (!hasLevel && item.sku) {
      const stockQty = skuStockMap[item.sku] ?? 25
      inventoryLevelsToCreate.push({
        location_id: stockLocation.id,
        stocked_quantity: stockQty,
        inventory_item_id: item.id,
      })
    }
  }

  if (inventoryLevelsToCreate.length > 0) {
    logger.info(`Creating ${inventoryLevelsToCreate.length} inventory location levels...`)
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: inventoryLevelsToCreate,
      },
    })
    logger.info("Inventory levels allocated successfully.")
  } else {
    logger.info("All inventory items already have assigned location levels.")
  }

  logger.info("==================================================")
  logger.info("AFK THEORY store seed completed successfully!")
  logger.info(`Store Name: AFK THEORY`)
  logger.info(`Sales Channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)
  logger.info(`Publishable Key: ${publishableApiKey.id}`)
  logger.info("==================================================")
}

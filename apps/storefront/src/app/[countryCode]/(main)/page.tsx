import { Metadata } from "next"
import { constructMetadata } from "@lib/util/seo"
import { listProducts } from "@lib/data/products"
import { listCategories } from "@lib/data/categories"
import { getCampaignSlides, getAnnouncementBar } from "@lib/data/campaign"
import { getRegion } from "@lib/data/regions"
import { HomeView } from "@dtc/storefront-ui"
import { createMedusaRoutes } from "@adapters/medusa/routes"
import { toCategoryView, toProductView } from "@adapters/medusa/catalog"
import { DEFAULT_MEDUSA_CAPABILITIES } from "@dtc/commerce-contracts"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "AFK THEORY | Pause The Game. Keep Your Style.",
    description:
      "Modern, independent, premium-accessible streetwear engineered for Bangladesh. Offline by choice. Explore oversized drop shoulder t-shirts and contemporary street essentials.",
    canonical: `/${countryCode}`,
  })
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params
  const { countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const routes = createMedusaRoutes(countryCode)

  const [productCategories, productsResult, campaignSlides, announcement] = await Promise.all([
    listCategories(),
    listProducts({
      countryCode,
      queryParams: { limit: 12 },
    }),
    getCampaignSlides(),
    getAnnouncementBar(),
  ])

  const featuredProducts = (productsResult.response.products || []).map((p) =>
    toProductView(p, region.currency_code)
  )
  const categories = (productCategories || []).map(toCategoryView)

  return (
    <HomeView
      featuredProducts={featuredProducts}
      categories={categories}
      routes={routes}
      capabilities={DEFAULT_MEDUSA_CAPABILITIES}
      campaignSlides={campaignSlides}
      announcement={announcement}
    />
  )
}

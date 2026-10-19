import { Metadata } from "next"
import { constructMetadata, getBreadcrumbSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import { AboutView } from "@dtc/storefront-ui"
import { createMedusaRoutes } from "../../../../adapters/medusa/routes"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "About The Theory | AFK THEORY",
    description:
      "The philosophy of AFK THEORY: Away From Keyboard. Modern independent streetwear, signature drop shoulder silhouettes, and offline culture.",
    canonical: `/${countryCode}/about`,
  })
}

export default async function AboutPage(props: Props) {
  const { countryCode } = await props.params
  const routes = createMedusaRoutes(countryCode)

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "About Us", url: `/${countryCode}/about` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <AboutView routes={routes} />
    </>
  )
}

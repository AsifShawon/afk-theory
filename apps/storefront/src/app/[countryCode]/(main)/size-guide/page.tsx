import { Metadata } from "next"
import { constructMetadata, getBreadcrumbSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import { SizeGuideView } from "@dtc/storefront-ui"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "Size & Fit Architecture | AFK THEORY",
    description:
      "Comprehensive size charts and fit guide for AFK THEORY oversized drop shoulder T-shirts and streetwear apparel in Bangladesh.",
    canonical: `/${countryCode}/size-guide`,
  })
}

export default async function SizeGuidePage(props: Props) {
  const { countryCode } = await props.params

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "Size Guide", url: `/${countryCode}/size-guide` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <SizeGuideView />
    </>
  )
}

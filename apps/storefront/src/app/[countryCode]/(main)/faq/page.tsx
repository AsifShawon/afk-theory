import { Metadata } from "next"
import { constructMetadata, getBreadcrumbSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import { FaqView } from "@dtc/storefront-ui"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "Frequently Asked Questions (FAQ) | AFK THEORY",
    description:
      "Answers regarding AFK THEORY orders, nationwide Cash on Delivery, delivery timelines, drop shoulder sizing, and streetwear drops in Bangladesh.",
    canonical: `/${countryCode}/faq`,
  })
}

export default async function FAQPage(props: Props) {
  const { countryCode } = await props.params

  const breadcrumbs = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "FAQ", url: `/${countryCode}/faq` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbs} />
      <FaqView contactHref={`/${countryCode}/contact`} />
    </>
  )
}

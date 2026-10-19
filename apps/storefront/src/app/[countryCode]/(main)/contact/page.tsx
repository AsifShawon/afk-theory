import { Metadata } from "next"
import { constructMetadata, getBreadcrumbSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import { ContactView } from "@dtc/storefront-ui"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "Contact Support | AFK THEORY",
    description:
      "Get in touch with AFK THEORY customer care in Dhaka, Bangladesh. Assistance with orders, sizing, drop shoulder streetwear, and delivery.",
    canonical: `/${countryCode}/contact`,
  })
}

export default async function ContactPage(props: Props) {
  const { countryCode } = await props.params

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "Contact", url: `/${countryCode}/contact` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <ContactView
        shippingPolicyHref={`/${countryCode}/shipping-policy`}
        returnPolicyHref={`/${countryCode}/return-policy`}
        faqHref={`/${countryCode}/faq`}
      />
    </>
  )
}

import { Metadata } from "next"
import { constructMetadata, getBreadcrumbSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import { PolicyView } from "@dtc/storefront-ui"
import { createMedusaRoutes } from "../../../../adapters/medusa/routes"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "Privacy Policy | AFK THEORY",
    description:
      "Learn how AFK THEORY collects, protects, and manages customer information and data security in Bangladesh.",
    canonical: `/${countryCode}/privacy-policy`,
  })
}

const PRIVACY_SECTIONS = [
  {
    title: "1. Information We Collect",
    content: (
      <p>
        When you purchase or register on AFK THEORY, we collect essential contact information (name, delivery address, phone number, and email address) required for courier dispatch and delivery confirmations.
      </p>
    ),
  },
  {
    title: "2. Payment Data Security",
    content: (
      <p>
        Orders are delivered nationwide on a Cash on Delivery (COD) basis. We do not store sensitive payment credentials on our servers.
      </p>
    ),
  },
  {
    title: "3. Logistics & Delivery Sharing",
    content: (
      <p>
        Your name, phone number, and shipping address are securely shared with our vetted courier partners (Steadfast, Pathao, Paperfly) exclusively to fulfill your doorstep delivery and communicate tracking status.
      </p>
    ),
  },
  {
    title: "4. Your Rights",
    content: (
      <p>
        You have the right to request access to, correction of, or deletion of your personal data stored with AFK THEORY. Contact us at <strong>support@afktheory.com</strong> for any data privacy requests.
      </p>
    ),
  },
]

export default async function PrivacyPolicyPage(props: Props) {
  const { countryCode } = await props.params
  const routes = createMedusaRoutes(countryCode)

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "Privacy Policy", url: `/${countryCode}/privacy-policy` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <PolicyView
        badge="Data Protection & Security"
        title="Privacy Policy"
        subtitle="Your privacy and data security are fundamental to how we build our clothing brand."
        sections={PRIVACY_SECTIONS}
        routes={routes}
      />
    </>
  )
}

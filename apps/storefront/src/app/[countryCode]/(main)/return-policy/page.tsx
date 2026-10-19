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
    title: "Return & Refund Policy | AFK THEORY",
    description:
      "Information on our return and exchange policy and refund process for AFK THEORY clothing in Bangladesh.",
    canonical: `/${countryCode}/return-policy`,
  })
}

const RETURN_SECTIONS = [
  {
    title: "1. Door-to-Door Exchange Guarantee",
    content: (
      <p>
        If your garment does not fit as expected, request a size exchange within 48 hours of delivery handover. For addresses inside Dhaka, our courier will deliver the replacement size directly to your doorstep while collecting the original garment.
      </p>
    ),
  },
  {
    title: "2. Eligibility & Garment Condition",
    content: (
      <div className="space-y-2">
        <p>To qualify for a return or exchange, garments must:</p>
        <ul className="list-disc list-inside space-y-1 pl-2">
          <li>Be unworn, unwashed, and undamaged</li>
          <li>Have all original AFK THEORY woven brand tags attached</li>
          <li>Be returned in original brand packaging</li>
        </ul>
      </div>
    ),
  },
  {
    title: "3. Refund Processing",
    content: (
      <p>
        For Cash on Delivery orders, approved refunds are issued via bKash, Nagad, or bank transfer within 3–5 business days following warehouse inspection.
      </p>
    ),
  },
  {
    title: "4. How to Initiate a Return",
    content: (
      <p>
        Email <strong>support@afktheory.com</strong> with your Order ID, parcel photo, and requested replacement size.
      </p>
    ),
  },
]

export default async function ReturnPolicyPage(props: Props) {
  const { countryCode } = await props.params
  const routes = createMedusaRoutes(countryCode)

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", url: `/${countryCode}` },
    { name: "Return & Refund Policy", url: `/${countryCode}/return-policy` },
  ])

  return (
    <>
      <JsonLd data={breadcrumbsSchema} />
      <PolicyView
        badge="Peace of Mind Guarantee"
        title="24-Hour Return & Refund Policy"
        subtitle="We want you to feel confident in every stitch. If the size or fit isn't perfect, we make returns and exchanges straightforward."
        sections={RETURN_SECTIONS}
        routes={routes}
      />
    </>
  )
}

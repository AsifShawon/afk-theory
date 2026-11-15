import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getRegion } from "@lib/data/regions"
import WishlistClient from "@modules/wishlist/components/wishlist-client"
import { constructMetadata } from "@lib/util/seo"

type Props = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { countryCode } = await props.params

  return constructMetadata({
    title: "Wishlist | AFK THEORY",
    description: "View and manage your saved AFK THEORY streetwear garments.",
    canonical: `/${countryCode}/wishlist`,
  })
}

export default async function WishlistPage(props: Props) {
  const { countryCode } = await props.params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  return (
    <WishlistClient
      countryCode={countryCode}
      currencyCode={region.currency_code}
    />
  )
}

import { retrieveCustomer } from "@lib/data/customer"
import { constructMetadata } from "@lib/util/seo"
import AccountLayout from "@modules/account/templates/account-layout"
import { Metadata } from "next"

export const metadata: Metadata = constructMetadata({
  title: "Account | AFK THEORY",
  description: "Manage your AFK THEORY customer profile, orders, and addresses.",
  noIndex: true,
})

export default async function AccountPageLayout({
  dashboard,
  login,
}: {
  dashboard?: React.ReactNode
  login?: React.ReactNode
}) {
  const customer = await retrieveCustomer().catch(() => null)

  return (
    <AccountLayout customer={customer}>
      {customer ? dashboard : login}
      {/* TODO: Re-add Toaster component when needed */}
    </AccountLayout>
  )
}

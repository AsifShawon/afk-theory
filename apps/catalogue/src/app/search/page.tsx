import type { Metadata } from "next"
import { SearchPage } from "@/components/search/search-page"
import { ListingShell } from "@/components/shop/listing-hero"
import { getCatalogue } from "@/lib/catalogue"

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false, follow: true },
}

export default async function Search() {
  const catalogue = await getCatalogue()
  return (
    <ListingShell>
      <h1 className="sr-only">Search</h1>
      <SearchPage index={catalogue.searchIndex} suggestions={catalogue.categoryTree.map((n) => ({ name: n.name, href: n.href }))} />
    </ListingShell>
  )
}

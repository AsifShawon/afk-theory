import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Footer as SharedFooter } from "@dtc/storefront-ui"

/**
 * Footer links come from the catalog structure (two product lines and the
 * hoodie styles) in @dtc/commerce-contracts, not from whatever categories happen
 * to exist in the database.
 */
export default async function Footer() {
  return <SharedFooter homeHref="/" linkComponent={LocalizedClientLink} />
}

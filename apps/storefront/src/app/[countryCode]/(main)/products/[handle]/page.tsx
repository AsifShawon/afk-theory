import { Metadata } from "next"
import { notFound } from "next/navigation"
import { listAllProducts, listProducts } from "@lib/data/products"
import { getRegion, listRegions } from "@lib/data/regions"
import { getSeoOverrides } from "@dtc/commerce-contracts"
import { constructMetadata, getBreadcrumbSchema, getProductSchema } from "@lib/util/seo"
import JsonLd from "@modules/common/components/json-ld"
import ProductTemplate from "@modules/products/templates"

type Props = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateStaticParams() {
  try {
    const countryCodes = await listRegions().then((regions) =>
      regions?.map((r) => r.countries?.map((c) => c.iso_2)).flat()
    )

    if (!countryCodes) {
      return []
    }

    const promises = countryCodes
      .filter((country): country is string => Boolean(country))
      .map(async (country) => {
      const products = await listAllProducts({
        countryCode: country,
        fields: "handle",
      })

      return {
        country,
        products,
      }
    })

    const countryProducts = await Promise.all(promises)

    return countryProducts
      .flatMap((countryData) =>
        countryData.products.map((product) => ({
          countryCode: countryData.country,
          handle: product.handle,
        }))
      )
      .filter((param) => param.handle)
  } catch (error) {
    console.error(
      `Failed to generate static paths for product pages: ${
        error instanceof Error ? error.message : "Unknown error"
      }.`
    )
    return []
  }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params
  const { handle, countryCode } = params
  const region = await getRegion(countryCode)

  if (!region) {
    notFound()
  }

  const product = await listProducts({
    countryCode,
    queryParams: { handle },
  }).then(({ response }) => response.products[0])

  if (!product) {
    notFound()
  }

  // Owner-written SEO text (admin: product > SEO) wins; otherwise fall back to the product copy.
  const seo = getSeoOverrides(product.metadata)
  const title = seo.title || product.title
  const description =
    seo.description ||
    product.description ||
    product.subtitle ||
    `${product.title} - Modern independent streetwear crafted with premium high-density cotton for Bangladesh.`

  const imageUrl = product.thumbnail || product.images?.[0]?.url

  return constructMetadata({
    title,
    description,
    image: imageUrl,
    canonical: `/${countryCode}/products/${handle}`,
  })
}

export default async function ProductPage(props: Props) {
  const params = await props.params
  const region = await getRegion(params.countryCode)

  if (!region) {
    notFound()
  }

  const pricedProduct = await listProducts({
    countryCode: params.countryCode,
    queryParams: { handle: params.handle },
  }).then(({ response }) => response.products[0])

  if (!pricedProduct) {
    notFound()
  }

  const productSchema = getProductSchema({
    product: pricedProduct,
    region,
    countryCode: params.countryCode,
  })

  const breadcrumbsSchema = getBreadcrumbSchema([
    { name: "Home", url: `/${params.countryCode}` },
    { name: "Clothing", url: `/${params.countryCode}/store` },
    {
      name: pricedProduct.title,
      url: `/${params.countryCode}/products/${pricedProduct.handle}`,
    },
  ])

  return (
    <>
      <JsonLd data={[productSchema, breadcrumbsSchema]} />
      <ProductTemplate
        product={pricedProduct}
        region={region}
        countryCode={params.countryCode}
      />
    </>
  )
}

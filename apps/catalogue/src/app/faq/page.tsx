import type { Metadata } from "next"
import { Faq } from "@/components/home/faq"
import { getCatalogue } from "@/lib/catalogue"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Ordering, delivery, payment and sizes at AFK THEORY.",
  alternates: { canonical: "/faq/" },
}

export default async function FaqPage() {
  const catalogue = await getCatalogue()
  const faq = catalogue.settings.faq

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  }

  return (
    <div className="bg-brand-bone pt-16">
      {faq.length > 0 ? (
        <>
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
          <Faq items={faq} headingLevel={1} />
        </>
      ) : (
        <div className="mx-auto max-w-editorial px-5 py-28 text-brand-graphite md:px-10">
          <h1 className="display text-6xl">FAQ</h1>
          <p className="mt-4 text-brand-olive">Questions are coming soon. Ask us anything on WhatsApp or Messenger.</p>
        </div>
      )}
    </div>
  )
}

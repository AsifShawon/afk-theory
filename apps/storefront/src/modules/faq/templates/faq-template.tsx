"use client"

import { useState } from "react"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import * as Accordion from "@radix-ui/react-accordion"
import ChevronDown from "@modules/common/icons/chevron-down"

export const FAQ_DATA = [
  {
    category: "Orders & Account",
    questions: [
      {
        question: "How do I place an order on AFK THEORY?",
        answer:
          "Browse our drop catalog, select your desired size and color variant, and click 'Add to Bag'. Proceed to the checkout page where you can enter your delivery address and confirm your Cash on Delivery (COD) order.",
      },
      {
        question: "Do I need to create an account to purchase?",
        answer:
          "No, you can check out as a guest. However, creating an account allows you to track real-time dispatch status, manage delivery addresses, and access member drops.",
      },
      {
        question: "Can I modify or cancel my order after placing it?",
        answer:
          "Orders are processed rapidly in our Dhaka fulfillment hub. If you need to change your size or delivery address, please email support@afktheory.com within 1 hour of placing your order.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    questions: [
      {
        question: "What are the delivery charges and timelines across Bangladesh?",
        answer:
          "Inside Dhaka: ৳60 standard delivery (24–48 hours). Dhaka Suburban (Savar, Gazipur, Keraniganj): ৳100 (2–3 business days). Outside Dhaka (All 64 districts): ৳130 (3–5 business days).",
      },
      {
        question: "How can I track my package?",
        answer:
          "As soon as your order is dispatched from our Dhaka warehouse, you will receive an SMS and email notification with your live courier tracking link.",
      },
      {
        question: "Do you offer international shipping?",
        answer:
          "Currently, AFK THEORY exclusively serves customers located in Bangladesh with express domestic delivery.",
      },
    ],
  },
  {
    category: "Exchanges & Returns",
    questions: [
      {
        question: "What is the AFK THEORY exchange window?",
        answer:
          "We offer a 48-hour return and size exchange guarantee from the moment of delivery handover. The item must be unworn, unwashed, with all original tags attached.",
      },
      {
        question: "How do I request a size exchange?",
        answer:
          "Email support@afktheory.com with your Order ID and photo of the tag within 48 hours. Our courier partner will collect the return garment from your doorstep and deliver the replacement size.",
      },
      {
        question: "How are refunds processed?",
        answer:
          "For Cash on Delivery orders, refunds are disbursed via bKash, Nagad, or bank transfer within 3–5 business days following quality inspection at our Dhaka fulfillment center.",
      },
    ],
  },
  {
    category: "Fabrics & Sizing",
    questions: [
      {
        question: "What makes AFK THEORY Drop Shoulder tees unique?",
        answer:
          "We engineer all core garments using dense heavyweight compact cotton and intentional dropped shoulder seams. This ensures zero cling, structured drape, and resilience against shrinkage.",
      },
      {
        question: "How do I choose the correct size?",
        answer:
          "Our tees feature an oversized, relaxed streetwear fit. Please refer to our interactive Size & Fit Guide for detailed chest, length, and shoulder drop measurements in both inches and centimeters.",
      },
      {
        question: "How should I wash and care for my heavyweight garments?",
        answer:
          "Machine wash cold (under 30°C) inside out with like colors. Line dry in the shade to preserve garment shape and color intensity. Do not tumble dry.",
      },
    ],
  },
  {
    category: "Payment Methods",
    questions: [
      {
        question: "Is Cash on Delivery (COD) available?",
        answer:
          "Yes! Cash on Delivery is the launch payment method across all 64 districts in Bangladesh. You pay cash directly to the delivery courier upon arrival.",
      },
    ],
  },
]

export default function FAQTemplate() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("All")

  const categories = ["All", ...FAQ_DATA.map((c) => c.category)]

  const filteredCategories = FAQ_DATA.map((cat) => {
    if (selectedCategory !== "All" && cat.category !== selectedCategory) {
      return null
    }

    const matchedQuestions = cat.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (matchedQuestions.length === 0) return null

    return {
      ...cat,
      questions: matchedQuestions,
    }
  }).filter(Boolean) as typeof FAQ_DATA

  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <div className="bg-brand-secondary border-b border-brand-border py-12 sm:py-16">
        <div className="content-container max-w-4xl text-center space-y-4">
          <span className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-accent">
            Assistance &amp; Knowledge Base
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-primary">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-brand-primary/70 max-w-xl mx-auto leading-relaxed">
            Everything you need to know about AFK THEORY garments, Dhaka fulfillment, size exchanges, and fabric care.
          </p>

          {/* Search Box */}
          <div className="max-w-md mx-auto pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions (e.g., shipping, returns, 240 GSM)..."
                className="w-full px-4 py-3 bg-white border border-brand-border text-xs text-brand-primary placeholder:text-brand-muted/80 focus:outline-none focus:border-brand-primary shadow-sm"
                aria-label="Search frequently asked questions"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-xs text-brand-muted hover:text-brand-primary"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="content-container max-w-3xl py-12 sm:py-16 space-y-10">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 text-xs font-heading uppercase tracking-wider transition-colors border ${
                selectedCategory === cat
                  ? "bg-brand-primary text-white border-brand-primary"
                  : "bg-brand-secondary text-brand-primary border-brand-border hover:bg-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Review Notice */}
        <div className="p-4 bg-brand-secondary/60 border border-brand-border text-[11px] text-brand-primary/70">
          <span className="font-bold text-brand-primary uppercase block">
            ⚠️ Policy Callout Notice
          </span>
          [REVIEW REQUIRED: Business-owner / Legal Counsel confirmation needed for exact delivery rates (৳60/৳100/৳130) and 24h return window policy specifics.]
        </div>

        {/* FAQ Accordion */}
        {filteredCategories.length > 0 ? (
          <div className="space-y-8">
            {filteredCategories.map((group, groupIdx) => (
              <div key={group.category} className="space-y-4">
                <h2 className="font-display text-xl sm:text-2xl text-brand-primary border-b border-brand-border/80 pb-2">
                  {group.category}
                </h2>

                <Accordion.Root type="multiple" className="space-y-3">
                  {group.questions.map((item, itemIdx) => {
                    const valueId = `faq-${groupIdx}-${itemIdx}`
                    return (
                      <Accordion.Item
                        key={valueId}
                        value={valueId}
                        className="border border-brand-border bg-brand-card overflow-hidden transition-colors"
                      >
                        <Accordion.Header className="flex">
                          <Accordion.Trigger className="flex flex-1 items-center justify-between p-4 text-left text-xs sm:text-sm font-semibold text-brand-primary hover:text-brand-accent transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent">
                            <span>{item.question}</span>
                            <ChevronDown className="w-4 h-4 text-brand-primary/60 transition-transform duration-200 group-data-[state=open]:rotate-180 flex-shrink-0 ml-2" />
                          </Accordion.Trigger>
                        </Accordion.Header>
                        <Accordion.Content className="p-4 pt-0 text-xs sm:text-sm text-brand-primary/80 leading-relaxed border-t border-brand-border/40 mt-1 bg-white">
                          <p>{item.answer}</p>
                        </Accordion.Content>
                      </Accordion.Item>
                    )
                  })}
                </Accordion.Root>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-medium text-brand-primary">
              No answers found matching &quot;{searchQuery}&quot;
            </p>
            <button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
              }}
              className="text-xs text-brand-accent hover:underline uppercase tracking-wider"
            >
              Clear filters and view all questions →
            </button>
          </div>
        )}

        {/* Support CTA */}
        <div className="pt-8 border-t border-brand-border/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-brand-secondary/40 p-6 border border-brand-border">
          <div>
            <h3 className="font-bold text-sm text-brand-primary">Have an unanswered question?</h3>
            <p className="text-xs text-brand-primary/70">
              Our customer care team in Dhaka responds within 4 business hours.
            </p>
          </div>
          <LocalizedClientLink
            href="/contact"
            className="px-6 py-2.5 bg-brand-primary text-white text-xs font-heading font-semibold uppercase tracking-wider hover:bg-black whitespace-nowrap"
          >
            Contact Customer Care →
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}

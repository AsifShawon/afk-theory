"use client"

import React, { useState } from "react"
import Link from "next/link"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ChevronDownIcon, MagnifyingGlassIcon } from "../../components/icons"
import { LinkComponent } from "../../types"

export interface FaqItem {
  question: string
  answer: string
}

export interface FaqCategory {
  category: string
  questions: FaqItem[]
}

export const DEFAULT_FAQ_DATA: FaqCategory[] = [
  {
    category: "Orders & Account",
    questions: [
      {
        question: "How do I place an order on AFK THEORY?",
        answer:
          "Browse our drop catalog, select your size and color variant, and click 'Add to Bag'. Complete checkout with direct Cash on Delivery (COD) anywhere in Bangladesh.",
      },
      {
        question: "Do I need to create an account to purchase?",
        answer:
          "No, guest checkout is supported. However, creating an account lets you track your parcel status, save addresses, and access member drops.",
      },
      {
        question: "Can I modify or cancel my order after placing it?",
        answer:
          "Orders are processed rapidly in our Dhaka fulfillment hub. If you need to modify your size or address, please email support@afktheory.com immediately with your Order ID.",
      },
    ],
  },
  {
    category: "Shipping & Delivery",
    questions: [
      {
        question: "What are the delivery charges and timelines across Bangladesh?",
        answer:
          "Inside Dhaka: ৳60 (24–48 hours). Dhaka Suburban (Savar, Gazipur, Keraniganj): ৳100 (2–3 business days). Outside Dhaka (All 64 districts): ৳130 (3–5 business days).",
      },
      {
        question: "How can I track my package?",
        answer:
          "Once your parcel is dispatched from our Dhaka warehouse, you will receive an SMS and email notification with your live courier tracking link.",
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
          "We offer a 48-hour size exchange guarantee from the moment of delivery handover. The item must be unworn, unwashed, with all original tags attached.",
      },
      {
        question: "How do I request a size exchange?",
        answer:
          "Email support@afktheory.com with your Order ID, parcel photo, and requested replacement size. For addresses inside Dhaka, doorstep exchange is available.",
      },
    ],
  },
  {
    category: "Streetwear Fit & Fabric",
    questions: [
      {
        question: "How does the Drop Shoulder silhouette fit?",
        answer:
          "AFK THEORY Drop Shoulder tees feature relaxed, lowered shoulder seams, a boxy chest width, and a structured drape. Choose your standard size for the intended streetwear fit, or size down if you prefer a closer cut.",
      },
      {
        question: "How should I wash AFK THEORY garments?",
        answer:
          "Machine wash cold (30°C or below) inside out with similar dark tones. Do not bleach or tumble dry on high heat. Warm iron on the reverse side.",
      },
    ],
  },
  {
    category: "Payment Methods",
    questions: [
      {
        question: "Which payment options are supported at launch?",
        answer:
          "At launch, Cash on Delivery (COD) is the exclusive payment method across all 64 districts of Bangladesh. You pay cash directly to the delivery agent upon receiving your package.",
      },
    ],
  },
]

export interface FaqViewProps {
  faqData?: FaqCategory[]
  routes?: StoreRoutes
  contactHref?: string
  linkComponent?: LinkComponent
}

export function FaqView({
  faqData = DEFAULT_FAQ_DATA,
  routes,
  contactHref,
  linkComponent: LinkComp = Link,
}: FaqViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ "0-0": true })

  const toggleItem = (key: string) => {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const filteredCategories = faqData
    .map((cat) => ({
      ...cat,
      questions: cat.questions.filter(
        (q) =>
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((cat) => cat.questions.length > 0)

  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <div className="bg-brand-secondary border-b border-brand-border py-12 sm:py-16">
        <div className="content-container max-w-3xl text-center space-y-4">
          <span className="text-xs font-heading font-semibold uppercase tracking-widest text-brand-accent">
            Support &amp; Community Help
          </span>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl text-brand-primary">
            Frequently Asked Questions
          </h1>
          <p className="text-xs sm:text-sm text-brand-primary/70 max-w-xl mx-auto">
            Find quick answers regarding Dhaka dispatch, drop shoulder fits, nationwide Cash on Delivery, and size exchanges.
          </p>

          <div className="pt-2 max-w-md mx-auto relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-brand-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search answers (e.g. shipping, return, 240 GSM)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-brand-border text-xs text-brand-primary focus:outline-none focus:border-brand-primary"
            />
          </div>
        </div>
      </div>

      {/* Main FAQ Accordions */}
      <div className="content-container max-w-3xl py-12 sm:py-16 space-y-10">
        {filteredCategories.length === 0 ? (
          <div className="py-12 text-center text-xs text-brand-muted">
            No questions found matching &quot;{searchQuery}&quot;. Please contact client care.
          </div>
        ) : (
          filteredCategories.map((cat, catIdx) => (
            <div key={cat.category} className="space-y-4">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wider text-brand-primary border-b border-brand-border pb-2">
                {cat.category}
              </h2>

              <div className="divide-y divide-brand-border border border-brand-border bg-white">
                {cat.questions.map((item, qIdx) => {
                  const key = `${catIdx}-${qIdx}`
                  const isOpen = !!openItems[key]

                  return (
                    <div key={item.question}>
                      <button
                        type="button"
                        onClick={() => toggleItem(key)}
                        className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-brand-surface transition-colors"
                      >
                        <span className="font-heading font-semibold text-xs text-brand-primary">
                          {item.question}
                        </span>
                        <ChevronDownIcon
                          className={`w-4 h-4 text-brand-muted transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-4 pb-4 text-xs text-brand-muted leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        {/* Support Banner */}
        <div className="p-6 bg-brand-surface border border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-muted">
          <div>
            <span className="font-heading font-bold text-brand-primary block">
              Still need personalized assistance?
            </span>
            <p className="text-[11px] mt-0.5">
              Our Dhaka client advisors respond within 4 business hours.
            </p>
          </div>
          <LinkComp
            href={contactHref || (routes ? routes.contact() : "/contact")}
            className="px-5 py-2.5 bg-brand-primary text-white font-heading font-semibold uppercase tracking-wider text-xs hover:bg-black transition-colors"
          >
            Contact Customer Support
          </LinkComp>
        </div>
      </div>
    </div>
  )
}

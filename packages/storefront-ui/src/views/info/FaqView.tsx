"use client"

import React, { useState } from "react"
import Link from "next/link"
import { StoreRoutes } from "@dtc/commerce-contracts"
import { ChevronDownIcon, MagnifyingGlassIcon } from "../../components/icons"
import { LinkComponent } from "../../types"

import {
  FaqItem,
  FaqCategory,
  DEFAULT_FAQ_DATA,
} from "./faq-data"

export type { FaqItem, FaqCategory }
export { DEFAULT_FAQ_DATA }

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

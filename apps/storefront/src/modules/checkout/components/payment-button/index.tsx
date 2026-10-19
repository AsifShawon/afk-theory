"use client"

import { isManual, isStripeLike } from "@lib/constants"
import { placeOrder } from "@lib/data/cart"
import { HttpTypes } from "@medusajs/types"
import Spinner from "@modules/common/icons/spinner"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { useParams } from "next/navigation"
import React, { useRef, useState } from "react"
import ErrorMessage from "../error-message"

type PaymentButtonProps = {
  cart: HttpTypes.StoreCart
  "data-testid": string
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  cart,
  "data-testid": dataTestId,
}) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    (cart.shipping_methods?.length ?? 0) < 1

  const paymentSession = cart.payment_collection?.payment_sessions?.[0]

  switch (true) {
    case isStripeLike(paymentSession?.provider_id):
      return (
        <StripePaymentButton
          notReady={notReady}
          cart={cart}
          data-testid={dataTestId}
        />
      )
    case isManual(paymentSession?.provider_id):
      return (
        <ManualTestPaymentButton notReady={notReady} data-testid={dataTestId} />
      )
    default:
      return (
        <button
          disabled
          className="w-full py-4 bg-brand-border text-brand-muted text-xs font-heading font-semibold uppercase tracking-widest cursor-not-allowed"
        >
          Select a payment method
        </button>
      )
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
  "data-testid": dataTestId,
}: {
  cart: HttpTypes.StoreCart
  notReady: boolean
  "data-testid"?: string
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  const onPaymentCompleted = async () => {
    try {
      await placeOrder()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to place order.")
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const stripe = useStripe()
  const elements = useElements()
  const { countryCode } = useParams()

  const disabled = !stripe || !elements || notReady || submitting

  const handlePayment = async () => {
    if (!stripe || !elements || !cart || isSubmittingRef.current) {
      return
    }

    isSubmittingRef.current = true
    setSubmitting(true)
    setErrorMessage(null)

    await stripe
      .confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/api/payment-return?cart_id=${cart.id}&country_code=${countryCode}`,
          payment_method_data: {
            billing_details: {
              name:
                cart.billing_address?.first_name +
                " " +
                cart.billing_address?.last_name,
              address: {
                city: cart.billing_address?.city ?? undefined,
                country: cart.billing_address?.country_code ?? undefined,
                line1: cart.billing_address?.address_1 ?? undefined,
                line2: cart.billing_address?.address_2 ?? undefined,
                postal_code: cart.billing_address?.postal_code ?? undefined,
                state: cart.billing_address?.province ?? undefined,
              },
              email: cart.email,
              phone: cart.billing_address?.phone ?? undefined,
            },
          },
        },
        redirect: "if_required",
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
            return
          }

          setErrorMessage(error.message || "Stripe authorization failed.")
          setSubmitting(false)
          isSubmittingRef.current = false
          return
        }

        if (
          paymentIntent.status === "requires_capture" ||
          paymentIntent.status === "succeeded"
        ) {
          onPaymentCompleted()
          return
        }

        setSubmitting(false)
        isSubmittingRef.current = false
      })
      .catch((err) => {
        setErrorMessage(err?.message || "Payment confirmation failed.")
        setSubmitting(false)
        isSubmittingRef.current = false
      })
  }

  return (
    <div className="space-y-3">
      <button
        disabled={disabled}
        onClick={handlePayment}
        data-testid={dataTestId}
        className="w-full py-4 bg-brand-primary hover:bg-black text-white text-xs font-heading font-semibold uppercase tracking-widest transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {submitting && <Spinner className="animate-spin text-white" />}
        <span>{submitting ? "Processing Order..." : "Place Order (Stripe)"}</span>
      </button>
      <ErrorMessage
        error={errorMessage}
        data-testid="stripe-payment-error-message"
      />
    </div>
  )
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isSubmittingRef = useRef(false)

  const handlePayment = async () => {
    if (isSubmittingRef.current || notReady) {
      return
    }

    isSubmittingRef.current = true
    setSubmitting(true)
    setErrorMessage(null)

    try {
      await placeOrder()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error placing Cash on Delivery order.")
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  return (
    <div className="space-y-3">
      <div className="p-4 bg-brand-surface border border-brand-border text-xs text-brand-primary/90 space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold uppercase tracking-wider text-brand-primary">
            Cash on Delivery
          </span>
          <span className="px-2 py-0.5 text-[10px] font-heading font-bold uppercase bg-brand-accent text-brand-primary">
            Verified COD
          </span>
        </div>
        <p className="text-[11px] text-brand-muted leading-relaxed">
          You will pay the courier in cash upon receiving your parcel at your doorstep. Please have the exact amount in BDT ready.
        </p>
      </div>

      <button
        disabled={notReady || submitting}
        onClick={handlePayment}
        data-testid="submit-order-button"
        className="w-full py-4 bg-brand-accent hover:bg-brand-accent-hover text-brand-primary text-xs font-heading font-bold uppercase tracking-widest transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
      >
        {submitting && <Spinner className="animate-spin text-brand-primary" />}
        <span>{submitting ? "Placing COD Order..." : "Confirm Order (Cash on Delivery) →"}</span>
      </button>

      <ErrorMessage
        error={errorMessage}
        data-testid="manual-payment-error-message"
      />
    </div>
  )
}

export default PaymentButton

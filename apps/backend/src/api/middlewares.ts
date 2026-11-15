import { defineMiddlewares, authenticate } from "@medusajs/medusa"
import {
  MedusaRequest,
  MedusaResponse,
  MedusaNextFunction,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import {
  validateDeliveryOptionForAddress,
  classifyAddress,
} from "./shipping-validator"

/**
 * Authoritative backend validation when customer or API selects a shipping method.
 * Guarantees that the option is compatible with the cart's saved shipping address.
 */
async function validateShippingMethodSelection(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const cartId = req.params.id
  const optionId = (req.body as { option_id?: string })?.option_id

  if (!optionId) {
    res.status(400).json({
      message: "Field 'option_id' is required.",
      type: "invalid_data",
    })
    return
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "shipping_address.*", "currency_code"],
    filters: { id: cartId },
  })

  const cart = carts[0]
  if (!cart) {
    res.status(404).json({
      message: `Cart with id ${cartId} not found.`,
      type: "not_found",
    })
    return
  }

  if (!cart.shipping_address) {
    res.status(400).json({
      message:
        "A shipping address must be saved on the cart before selecting a shipping method.",
      type: "invalid_data",
    })
    return
  }

  const countryCode = cart.shipping_address.country_code?.toLowerCase()
  if (countryCode === "bd") {
    const { data: options } = await query.graph({
      entity: "shipping_option",
      fields: ["id", "name", "data", "type.*"],
      filters: { id: optionId },
    })

    const option = options[0]
    if (!option) {
      res.status(404).json({
        message: `Shipping option with id ${optionId} not found.`,
        type: "not_found",
      })
      return
    }

    const check = validateDeliveryOptionForAddress(option as any, cart.shipping_address)
    if (!check.isValid) {
      res.status(400).json({
        message: check.message,
        type: "invalid_data",
      })
      return
    }
  }

  return next()
}

/**
 * Authoritative pre-completion gate.
 * Prevents completing orders that have invalid addresses, missing/incompatible shipping methods,
 * or uninitialized payment sessions.
 */
async function validateCartBeforeCompletion(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const cartId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "shipping_address.*",
      "shipping_methods.*",
      "shipping_methods.shipping_option.*",
      "payment_collection.payment_sessions.*",
    ],
    filters: { id: cartId },
  })

  const cart = carts[0]
  if (!cart) {
    res.status(404).json({
      message: `Cart with id ${cartId} not found.`,
      type: "not_found",
    })
    return
  }

  if (!cart.shipping_address) {
    res.status(400).json({
      message: "Cannot complete order: shipping address is missing.",
      type: "invalid_data",
    })
    return
  }

  if (!cart.shipping_methods || cart.shipping_methods.length === 0) {
    res.status(400).json({
      message: "Cannot complete order: delivery method is required.",
      type: "invalid_data",
    })
    return
  }

  const countryCode = cart.shipping_address.country_code?.toLowerCase()
  if (countryCode === "bd") {
    const addressCheck = classifyAddress(cart.shipping_address)
    if (!addressCheck.isValid) {
      res.status(400).json({
        message: `Cannot complete order: ${addressCheck.error}`,
        type: "invalid_data",
      })
      return
    }

    const selectedMethod = cart.shipping_methods?.[0]
    if (selectedMethod) {
      const option = (selectedMethod as any).shipping_option || {
        id: selectedMethod.shipping_option_id,
        name: selectedMethod.name,
        data: selectedMethod.data,
        type: null,
      }

      const check = validateDeliveryOptionForAddress(option as any, cart.shipping_address)
      if (!check.isValid) {
        res.status(400).json({
          message: `Cannot complete order: ${check.message}`,
          type: "invalid_data",
        })
        return
      }
    }
  }

  // Payment session verification
  const sessions = cart.payment_collection?.payment_sessions || []
  const hasValidSession = sessions.some(
    (s: any) => s && (s.status === "pending" || s.status === "authorized")
  )
  if (!hasValidSession) {
    res.status(400).json({
      message:
        "Cannot complete order: active payment session is required. Please confirm your Cash on Delivery payment.",
      type: "invalid_data",
    })
    return
  }

  return next()
}

/**
 * Address change revalidator.
 * When the cart shipping address changes, any existing incompatible shipping method is cleared
 * so that stale delivery methods cannot be accidentally reused.
 */
async function handleCartAddressChange(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  const body = req.body as { shipping_address?: Record<string, any> } | undefined
  if (!body?.shipping_address) {
    return next()
  }

  const cartId = req.params.id
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "shipping_methods.*", "shipping_methods.shipping_option.*"],
    filters: { id: cartId },
  })

  const cart = carts[0]
  if (cart?.shipping_methods && cart.shipping_methods.length > 0) {
    const newAddress = body.shipping_address
    const countryCode = (newAddress.country_code || "bd").toLowerCase()
    if (countryCode === "bd") {
      const selectedMethod = cart.shipping_methods[0]
      if (selectedMethod) {
        const option = (selectedMethod as any).shipping_option || {
          id: selectedMethod.shipping_option_id,
          name: selectedMethod.name,
          data: selectedMethod.data,
          type: null,
        }
        const check = validateDeliveryOptionForAddress(option, newAddress)
        if (!check.isValid) {
          // Incompatible shipping method detected after address change.
          // Delete the invalid shipping method so customer must re-select a valid zone rate.
          try {
            const cartModule = req.scope.resolve(Modules.CART)
            await (cartModule as any).deleteShippingMethods(
              cart.shipping_methods.filter(Boolean).map((m: any) => m.id)
            )
          } catch {
            // If deletion fails, completion check will still enforce revalidation
          }
        }
      }
    }
  }

  return next()
}

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/campaign-slides*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/admin/announcement-bar*",
      middlewares: [authenticate("user", ["session", "bearer", "api-key"])],
    },
    {
      matcher: "/store/carts/:id/shipping-methods",
      method: "POST",
      middlewares: [validateShippingMethodSelection],
    },
    {
      matcher: "/store/carts/:id/complete",
      method: "POST",
      middlewares: [validateCartBeforeCompletion],
    },
    {
      matcher: "/store/carts/:id",
      method: "POST",
      middlewares: [handleCartAddressChange],
    },
  ],
})

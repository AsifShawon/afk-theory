/**
 * Checkout orders, shared by the order endpoint (functions/api), the site's
 * checkout page and the local admin. Imported as "@dtc/catalogue-core/orders"
 * so the endpoint bundle stays small: nothing here pulls in Supabase or the
 * HTML sanitizer.
 */
export * from "./schema"
export * from "./pricing"
export * from "./emails"
export * from "./email-provider"
export * from "./proof-of-work"
export * from "./store"
export * from "./place-order"
export * from "./handlers"
export * from "./admin"
export * from "../custom-hoodie"

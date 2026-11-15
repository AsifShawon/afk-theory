import { model } from "@medusajs/framework/utils"

export const WishlistItem = model.define("wishlist_item", {
  id: model.id({ prefix: "wli" }).primaryKey(),
  customer_id: model.text().index("IDX_wishlist_customer"),
  product_id: model.text().index("IDX_wishlist_product"),
})

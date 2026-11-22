/**
 * POST /api/order: places a cash on delivery order.
 *
 * Cloudflare Pages Functions. Cloudflare reads functions/ from the project's
 * root directory (the repository root here) and runs it next to the static
 * site in apps/catalogue/out. All logic lives in
 * packages/catalogue-core/src/orders, where it is tested. The relative
 * import is on purpose: this folder is not a workspace package.
 */
import { handleOrderRequest, type OrderEndpointEnv } from "../../packages/catalogue-core/src/orders"

export const onRequestPost = (context: { request: Request; env: OrderEndpointEnv }) => handleOrderRequest(context.request, context.env)

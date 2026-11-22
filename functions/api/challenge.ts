/**
 * GET /api/challenge: a fresh spam-check puzzle for the checkout page.
 * See order.ts for how this folder is deployed.
 */
import { handleChallengeRequest, type OrderEndpointEnv } from "../../packages/catalogue-core/src/orders"

export const onRequestGet = (context: { request: Request; env: OrderEndpointEnv }) => handleChallengeRequest(context.request, context.env)

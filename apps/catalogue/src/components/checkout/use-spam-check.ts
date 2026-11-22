"use client"

import { useCallback, useEffect, useRef } from "react"
import { solveChallenge, type Challenge } from "@dtc/catalogue-core/orders"

/**
 * Fetches the checkout spam-check puzzle as soon as the page opens and solves
 * it in the background while the customer types, so Place order never waits.
 * `get()` resolves to the answer, or null when the order service is not
 * reachable (the page then offers WhatsApp).
 */
export function useSpamCheck() {
  const answer = useRef<Promise<string | null> | null>(null)
  const cancel = useRef<() => void>(() => {})

  const refresh = useCallback(() => {
    cancel.current()
    let cancelled = false
    cancel.current = () => {
      cancelled = true
    }
    answer.current = (async () => {
      try {
        const response = await fetch("/api/challenge", { cache: "no-store" })
        if (!response.ok) return null
        const challenge = (await response.json()) as Challenge
        const solution = await solveChallenge(challenge, () => cancelled)
        return solution ? btoa(JSON.stringify(solution)) : null
      } catch {
        return null
      }
    })()
    return answer.current
  }, [])

  useEffect(() => {
    void refresh()
    return () => cancel.current()
  }, [refresh])

  return { get: () => answer.current ?? refresh(), refresh }
}

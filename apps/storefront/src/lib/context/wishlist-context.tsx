"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useTransition,
} from "react"
import {
  getWishlist,
  addWishlistItem,
  removeWishlistItem,
  mergeGuestWishlist,
} from "@lib/data/wishlist"

const GUEST_STORAGE_KEY = "afk_guest_wishlist"

export interface WishlistContextType {
  wishlistIds: string[]
  isWishlisted: (productId: string) => boolean
  toggleWishlist: (productId: string) => Promise<void>
  wishlistCount: number
  isLoading: boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({
  children,
  customerId,
}: {
  children: React.ReactNode
  customerId?: string | null
}) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, startTransition] = useTransition()

  // Initialize wishlist based on customer authentication state
  useEffect(() => {
    let isMounted = true

    async function init() {
      try {
        if (customerId) {
          // Check for any guest items in localStorage to merge
          let guestIds: string[] = []
          try {
            const raw = localStorage.getItem(GUEST_STORAGE_KEY)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                guestIds = parsed.filter((id) => typeof id === "string")
              }
            }
          } catch {
            // Ignore parse errors
          }

          if (guestIds.length > 0) {
            await mergeGuestWishlist(guestIds)
            try {
              localStorage.removeItem(GUEST_STORAGE_KEY)
            } catch {}
          }

          const remote = await getWishlist()
          if (isMounted) {
            setWishlistIds(remote.product_ids || [])
          }
        } else {
          // Guest mode: load from localStorage
          try {
            const raw = localStorage.getItem(GUEST_STORAGE_KEY)
            if (raw) {
              const parsed = JSON.parse(raw)
              if (Array.isArray(parsed)) {
                setWishlistIds(parsed.filter((id) => typeof id === "string"))
              }
            }
          } catch {}
        }
      } catch (err) {
        console.error("Failed to initialize wishlist:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    init()
    return () => {
      isMounted = false
    }
  }, [customerId])

  const isWishlisted = useCallback(
    (productId: string) => {
      return wishlistIds.includes(productId)
    },
    [wishlistIds]
  )

  const toggleWishlist = useCallback(
    async (productId: string) => {
      if (!productId) return

      const currentlyWishlisted = wishlistIds.includes(productId)
      const nextIds = currentlyWishlisted
        ? wishlistIds.filter((id) => id !== productId)
        : [...wishlistIds, productId]

      // Optimistic state update
      setWishlistIds(nextIds)

      if (customerId) {
        startTransition(async () => {
          try {
            if (currentlyWishlisted) {
              await removeWishlistItem(productId)
            } else {
              await addWishlistItem(productId)
            }
          } catch (err) {
            console.error("Failed to sync wishlist with server:", err)
            // Rollback on failure
            setWishlistIds(wishlistIds)
          }
        })
      } else {
        // Guest mode: update localStorage
        try {
          localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(nextIds))
        } catch (err) {
          console.error("Failed to save guest wishlist to localStorage:", err)
        }
      }
    },
    [customerId, wishlistIds]
  )

  return (
    <WishlistContext.Provider
      value={{
        wishlistIds,
        isWishlisted,
        toggleWishlist,
        wishlistCount: wishlistIds.length,
        isLoading,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist(): WishlistContextType {
  const context = useContext(WishlistContext)
  if (!context) {
    return {
      wishlistIds: [],
      isWishlisted: () => false,
      toggleWishlist: async () => {},
      wishlistCount: 0,
      isLoading: false,
    }
  }
  return context
}

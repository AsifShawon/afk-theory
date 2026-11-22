"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { MAX_QUANTITY, type OrderLine } from "@/lib/order-message"

const STORAGE_KEY = "afk-order-list-v1"

/** Current name and price for each product, so saved lists never show stale prices. */
export type PriceBook = Record<string, { name: string; priceBdt: number; image?: string }>

export interface OrderItem extends OrderLine {
  key: string
}

interface Toast {
  id: number
  text: string
}

interface OrderContextValue {
  items: OrderItem[]
  /** False until the saved list has been read, so pages do not flash "empty". */
  loaded: boolean
  prices: PriceBook
  count: number
  add: (line: OrderLine) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  drawerOpen: boolean
  setDrawerOpen: (open: boolean) => void
  toast: Toast | null
  showToast: (text: string) => void
}

const OrderContext = createContext<OrderContextValue | null>(null)

export function itemKey(line: Pick<OrderLine, "slug" | "designName" | "colorName" | "size">): string {
  return [line.slug, line.designName ?? "", line.colorName ?? "", line.size ?? ""].join("|")
}

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity) || 1))
}

function readStored(prices: PriceBook): OrderItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((item): item is OrderItem => typeof item?.slug === "string" && Boolean(prices[item.slug]))
      .map((item) => ({
        ...item,
        productName: prices[item.slug].name,
        unitPriceBdt: prices[item.slug].priceBdt,
        quantity: clampQuantity(item.quantity),
        key: itemKey(item),
      }))
  } catch {
    return []
  }
}

export function OrderProvider({ prices, children }: { prices: PriceBook; children: ReactNode }) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setItems(readStored(prices))
    setLoaded(true)
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setItems(readStored(prices))
    }
    window.addEventListener("storage", onStorage)
    return () => window.removeEventListener("storage", onStorage)
  }, [prices])

  useEffect(() => {
    if (loaded) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    }
  }, [items, loaded])

  const showToast = useCallback((text: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
    setToast({ id: Date.now(), text })
    toastTimer.current = setTimeout(() => setToast(null), 4200)
  }, [])

  const add = useCallback((line: OrderLine) => {
    const key = itemKey(line)
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key)
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, quantity: clampQuantity(i.quantity + line.quantity) } : i))
      }
      return [...prev, { ...line, quantity: clampQuantity(line.quantity), key }]
    })
  }, [])

  const value = useMemo<OrderContextValue>(
    () => ({
      items,
      loaded,
      prices,
      count: items.reduce((n, i) => n + i.quantity, 0),
      add,
      setQuantity: (key, quantity) => setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: clampQuantity(quantity) } : i))),
      remove: (key) => setItems((prev) => prev.filter((i) => i.key !== key)),
      clear: () => setItems([]),
      drawerOpen,
      setDrawerOpen,
      toast,
      showToast,
    }),
    [items, loaded, prices, add, drawerOpen, toast, showToast]
  )

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext)
  if (!ctx) {
    throw new Error("useOrder must be used inside OrderProvider")
  }
  return ctx
}

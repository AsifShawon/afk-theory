"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  getCustomGarmentConfig,
  isValidPlacementDimensions,
  priceCustomDtfItem,
  type CustomDtfConfig,
} from "@dtc/catalogue-core"
import { MAX_QUANTITY, type OrderLine } from "@/lib/order-message"

const STORAGE_KEY = "afk-order-list-v1"

/** Current name and price for each product, so saved lists never show stale prices. */
export type PriceBook = Record<string, { name: string; priceBdt: number; image?: string; metaContentId?: string | null }>

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

function customSignature(customDtf?: CustomDtfConfig): string {
  if (!customDtf) return ""
  const placements = [...customDtf.placements]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((p) => `${p.id}:${p.widthIn}x${p.heightIn}`)
    .join(",")
  return `dtf[${placements}|${customDtf.artworkNote?.trim() ?? ""}]`
}

export function itemKey(line: Pick<OrderLine, "slug" | "designName" | "colorName" | "size" | "customDtf">): string {
  return [line.slug, line.designName ?? "", line.colorName ?? "", line.size ?? "", customSignature(line.customDtf)].join("|")
}

function clampQuantity(quantity: number): number {
  return Math.max(1, Math.min(MAX_QUANTITY, Math.round(quantity) || 1))
}

function readStored(prices: PriceBook): OrderItem[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]")
    if (!Array.isArray(parsed)) return []
    const items: OrderItem[] = []
    for (const item of parsed) {
      if (typeof item?.slug !== "string") continue
      const garment = getCustomGarmentConfig(item.slug)
      if (garment && item.customDtf && Array.isArray(item.customDtf.placements)) {
        const validPlacements = (item.customDtf as CustomDtfConfig).placements.filter(
          (p) => p && typeof p.id === "string" && isValidPlacementDimensions(p.id, p.widthIn, p.heightIn)
        )
        const priced = priceCustomDtfItem(validPlacements, garment.customBasePriceBdt)
        const normalizedCustom: CustomDtfConfig = {
          placements: priced.itemized.map((p) => ({
            id: p.id,
            preset: p.preset ?? "custom",
            widthIn: p.widthIn,
            heightIn: p.heightIn,
            priceBdt: p.priceBdt,
          })),
          ...(typeof item.customDtf.artworkNote === "string" && item.customDtf.artworkNote.trim()
            ? { artworkNote: item.customDtf.artworkNote.trim().slice(0, 300) }
            : {}),
        }
        const normalized: OrderLine = {
          ...item,
          productName: garment.customProductName,
          unitPriceBdt: priced.unitPriceBdt,
          quantity: clampQuantity(item.quantity),
          customDtf: normalizedCustom,
        }
        items.push({ ...normalized, key: itemKey(normalized) })
        continue
      }
      if (!prices[item.slug]) continue
      items.push({
        ...item,
        productName: prices[item.slug].name,
        unitPriceBdt: prices[item.slug].priceBdt,
        quantity: clampQuantity(item.quantity),
        key: itemKey(item),
      })
    }
    return items
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

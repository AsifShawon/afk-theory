/**
 * Client-side product search over the prebuilt `searchIndex`. Pure, with no
 * dependencies, so it can run in the browser. Import from
 * "@dtc/catalogue-core/search" in client components.
 */
import type { SearchIndexEntry } from "./types"

/** Lowercase, accents removed, anything that is not a letter or digit becomes a space. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9ঀ-৿]+/g, " ")
    .trim()
}

export function tokenize(value: string): string[] {
  const normalized = normalizeSearchText(value)
  return normalized ? normalized.split(" ") : []
}

/**
 * Edit distance with adjacent swaps counted as one edit (optimal string
 * alignment). Stops early and returns max + 1 once the distance must exceed max.
 */
export function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prevPrev: number[] = []
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const row = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1)
      }
      row.push(value)
      rowMin = Math.min(rowMin, value)
    }
    if (rowMin > max) return max + 1
    prevPrev = prev
    prev = row
  }
  return prev[b.length]
}

/** Typos allowed for a query word of this length. Short words must match exactly. */
function allowedTypos(length: number): number {
  if (length < 4) return 0
  if (length < 8) return 1
  return 2
}

/** How well one query word matches one indexed word, from 0 to 1. */
export function matchWord(query: string, word: string): number {
  if (!query || !word) return 0
  if (word === query) return 1
  if (word.startsWith(query)) return 0.85
  const typos = allowedTypos(query.length)
  if (typos > 0) {
    if (editDistance(query, word, typos) <= typos) return 0.6
    // A typo inside a word that is still being typed: "hodi" for "hoodie".
    // Compare with the start of the word, one letter shorter or longer too.
    for (const length of [query.length, query.length + 1, query.length - 1]) {
      if (length < word.length && editDistance(query, word.slice(0, length), typos) <= typos) return 0.5
    }
  }
  if (query.length >= 3 && word.includes(query)) return 0.4
  return 0
}

const FIELD_WEIGHTS = { name: 3, category: 2, designs: 1.5, colors: 1.5 } as const

/**
 * Scores one entry. Every query word must match some word of the entry, or
 * the score is 0. Name matches count most, then category, then designs and
 * colors. A name that starts with the whole query gets a bonus.
 */
export function scoreSearchEntry(entry: SearchIndexEntry, query: string): number {
  const queryWords = tokenize(query)
  if (queryWords.length === 0) return 0
  const fields: [keyof typeof FIELD_WEIGHTS, string[]][] = [
    ["name", tokenize(entry.name)],
    ["category", tokenize(entry.category)],
    ["designs", entry.designs.flatMap(tokenize)],
    ["colors", entry.colors.flatMap(tokenize)],
  ]

  let total = 0
  for (const q of queryWords) {
    let best = 0
    for (const [field, words] of fields) {
      for (const word of words) {
        best = Math.max(best, matchWord(q, word) * FIELD_WEIGHTS[field])
      }
    }
    if (best === 0) return 0
    total += best
  }
  if (normalizeSearchText(entry.name).startsWith(normalizeSearchText(query))) total += 1
  // In-stock products win ties.
  if (!entry.soldOut) total += 0.01
  return total
}

/** Matching entries, best first. Equal scores keep index order. */
export function searchCatalogue(index: SearchIndexEntry[], query: string, limit = 24): SearchIndexEntry[] {
  return index
    .map((entry, position) => ({ entry, position, score: scoreSearchEntry(entry, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, limit)
    .map((r) => r.entry)
}

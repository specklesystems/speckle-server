import {
  NUMERIC_FILTER_COLORS,
  ACCESSIBLE_COLOR_PALETTE
} from '~/lib/viewer/helpers/coloring/constants'
import type { ColorGroupWithSource } from '~/lib/viewer/helpers/coloring/types'

// Performance optimization: Cache generated colors to avoid recalculation
const colorCache = new Map<string, string>()
const hashCache = new Map<string, number>()

/**
 * Fast hash function with caching for performance
 */
function fastHash(value: string): number {
  const cached = hashCache.get(value)
  if (cached !== undefined) return cached

  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash + value.charCodeAt(i)) & 0xffffffff
  }

  const result = Math.abs(hash)
  hashCache.set(value, result)
  return result
}

/**
 * Generate a color for a string value using accessible color palette
 * First 20 colors use the curated accessible palette, then falls back to HSL generation
 */
export function generateColorForStringValue(value: string): string {
  const cached = colorCache.get(value)
  if (cached) return cached

  const hash = fastHash(value)

  // Always use accessible palette first, cycling through it
  const paletteIndex = hash % ACCESSIBLE_COLOR_PALETTE.length
  const result = ACCESSIBLE_COLOR_PALETTE[paletteIndex]

  colorCache.set(value, result)
  return result
}

/**
 * Generate a color for a numeric value using gradient interpolation
 */
export function generateColorForNumericValue(
  value: number,
  min: number,
  max: number
): string {
  const normalizedValue = (value - min) / (max - min)
  const { from, to } = NUMERIC_FILTER_COLORS

  const r = Math.round(from.r + (to.r - from.r) * normalizedValue)
  const g = Math.round(from.g + (to.g - from.g) * normalizedValue)
  const b = Math.round(from.b + (to.b - from.b) * normalizedValue)

  return `rgb(${r}, ${g}, ${b})`
}

/**
 * Create color groups for numeric filter values
 */
export function createNumericFilterColorGroups(
  valueGroups: Array<{ value: number; id: string }>,
  min: number,
  max: number
): ColorGroupWithSource[] {
  return valueGroups.map((vg) => ({
    objectIds: [vg.id],
    color: generateColorForNumericValue(vg.value, min, max),
    source: 'property' as const
  }))
}

/**
 * Create color groups for string filter values
 */
export function createStringFilterColorGroups(
  valueGroups: Array<{ value: string; ids?: string[] }>
): ColorGroupWithSource[] {
  return valueGroups.map((vg) => ({
    objectIds: vg.ids || [],
    color: generateColorForStringValue(vg.value),
    source: 'property' as const
  }))
}

import { NUMERIC_FILTER_COLORS } from '~/lib/viewer/helpers/coloring/constants'
import type { ColorGroupWithSource } from '~/lib/viewer/helpers/coloring/types'

/**
 * Generate a color for a string value using consistent hash-based algorithm
 */
export function generateColorForStringValue(value: string): string {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert hash to HSL color for better distribution
  const hue = Math.abs(hash) % 360
  const saturation = 70 + (Math.abs(hash >> 8) % 30) // 70-100%
  const lightness = 45 + (Math.abs(hash >> 16) % 20) // 45-65%

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
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

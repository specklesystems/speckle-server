/**
 * Standard gradient colors used for numeric filter coloring
 * Uses high contrast colors that work well for color-blind users
 */
export const NUMERIC_FILTER_COLORS = {
  from: { r: 0, g: 68, b: 136 }, // #004488 - Dark blue
  to: { r: 255, g: 109, b: 0 } // #ff6d00 - Orange
} as const

/**
 * Color-blind friendly palette for string values
 * Based on Paul Tol's vibrant scheme and IBM's color palette
 * These colors maintain good contrast and are distinguishable for most types of color blindness
 */
export const ACCESSIBLE_COLOR_PALETTE = [
  '#1f77b4', // Blue
  '#ff7f0e', // Orange
  '#2ca02c', // Green
  '#d62728', // Red
  '#9467bd', // Purple
  '#8c564b', // Brown
  '#e377c2', // Pink
  '#7f7f7f', // Gray
  '#bcbd22', // Olive
  '#17becf', // Cyan
  '#aec7e8', // Light blue
  '#ffbb78', // Light orange
  '#98df8a', // Light green
  '#ff9896', // Light red
  '#c5b0d5', // Light purple
  '#c49c94', // Light brown
  '#f7b6d3', // Light pink
  '#c7c7c7', // Light gray
  '#dbdb8d', // Light olive
  '#9edae5' // Light cyan
] as const

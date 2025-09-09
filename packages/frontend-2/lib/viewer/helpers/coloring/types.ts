export type ColorGroup = {
  objectIds: string[]
  color: string
}

export type ColorGroupWithSource = ColorGroup & { source: 'property' | 'highlight' }

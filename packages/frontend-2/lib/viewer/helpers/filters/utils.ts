import type { PropertyInfo } from '@speckle/viewer'
import { isStringPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import { ExistenceFilterCondition } from './types'

export const revitPropertyRegex = /^parameters\./
export const revitPropertyRegexDui3000InstanceProps = /^properties\.Instance/
export const revitPropertyRegexDui3000TypeProps = /^properties\.Type/

/**
 * Determines if a property key represents a Revit property
 */
export const isRevitProperty = (key: string): boolean => {
  return (
    revitPropertyRegex.test(key) ||
    revitPropertyRegexDui3000InstanceProps.test(key) ||
    revitPropertyRegexDui3000TypeProps.test(key)
  )
}

/**
 * Determines if a property should be excluded from filtering based on its key
 */
export const shouldExcludeFromFiltering = (key: string): boolean => {
  if (
    key.endsWith('.units') ||
    key.endsWith('.speckle_type') ||
    key.includes('.parameters.') ||
    key.includes('renderMaterial') ||
    key.includes('.domain') ||
    key.includes('plane.') ||
    key.includes('baseLine') ||
    key.includes('referenceLine') ||
    key.includes('end.') ||
    key.includes('start.') ||
    key.includes('endPoint.') ||
    key.includes('midPoint.') ||
    key.includes('startPoint.') ||
    key.includes('.materialName') ||
    key.includes('.materialClass') ||
    key.includes('.materialCategory') ||
    key.includes('displayStyle') ||
    key.includes('displayValue') ||
    key.includes('displayMesh') ||
    key.startsWith('__')
  ) {
    return true
  }

  if (isRevitProperty(key)) {
    if (key.endsWith('.value')) return false
    else return true
  }

  return false
}

/**
 * Gets a user-friendly display name for a property key
 */
export const getPropertyName = (
  key: string,
  availableFilters?: PropertyInfo[] | null
): string => {
  if (!key) return 'Loading'

  if (key === 'level.name') return 'Level Name'
  if (key === 'speckle_type') return 'Object Type'

  if (isRevitProperty(key) && key.endsWith('.value')) {
    const correspondingProperty = (availableFilters || []).find(
      (f: PropertyInfo) => f.key === key.replace('.value', '.name')
    )
    if (correspondingProperty && isStringPropertyInfo(correspondingProperty)) {
      return correspondingProperty.valueGroups[0]?.value || key.split('.').pop() || key
    }
  }

  return key.split('.').pop() || key
}

/**
 * Finds a filter by matching display names
 */
export const findFilterByDisplayName = (
  displayKey: string,
  availableFilters: PropertyInfo[] | null | undefined
): PropertyInfo | undefined => {
  if (!availableFilters) return undefined

  // First, try to find an exact display name match
  const exactDisplayMatch = availableFilters.find((f) => {
    const propertyDisplayName = getPropertyName(f.key, availableFilters)
    return propertyDisplayName === displayKey
  })
  if (exactDisplayMatch) return exactDisplayMatch

  // Then try to find a match where the key ends with the display key
  const endMatches = availableFilters
    .filter((f) => f.key.split('.').pop() === displayKey)
    .sort((a, b) => a.key.length - b.key.length) // Shorter paths first

  return endMatches[0] // Return the shortest matching path
}

/**
 * Determines if a key-value pair is filterable (with smart matching for nested properties)
 */
export const isKvpFilterable = (
  kvp: { key: string; backendPath?: string },
  availableFilters: PropertyInfo[] | null | undefined
): boolean => {
  // Use backendPath for legacy compatibility, but prefer the direct key
  const propertyKey = kvp.backendPath || kvp.key

  const directMatch = availableFilters?.some((f) => f.key === propertyKey)
  if (directMatch) {
    return !shouldExcludeFromFiltering(propertyKey)
  }

  const displayKey = kvp.key as string
  const matchByDisplayName = findFilterByDisplayName(displayKey, availableFilters)

  if (matchByDisplayName) {
    return !shouldExcludeFromFiltering(matchByDisplayName.key)
  }

  return false
}

/**
 * Gets a detailed reason why a property is disabled for filtering
 */
export const getFilterDisabledReason = (
  kvp: { key: string; backendPath?: string },
  availableFilters: PropertyInfo[] | null | undefined
): string => {
  const availableKeys = availableFilters?.map((f) => f.key) || []

  if (kvp.backendPath) {
    if (!availableKeys.includes(kvp.backendPath)) {
      const propertyName = kvp.key
      const similarPaths = availableKeys.filter(
        (key) => key.split('.').pop() === propertyName
      )

      if (similarPaths.length > 0) {
        return `Property path '${
          kvp.backendPath
        }' not found. Similar properties: ${similarPaths.slice(0, 3).join(', ')}`
      }

      return `Property path '${kvp.backendPath}' is not available in the current scene`
    }

    if (shouldExcludeFromFiltering(kvp.backendPath)) {
      return `Property '${kvp.backendPath}' is excluded from filtering (technical property)`
    }
  } else {
    // Fallback to key-based checking
    const propertyKey = kvp.key
    if (!availableKeys.includes(propertyKey)) {
      const similarKeys = availableKeys.filter(
        (key) =>
          key.toLowerCase().includes('type') ||
          key.toLowerCase().includes('category') ||
          key.toLowerCase().includes('class')
      )

      const debugInfo =
        similarKeys.length > 0
          ? ` (Similar available: ${similarKeys.slice(0, 3).join(', ')})`
          : ''

      return `Property '${propertyKey}' is not available in the current scene${debugInfo}`
    }

    if (shouldExcludeFromFiltering(propertyKey)) {
      return `Property '${propertyKey}' is excluded from filtering (technical property)`
    }
  }

  return 'This property is not available for filtering'
}

/**
 * Finds a filter for a key-value pair using smart matching logic
 */
export const findFilterByKvp = (
  kvp: { key: string; backendPath?: string },
  availableFilters: PropertyInfo[] | null | undefined
): PropertyInfo | undefined => {
  if (!availableFilters) return undefined

  if (kvp.backendPath) {
    const exactMatch = availableFilters.find(
      (f: PropertyInfo) => f.key === kvp.backendPath
    )
    if (exactMatch) {
      return exactMatch
    }
  }

  const directMatch = availableFilters.find((f: PropertyInfo) => f.key === kvp.key)
  if (directMatch) {
    return directMatch
  }

  // If we have a backendPath but no exact match, try partial matching
  if (kvp.backendPath) {
    const pathParts = kvp.backendPath.split('.')
    const partialMatches = availableFilters.filter((f: PropertyInfo) => {
      const filterParts = f.key.split('.')

      if (pathParts.length === 1) {
        return filterParts[filterParts.length - 1] === pathParts[0]
      }

      if (pathParts.length >= 2 && filterParts.length >= 2) {
        const kvpEnd = pathParts.slice(-2).join('.')
        const filterEnd = filterParts.slice(-2).join('.')
        return kvpEnd === filterEnd
      }

      return false
    })

    if (partialMatches.length === 1) {
      return partialMatches[0]
    }

    if (partialMatches.length > 1) {
      const sortedMatches = partialMatches.sort((a, b) => a.key.length - b.key.length)
      return sortedMatches[0]
    }

    return undefined
  }

  // Only fall back to fuzzy matching if no backendPath is provided (legacy support)
  const displayKey = kvp.key as string
  return findFilterByDisplayName(displayKey, availableFilters)
}

export const isBooleanProperty = (filter: PropertyInfo): boolean => {
  return 'type' in filter && (filter as { type: string }).type === 'boolean'
}

/**
 * Get count for a specific filter value
 */
export function getFilterValueCount(filter: PropertyInfo, value: string): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return 0
  }

  const valueGroups = filter.valueGroups as Array<{ value: unknown; ids?: string[] }>

  for (const vg of valueGroups) {
    if (String(vg.value) === value) {
      return vg.ids?.length ?? 0
    }
  }

  return 0
}

/**
 * Get count for existence filters (objects that have/don't have a property set)
 */
export function getExistenceFilterCount(
  filter: PropertyInfo,
  condition: ExistenceFilterCondition,
  totalObjectCount?: number
): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return filter.objectCount ?? 0
  }

  const hasIndividualIds =
    filter.valueGroups.length > 0 &&
    'id' in filter.valueGroups[0] &&
    !('ids' in filter.valueGroups[0])

  const objectsWithProperty = hasIndividualIds
    ? filter.valueGroups.length // Each valueGroup = one object
    : filter.valueGroups.reduce((total, vg) => {
        if ('ids' in vg && Array.isArray(vg.ids)) {
          return total + vg.ids.length
        }
        return total
      }, 0)

  if (condition === ExistenceFilterCondition.IsSet) {
    return objectsWithProperty
  } else {
    const relevantObjectCount = filter.objectCount ?? totalObjectCount ?? 0
    return Math.max(0, relevantObjectCount - objectsWithProperty)
  }
}

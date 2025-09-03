import type { PropertyInfo } from '@speckle/viewer'
import { isStringPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'

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
    key.includes('displayMesh')
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
 * Finds a filter by matching display names (handles complex nested properties)
 */
export const findFilterByDisplayName = (
  displayKey: string,
  availableFilters: PropertyInfo[] | null | undefined
): PropertyInfo | undefined => {
  return availableFilters?.find((f) => {
    const backendDisplayName = getPropertyName(f.key, availableFilters)
    return backendDisplayName === displayKey || f.key.split('.').pop() === displayKey
  })
}

/**
 * Determines if a key-value pair is filterable (with smart matching for nested properties)
 */
export const isKvpFilterable = (
  kvp: { key: string; backendPath?: string },
  availableFilters: PropertyInfo[] | null | undefined
): boolean => {
  const backendKey = kvp.backendPath || kvp.key

  const directMatch = availableFilters?.some((f) => f.key === backendKey)
  if (directMatch) {
    return !shouldExcludeFromFiltering(backendKey)
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
  const backendKey = kvp.backendPath || kvp.key
  const availableKeys = availableFilters?.map((f) => f.key) || []

  if (!availableKeys.includes(backendKey)) {
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

    return `Property '${backendKey}' is not available in backend filters${debugInfo}`
  }

  if (shouldExcludeFromFiltering(backendKey)) {
    return `Property '${backendKey}' is excluded from filtering (technical property)`
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
  const backendKey = kvp.backendPath || kvp.key

  let filter = availableFilters?.find((f: PropertyInfo) => f.key === backendKey)

  if (!filter) {
    const displayKey = kvp.key as string
    filter = findFilterByDisplayName(displayKey, availableFilters)
  }

  return filter
}

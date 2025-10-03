import { isStringPropertyInfo } from '~/lib/viewer/helpers/sceneExplorer'
import {
  ExistenceFilterCondition,
  FilterType,
  type BooleanPropertyInfo,
  type DataSource,
  type ExtendedPropertyInfo,
  type PropertyInfoBase,
  type PropertyInfoValue,
  type Parameter,
  type RevitMaterialPropertyInfo,
  type RevitMaterialInfo
} from '~/lib/viewer/helpers/filters/types'

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
  // Whitelist essential instance properties
  const pathParts = key.split('.')
  const lastPart = pathParts[pathParts.length - 1]

  // Always include these instance-related properties
  if (['definitionId', 'transform', 'name', 'definitionName'].includes(lastPart)) {
    return false
  }

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
  availableFilters?: ExtendedPropertyInfo[] | null
): string => {
  if (!key) return 'Loading'

  if (key === 'level.name') return 'Level Name'
  if (key === 'speckle_type') return 'Object Type'

  if (isRevitProperty(key) && key.endsWith('.value')) {
    const correspondingProperty = (availableFilters || []).find(
      (f: ExtendedPropertyInfo) => f.key === key.replace('.value', '.name')
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
  availableFilters: ExtendedPropertyInfo[] | null | undefined
): ExtendedPropertyInfo | undefined => {
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
  availableFilters: ExtendedPropertyInfo[] | null | undefined
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
  availableFilters: ExtendedPropertyInfo[] | null | undefined
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
  availableFilters: ExtendedPropertyInfo[] | null | undefined
): ExtendedPropertyInfo | undefined => {
  if (!availableFilters) return undefined

  if (kvp.backendPath) {
    const exactMatch = availableFilters.find(
      (f: ExtendedPropertyInfo) => f.key === kvp.backendPath
    )
    if (exactMatch) {
      return exactMatch
    }
  }

  const directMatch = availableFilters.find(
    (f: ExtendedPropertyInfo) => f.key === kvp.key
  )
  if (directMatch) {
    return directMatch
  }

  // If we have a backendPath but no exact match, try partial matching
  if (kvp.backendPath) {
    const pathParts = kvp.backendPath.split('.')
    const partialMatches = availableFilters.filter((f: ExtendedPropertyInfo) => {
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

export const isBooleanProperty = (filter: ExtendedPropertyInfo): boolean => {
  return 'type' in filter && (filter as { type: string }).type === 'boolean'
}

/**
 * Determines if a value should be treated as numeric for filtering
 */
export const isValueNumeric = (value: unknown): boolean => {
  return (
    typeof value === 'number' ||
    (!isNaN(Number(value)) && String(value) !== '' && !/[a-zA-Z-]/.test(String(value)))
  )
}

/**
 * Determines if a value should be treated as boolean for filtering (case-insensitive)
 */
export const isValueBoolean = (value: unknown): boolean => {
  const str = String(value).toLowerCase()
  return str === 'true' || str === 'false'
}

/**
 * Checks if a value represents boolean true (case-insensitive)
 */
export const isValueBooleanTrue = (value: unknown): boolean => {
  return (
    value === true || (isValueBoolean(value) && String(value).toLowerCase() === 'true')
  )
}

/**
 * Checks if a value represents boolean false (case-insensitive)
 */
export const isValueBooleanFalse = (value: unknown): boolean => {
  return (
    value === false ||
    (isValueBoolean(value) && String(value).toLowerCase() === 'false')
  )
}

/**
 * Get count for a specific filter value
 */
export function getFilterValueCount(
  filter: ExtendedPropertyInfo,
  value: string
): number {
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
  filter: ExtendedPropertyInfo | BooleanPropertyInfo,
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

/**
 * Injects gradient data into the filtering data store so it can be used for filtering
 */
export function injectGradientDataIntoDataStore(
  filteringDataStore: unknown,
  propertyKey: string,
  gradientValues: Record<string, { gradientValue: number }>
): void {
  if (!filteringDataStore || Object.keys(gradientValues).length === 0) {
    return
  }

  const store = filteringDataStore as {
    dataSources: {
      value: DataSource[]
    }
  }
  if (!store.dataSources?.value) {
    return
  }

  for (const dataSource of store.dataSources.value) {
    for (const [objectId, { gradientValue }] of Object.entries(gradientValues)) {
      // Add the gradient property to the object if it exists in this data source
      if (dataSource.objectProperties[objectId]) {
        dataSource.objectProperties[objectId][propertyKey] = gradientValue
      }
    }

    // Add property info to the propertyMap if not already present
    if (!dataSource.propertyMap[propertyKey]) {
      dataSource.propertyMap[propertyKey] = {
        concatenatedPath: propertyKey,
        value: Object.values(gradientValues)[0]?.gradientValue || 0,
        type: FilterType.Numeric
      }
    }
  }
}

/**
 * Nasty smartsy object flattener that currently includes special handling logic for Revit objects
 * @param obj object you want to extract the properties from
 * @param currentPath do not pass in on first call, used in recursion
 * @param knownObjectType do not pass in on first call, used in recursion
 * @param rootObj do not pass in on first call, used in recursion
 * @returns
 */
export const extractNestedProperties = (
  obj: Record<string, unknown>,
  currentPath: string[] = [],
  knownObjectType?: string,
  rootObj?: Record<string, unknown>
) => {
  const properties: (
    | PropertyInfoBase
    | PropertyInfoValue
    | Parameter
    | RevitMaterialPropertyInfo
  )[] = []
  rootObj = rootObj ?? obj

  knownObjectType =
    knownObjectType ??
    (obj.speckle_type === 'Objects.Data.DataObject:Objects.Data.RevitObject'
      ? 'revit'
      : undefined)

  for (const key in obj) {
    if (
      !Object.prototype.hasOwnProperty.call(obj, key) ||
      key === '__closure' ||
      key === 'displayValue' ||
      (knownObjectType === 'revit' && (key === 'location' || key === 'elements'))
    )
      continue

    // if (key.includes('.')) {
    //   // Life is fun, isn't it
    //   console.warn(
    //     'Object contains a property that has a . in its name. Skipping!',
    //     key,
    //     currentPath,
    //     rootObj
    //   )
    //   continue
    // }

    if (knownObjectType === 'revit' && key === 'Material Quantities') {
      extractMaterialProperties(
        obj[key] as Record<string, unknown>,
        [...currentPath, key],
        properties
      )
      continue
    }

    if (
      knownObjectType === 'revit' &&
      key === 'Structure' &&
      currentPath[currentPath.length - 1] === 'Type Parameters'
    ) {
      // TODO: handle later; for now this introduces garbage
      continue
    }

    const value = obj[key]
    const newPath = [...currentPath, key]
    const valueType = getValueType(value)
    const isParam = value && isParameter(value)

    if (valueType === 'object' && value !== null && !isParam) {
      properties.push(
        ...extractNestedProperties(
          value as Record<string, unknown>,
          newPath,
          knownObjectType,
          rootObj
        )
      )
    } else if (isParam) {
      const param = value as Parameter

      properties.push({
        name: key,
        path: newPath,
        concatenatedPath: newPath.join('.'),
        type: getValueType(param.value),
        units: param.units
      })
    } else {
      properties.push({
        name: key,
        path: newPath,
        concatenatedPath: newPath.join('.'),
        type: valueType
      })
    }
  }
  return properties as PropertyInfoBase[]
}

function getValueType(value: unknown): string {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  return typeof value
}

function extractMaterialProperties(
  matQuants: Record<string, unknown>,
  path: string[],
  properties: (
    | PropertyInfoBase
    | PropertyInfoValue
    | Parameter
    | RevitMaterialPropertyInfo
  )[]
) {
  for (const matName in matQuants) {
    const matInfo = matQuants[matName] as RevitMaterialInfo

    const areaProp: RevitMaterialPropertyInfo | undefined = matInfo.area
      ? {
          path,
          concatenatedPath: path.join('.'),
          type: 'number',
          name: `${matName} - area`,
          value: matInfo.area.value,
          units: matInfo.area.units,
          materialCategory: matInfo.materialCategory,
          materialClass: matInfo.materialClass
        }
      : undefined

    const volumeProp: RevitMaterialPropertyInfo | undefined = matInfo.volume
      ? {
          path,
          concatenatedPath: path.join('.'),
          type: 'number',
          name: `${matName} - volume`,
          value: matInfo.volume.value,
          units: matInfo.volume.units,
          materialCategory: matInfo.materialCategory,
          materialClass: matInfo.materialClass
        }
      : undefined
    if (areaProp) properties.push(areaProp)
    if (volumeProp) properties.push(volumeProp)
  }
}

export function isParameter(value: unknown) {
  return (
    typeof value === 'object' &&
    Object.hasOwn(value as Record<string, unknown>, 'name') &&
    Object.hasOwn(value as Record<string, unknown>, 'value')
  )
}

export function isRevitMaterialQuantity(value: unknown) {
  return (
    typeof value === 'object' &&
    isParameter(value) &&
    Object.hasOwn(value as Record<string, unknown>, 'materialCategory') &&
    Object.hasOwn(value as Record<string, unknown>, 'materialClass')
  )
}

export function getNestedProperties(obj: unknown, properties: PropertyInfoBase[]) {
  const values = []
  for (const prop of properties) {
    const value = prop.path.reduce(
      (current: unknown, key: string) => (current as Record<string, unknown>)?.[key],
      obj
    )
    if (value && isParameter(value)) {
      values.push((value as Parameter).value)
    } else {
      values.push(value ?? undefined)
    }
  }
  return values
}

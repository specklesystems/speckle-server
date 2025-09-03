import type { SpeckleObject, TreeNode, Viewer } from '@speckle/viewer'

import { FilteringExtension } from '@speckle/viewer'
import { uniq, flatten, isEmpty, compact } from 'lodash-es'
import {
  FilterLogic,
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition
} from '~/lib/viewer/helpers/filters/types'
import type {
  DataSlice,
  QueryCriteria,
  DataSource,
  ResourceInfo,
  PropertyInfoBase,
  FilterData
} from '~/lib/viewer/helpers/filters/types'

// Singleton instance
let globalDataStoreInstance: ReturnType<typeof createFilteringDataStore> | null = null

// Internal data store implementation
export function createFilteringDataStore() {
  const dataSourcesMap: Ref<Record<string, DataSource>> = ref({})
  const dataSources = computed(() => Object.values(dataSourcesMap.value))
  const currentFilterLogic = ref<FilterLogic>(FilterLogic.All)
  const dataSlices: Ref<DataSlice[]> = ref([])

  let propertyExtractionCache = new WeakMap<
    Record<string, unknown>,
    PropertyInfoBase[]
  >()

  const extractNestedProperties = (
    obj: Record<string, unknown>
  ): PropertyInfoBase[] => {
    if (propertyExtractionCache.has(obj)) {
      return propertyExtractionCache.get(obj)!
    }

    const properties: PropertyInfoBase[] = []

    function traverse(current: Record<string, unknown>, path: string[] = []) {
      for (const [key, value] of Object.entries(current)) {
        const currentPath = [...path, key]
        const concatenatedPath = currentPath.join('.')

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          traverse(value as Record<string, unknown>, currentPath)
        } else {
          properties.push({
            concatenatedPath,
            value,
            type: typeof value
          } as PropertyInfoBase)
        }
      }
    }

    traverse(obj)
    propertyExtractionCache.set(obj, properties)
    return properties
  }

  const populateDataStore = async (viewer: Viewer, resources: ResourceInfo[]) => {
    const tree = viewer.getWorldTree()
    if (!tree) return

    for (const res of resources) {
      const foundNodes = tree.findId(res.resourceUrl)
      const subnode = foundNodes?.[0]
      if (!subnode) {
        continue
      }

      const objectMap: Record<string, SpeckleObject> = {}
      const propertyMap: Record<string, PropertyInfoBase> = {}
      const propertyIndexCache: Record<string, Record<string, string[]>> = {}

      await tree.walkAsync((node: TreeNode) => {
        if (
          node.model.atomic &&
          node.model.raw.id &&
          node.model.raw.id.length === 32 &&
          !node.model.raw.speckle_type?.includes('Proxy') &&
          node.model.raw.properties?.builtInCategory !== 'OST_Levels'
        ) {
          const objectId = node.model.raw.id
          objectMap[objectId] = node.model.raw as SpeckleObject

          const props = extractNestedProperties(node.model.raw)
          for (const p of props) {
            propertyMap[p.concatenatedPath] = p

            // Pre-build property indices during extraction (eliminates duplicate work!)
            const propertyKey = p.concatenatedPath
            const value = String(p.value)

            if (!propertyIndexCache[propertyKey]) {
              propertyIndexCache[propertyKey] = {}
            }

            if (!propertyIndexCache[propertyKey][value]) {
              propertyIndexCache[propertyKey][value] = []
            }

            propertyIndexCache[propertyKey][value].push(objectId)
          }
        }
        return true
      }, subnode)

      const rootObject = subnode.model.raw.children?.[0] as SpeckleObject

      dataSourcesMap.value[res.resourceUrl] = {
        ...res,
        viewerInstance: markRaw(viewer),
        rootObject: rootObject ? markRaw(rootObject) : null,
        objectMap: markRaw(objectMap),
        propertyMap,
        _propertyIndexCache: propertyIndexCache
      }
    }
  }

  const buildPropertyIndex = (
    dataSource: DataSource,
    propertyKey: string
  ): Record<string, string[]> => {
    // Property indices are now pre-built during model load!
    // No more expensive extractNestedProperties calls here
    if (dataSource._propertyIndexCache && dataSource._propertyIndexCache[propertyKey]) {
      return dataSource._propertyIndexCache[propertyKey]
    }

    // Fallback for edge cases - return empty index
    // This should not happen with pre-built indices
    return {}
  }

  const queryObjects = (criteria: QueryCriteria): string[] => {
    const matchingIds: string[] = []

    const PRECISION = 4 // matches 0.0001 step

    for (const dataSource of dataSources.value) {
      const propertyIndex = buildPropertyIndex(dataSource, criteria.propertyKey)

      if (!propertyIndex || isEmpty(propertyIndex)) {
        continue
      }

      if (criteria.condition === ExistenceFilterCondition.IsSet) {
        matchingIds.push(...flatten(Object.values(propertyIndex)))
      } else if (criteria.condition === ExistenceFilterCondition.IsNotSet) {
        const objectsWithProperty = new Set<string>(
          flatten(Object.values(propertyIndex))
        )

        for (const [objectId] of Object.entries(dataSource.objectMap)) {
          if (!objectsWithProperty.has(objectId)) {
            matchingIds.push(objectId)
          }
        }
      } else if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
        const minValue = criteria.minValue ?? -Infinity
        const maxValue = criteria.maxValue ?? Infinity

        for (const [value, objectIds] of Object.entries(propertyIndex)) {
          const numericValue = Number(value)
          if (!isNaN(numericValue)) {
            // Only round for display purposes, not for filtering logic
            let shouldInclude = false

            switch (criteria.condition) {
              case NumericFilterCondition.IsBetween:
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
                break
              case NumericFilterCondition.IsGreaterThan:
                shouldInclude = numericValue > minValue
                break
              case NumericFilterCondition.IsLessThan:
                shouldInclude = numericValue < maxValue
                break
              case NumericFilterCondition.IsEqualTo: {
                // For equality, use a small tolerance to account for floating-point precision
                const tolerance = Math.pow(10, -PRECISION)
                shouldInclude = Math.abs(numericValue - minValue) <= tolerance
                break
              }
              case NumericFilterCondition.IsNotEqualTo: {
                // For inequality, use a small tolerance to account for floating-point precision
                const tolerance = Math.pow(10, -PRECISION)
                shouldInclude = Math.abs(numericValue - minValue) > tolerance
                break
              }
              default:
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
            }

            if (shouldInclude) {
              matchingIds.push(...objectIds)
            }
          }
        }
      } else if (criteria.condition === StringFilterCondition.Is) {
        for (const value of criteria.values) {
          const objectIds = propertyIndex[value]
          if (objectIds) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === StringFilterCondition.IsNot) {
        if (criteria.values.length === 0) {
          // Return empty array - nothing matches "is not" with no exclusions
        } else {
          const excludeValues = new Set(criteria.values)
          for (const [value, objectIds] of Object.entries(propertyIndex)) {
            if (!excludeValues.has(value)) {
              matchingIds.push(...objectIds)
            }
          }
        }
      }
    }

    return matchingIds
  }

  const computeSliceIntersections = () => {
    if (dataSlices.value.length < 1) return

    if (currentFilterLogic.value === FilterLogic.All) {
      dataSlices.value[0]!.intersectedObjectIds = [...dataSlices.value[0]!.objectIds]

      for (let i = 1; i < dataSlices.value.length; i++) {
        const prevSlice = dataSlices.value[i - 1]!
        const currentSlice = dataSlices.value[i]!
        currentSlice.intersectedObjectIds = currentSlice.objectIds.filter((id) =>
          prevSlice.intersectedObjectIds!.includes(id)
        )
      }
    } else {
      for (const slice of dataSlices.value) {
        slice.intersectedObjectIds = []
      }
    }
  }

  const pushOrReplaceSlice = (dataSlice: DataSlice) => {
    const sliceByWidgetIdIndex = dataSlices.value.findIndex(
      (slice) => slice.widgetId === dataSlice.widgetId
    )
    if (sliceByWidgetIdIndex === -1) {
      dataSlices.value.push(dataSlice)
    } else {
      if (dataSlices.value[sliceByWidgetIdIndex]!.name === dataSlice.name) {
        popSlice(dataSlice)
        return
      } else {
        dataSlices.value[sliceByWidgetIdIndex] = dataSlice
      }
    }

    computeSliceIntersections()
  }

  const popSlice = (dataSlice: DataSlice) => {
    const sliceByWidgetIdIndex = dataSlices.value.findIndex(
      (slice) => slice.widgetId === dataSlice.widgetId
    )
    if (sliceByWidgetIdIndex !== -1) {
      dataSlices.value.splice(sliceByWidgetIdIndex, 1)
      computeSliceIntersections()
    }
  }

  const getFinalObjectIds = (): string[] => {
    if (dataSlices.value.length === 0) return []

    if (currentFilterLogic.value === FilterLogic.Any) {
      const validObjectIds = compact(
        flatten(
          dataSlices.value
            .filter((slice) => slice.objectIds && Array.isArray(slice.objectIds))
            .map((slice) => slice.objectIds)
        )
      )
      return uniq(validObjectIds)
    } else {
      const lastSlice = dataSlices.value[dataSlices.value.length - 1]
      return lastSlice?.intersectedObjectIds || []
    }
  }

  const clearDataOnRouteLeave = () => {
    dataSourcesMap.value = {}
    dataSlices.value = []
    propertyExtractionCache = new WeakMap()
  }

  const setFilterLogic = (logic: FilterLogic) => {
    currentFilterLogic.value = logic
    computeSliceIntersections()
  }

  const updateViewer = (
    instance: Viewer,
    filters: {
      activeColorFilterId: Ref<string | null>
      propertyFilters: Ref<FilterData[]>
    }
  ) => {
    const objectIds = getFinalObjectIds()
    const filteringExtension = instance.getExtension(FilteringExtension)

    filteringExtension.resetFilters()

    const hasAppliedFilters = filters.propertyFilters.value.some(
      (filter) => filter.isApplied
    )

    if (objectIds.length > 0) {
      filteringExtension.isolateObjects(objectIds, 'property-filters', false, true)
    } else if (hasAppliedFilters) {
      filteringExtension.isolateObjects(
        ['no-match-ghost-all'],
        'property-filters',
        false,
        true
      )
    }

    const currentColorFilterId = filters.activeColorFilterId.value
    if (currentColorFilterId) {
      const activeFilter = filters.propertyFilters.value.find(
        (f: FilterData) => f.id === currentColorFilterId
      )
      if (activeFilter?.filter) {
        filteringExtension.setColorFilter(activeFilter.filter)
      }
    }
  }

  return {
    populateDataStore,
    queryObjects,
    pushOrReplaceSlice,
    popSlice,
    computeSliceIntersections,
    getFinalObjectIds,
    updateViewer,
    clearDataOnRouteLeave,
    setFilterLogic,
    currentFilterLogic,
    dataSlices,
    dataSources,
    buildPropertyIndex
  }
}

/**
 * Get the singleton instance of the filtering data store
 * This ensures only one data store exists across all components
 */
export function getFilteringDataStore() {
  if (!globalDataStoreInstance) {
    globalDataStoreInstance = createFilteringDataStore()
  }
  return globalDataStoreInstance
}

/**
 * Clean up the global data store instance
 * Call this when the viewer is destroyed or on route changes
 */
export function cleanupFilteringDataStore() {
  if (globalDataStoreInstance) {
    globalDataStoreInstance.clearDataOnRouteLeave()
    globalDataStoreInstance = null
  }
}

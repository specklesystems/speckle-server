import type { SpeckleObject, TreeNode, Viewer } from '@speckle/viewer'
import { uniq, flatten, compact } from 'lodash-es'
import {
  FilterLogic,
  FilterType,
  NumericFilterCondition,
  StringFilterCondition,
  ExistenceFilterCondition,
  BooleanFilterCondition
} from '~/lib/viewer/helpers/filters/types'
import type {
  DataSlice,
  QueryCriteria,
  DataSource,
  ResourceInfo,
  FilteringPropertyInfo,
  PropertyInfoBase
} from '~/lib/viewer/helpers/filters/types'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import {
  shouldExcludeFromFiltering,
  extractNestedProperties,
  isParameter
} from '~/lib/viewer/helpers/filters/utils'
import { DEEP_EXTRACTION_CONFIG } from '~/lib/viewer/helpers/filters/constants'

/**
 * Helper function to batch property map updates for better performance
 */
function processBatchedPropertyUpdates(
  updates: Array<{ path: string; value: unknown; type: string }>,
  propertyMap: Record<string, FilteringPropertyInfo>
) {
  for (const update of updates) {
    if (!propertyMap[update.path]) {
      // Convert string type to FilterType
      let filterType: FilterType
      if (update.type === 'number') {
        filterType = FilterType.Numeric
      } else if (update.type === 'boolean') {
        filterType = FilterType.Boolean
      } else {
        filterType = FilterType.String
      }

      propertyMap[update.path] = {
        concatenatedPath: update.path,
        value: update.value as string | number,
        type: filterType
      }
    }
  }
}

export function useCreateViewerFilteringDataStore() {
  const dataSourcesMap: Ref<Record<string, DataSource>> = ref({})
  const dataSources = computed(() => Object.values(dataSourcesMap.value))
  const currentFilterLogic = ref<FilterLogic>(FilterLogic.All)
  const dataSlices: Ref<DataSlice[]> = ref([])

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
      const propertyMap: Record<string, FilteringPropertyInfo> = {}
      // Map from objectId to its property values for efficient filtering
      const objectProperties: Record<string, Record<string, unknown>> = {}

      await tree.walkAsync((node: TreeNode) => {
        if (
          node.model.atomic &&
          node.model.id &&
          node.model.id.length === 32 &&
          !node.model.raw.speckle_type?.includes('Proxy') &&
          node.model.raw.properties?.builtInCategory !== 'OST_Levels'
        ) {
          const objectId = node.model.id
          objectMap[objectId] = node.model.raw as SpeckleObject

          // Extract all properties using the new property extractor
          const objProps: Record<string, unknown> = {}
          const extractedProperties: PropertyInfoBase[] = extractNestedProperties(
            node.model.raw as Record<string, unknown>
          )

          const pendingPropertyUpdates: Array<{
            path: string
            value: unknown
            type: string
          }> = []

          for (const prop of extractedProperties) {
            const fullPath = prop.concatenatedPath

            if (shouldExcludeFromFiltering(fullPath)) {
              continue
            }

            // Handle name-value pairs by collapsing them to just the value
            let finalValue: unknown
            let finalType: string

            if (isParameter(prop) && 'value' in prop) {
              // This is a name-value pair, extract just the value
              finalValue = prop.value
              finalType = prop.type
            } else if ('value' in prop) {
              // This already has a value
              finalValue = prop.value
              finalType = prop.type
            } else {
              // This is a regular property, we need to get the value from the object
              const value = prop.path.reduce(
                (current, key) => (current as Record<string, unknown>)?.[key],
                node.model.raw
              )

              if (value && isParameter(value)) {
                finalValue = (value as { value: unknown }).value
                finalType = typeof finalValue
              } else {
                finalValue = value
                finalType = prop.type
              }
            }

            if (finalValue !== null && finalValue !== undefined) {
              objProps[fullPath] = finalValue

              pendingPropertyUpdates.push({
                path: fullPath,
                value: finalValue,
                type: finalType
              })

              if (pendingPropertyUpdates.length >= DEEP_EXTRACTION_CONFIG.BATCH_SIZE) {
                processBatchedPropertyUpdates(pendingPropertyUpdates, propertyMap)
                pendingPropertyUpdates.length = 0
              }
            }
          }

          if (pendingPropertyUpdates.length > 0) {
            processBatchedPropertyUpdates(pendingPropertyUpdates, propertyMap)
          }

          objectProperties[objectId] = objProps
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
        objectProperties
      }
    }
  }

  const queryObjects = (criteria: QueryCriteria): string[] => {
    const matchingIds: string[] = []
    const PRECISION = 4 // matches 0.0001 step

    for (const dataSource of dataSources.value) {
      // Check if property exists in propertyMap
      const propertyInfo = dataSource.propertyMap[criteria.propertyKey]
      if (!propertyInfo) {
        continue
      }

      if (criteria.condition === ExistenceFilterCondition.IsSet) {
        // Find all objects that have this property - use pre-computed objectProperties
        for (const [objectId, objProps] of Object.entries(
          dataSource.objectProperties
        )) {
          const hasProperty = criteria.propertyKey in objProps
          if (hasProperty) {
            matchingIds.push(objectId)
          }
        }
      } else if (criteria.condition === ExistenceFilterCondition.IsNotSet) {
        // Find all objects that don't have this property
        for (const [objectId, objProps] of Object.entries(
          dataSource.objectProperties
        )) {
          const hasProperty = criteria.propertyKey in objProps
          if (!hasProperty) {
            matchingIds.push(objectId)
          }
        }
      } else if (criteria.condition === BooleanFilterCondition.IsTrue) {
        // Find all  where this property is true
        for (const [objectId, objProps] of Object.entries(
          dataSource.objectProperties
        )) {
          const value = objProps[criteria.propertyKey]
          if (value === true || value === 'true') {
            matchingIds.push(objectId)
          }
        }
      } else if (criteria.condition === BooleanFilterCondition.IsFalse) {
        // Find all objects where this property is false
        for (const [objectId, objProps] of Object.entries(
          dataSource.objectProperties
        )) {
          const value = objProps[criteria.propertyKey]
          if (value === false || value === 'false') {
            matchingIds.push(objectId)
          }
        }
      } else {
        // For value-based filtering, check each object
        for (const [objectId, objProps] of Object.entries(
          dataSource.objectProperties
        )) {
          const value = objProps[criteria.propertyKey]
          if (value === undefined) continue
          let shouldInclude = false

          if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
            // Numeric filtering
            const numericValue = Number(value)
            if (isNaN(numericValue)) continue

            const minValue = criteria.minValue ?? -Infinity
            const maxValue = criteria.maxValue ?? Infinity

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
                const tolerance = Math.pow(10, -PRECISION)
                shouldInclude = Math.abs(numericValue - minValue) <= tolerance
                break
              }
              case NumericFilterCondition.IsNotEqualTo: {
                const tolerance = Math.pow(10, -PRECISION)
                shouldInclude = Math.abs(numericValue - minValue) > tolerance
                break
              }
              default:
                shouldInclude = numericValue >= minValue && numericValue <= maxValue
            }
          } else if (criteria.condition === StringFilterCondition.Is) {
            // String filtering - exact match
            shouldInclude = criteria.values.includes(String(value))
          } else if (criteria.condition === StringFilterCondition.IsNot) {
            // String filtering - exclude values
            shouldInclude = !criteria.values.includes(String(value))
          }

          if (shouldInclude) {
            matchingIds.push(objectId)
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
      const result = uniq(validObjectIds)
      return result
    } else {
      const lastSlice = dataSlices.value[dataSlices.value.length - 1]
      const result = lastSlice?.intersectedObjectIds || []
      return result
    }
  }

  const clearDataOnRouteLeave = () => {
    dataSourcesMap.value = {}
    dataSlices.value = []
  }

  const setFilterLogic = (logic: FilterLogic) => {
    currentFilterLogic.value = logic
    computeSliceIntersections()
  }

  return {
    populateDataStore,
    queryObjects,
    pushOrReplaceSlice,
    popSlice,
    computeSliceIntersections,
    getFinalObjectIds,
    clearDataOnRouteLeave,
    setFilterLogic,
    currentFilterLogic,
    dataSlices,
    dataSources
  }
}

/**
 * Get the filtering data store from the current viewer state
 */
export function useFilteringDataStore() {
  const { viewer } = useInjectedViewerState()

  if (!viewer.metadata.filteringDataStore) {
    throw new Error(
      'Filtering data store not initialized. Ensure viewer is properly set up.'
    )
  }

  return viewer.metadata.filteringDataStore
}

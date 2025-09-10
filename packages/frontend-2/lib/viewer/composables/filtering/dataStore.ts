import type { SpeckleObject, TreeNode, Viewer } from '@speckle/viewer'
import { uniq, flatten, compact } from 'lodash-es'
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
  PropertyInfoBase
} from '~/lib/viewer/helpers/filters/types'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { shouldExcludeFromFiltering } from '~/lib/viewer/helpers/filters/utils'
import {
  DEEP_EXTRACTION_CONFIG,
  NON_FILTERABLE_OBJECT_KEYS
} from '~/lib/viewer/helpers/filters/constants'

/**
 * Helper function to batch property map updates for better performance
 */
function processBatchedPropertyUpdates(
  updates: Array<{ path: string; value: unknown; type: string }>,
  propertyMap: Record<string, PropertyInfoBase>
) {
  for (const update of updates) {
    if (!propertyMap[update.path]) {
      propertyMap[update.path] = {
        concatenatedPath: update.path,
        value: update.value,
        type: update.type
      } as PropertyInfoBase
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
      const propertyMap: Record<string, PropertyInfoBase> = {}
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

          // Extract all properties with deep traversal
          const objProps: Record<string, unknown> = {}

          const pendingPropertyUpdates: Array<{
            path: string
            value: unknown
            type: string
          }> = []

          const extractionQueue: Array<{
            obj: Record<string, unknown>
            basePath: string
            depth: number
          }> = [
            { obj: node.model.raw as Record<string, unknown>, basePath: '', depth: 0 }
          ]

          while (extractionQueue.length > 0) {
            const current = extractionQueue.shift()!
            const { obj, basePath, depth } = current

            if (
              depth >= DEEP_EXTRACTION_CONFIG.MAX_DEPTH ||
              !obj ||
              typeof obj !== 'object'
            ) {
              continue
            }

            for (const [key, value] of Object.entries(obj)) {
              if (value === null || value === undefined) {
                continue
              }

              const fullPath = basePath ? `${basePath}.${key}` : key

              if (shouldExcludeFromFiltering(fullPath)) {
                continue
              }

              if (typeof value !== 'object' || Array.isArray(value)) {
                objProps[fullPath] = value

                pendingPropertyUpdates.push({
                  path: fullPath,
                  value,
                  type: typeof value
                })

                if (
                  pendingPropertyUpdates.length >= DEEP_EXTRACTION_CONFIG.BATCH_SIZE
                ) {
                  processBatchedPropertyUpdates(pendingPropertyUpdates, propertyMap)
                  pendingPropertyUpdates.length = 0
                }
              } else {
                const nestedObj = value as Record<string, unknown>

                // Skip common non-filterable object types early for performance
                if (
                  NON_FILTERABLE_OBJECT_KEYS.includes(
                    key as (typeof NON_FILTERABLE_OBJECT_KEYS)[number]
                  ) ||
                  key.startsWith('__')
                ) {
                  continue
                }

                if (key === 'parameters') {
                  for (const [paramKey, paramObj] of Object.entries(nestedObj)) {
                    if (
                      paramObj &&
                      typeof paramObj === 'object' &&
                      !Array.isArray(paramObj)
                    ) {
                      const param = paramObj as Record<string, unknown>
                      if ('value' in param) {
                        const paramPath = `${fullPath}.${paramKey}.value`
                        if (!shouldExcludeFromFiltering(paramPath)) {
                          objProps[paramPath] = param.value
                          pendingPropertyUpdates.push({
                            path: paramPath,
                            value: param.value,
                            type: typeof param.value
                          })
                        }
                      }
                      extractionQueue.push({
                        obj: param,
                        basePath: `${fullPath}.${paramKey}`,
                        depth: depth + 2
                      })
                    }
                  }
                } else {
                  extractionQueue.push({
                    obj: nestedObj,
                    basePath: fullPath,
                    depth: depth + 1
                  })
                }
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

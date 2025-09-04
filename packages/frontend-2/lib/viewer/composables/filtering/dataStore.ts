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

export function createViewerFilteringDataStore() {
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

          // Extract only commonly used properties - avoid expensive full traversal
          const objProps: Record<string, unknown> = {}

          // Direct properties
          for (const [key, value] of Object.entries(node.model.raw)) {
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
              const path = key
              objProps[path] = value
              if (!propertyMap[path]) {
                propertyMap[path] = {
                  concatenatedPath: path,
                  value,
                  type: typeof value
                } as PropertyInfoBase
              }
            }
          }

          // Properties.* (one level)
          const props = node.model.raw.properties
          if (props && typeof props === 'object' && !Array.isArray(props)) {
            for (const [key, value] of Object.entries(
              props as Record<string, unknown>
            )) {
              if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                const path = `properties.${key}`
                objProps[path] = value
                if (!propertyMap[path]) {
                  propertyMap[path] = {
                    concatenatedPath: path,
                    value,
                    type: typeof value
                  } as PropertyInfoBase
                }
              }
            }
          }

          // Parameters.*.value (Revit objects)
          const params = node.model.raw.parameters
          if (params && typeof params === 'object' && !Array.isArray(params)) {
            for (const [key, paramObj] of Object.entries(
              params as Record<string, unknown>
            )) {
              if (
                paramObj &&
                typeof paramObj === 'object' &&
                !Array.isArray(paramObj)
              ) {
                const param = paramObj as Record<string, unknown>
                if ('value' in param) {
                  const path = `parameters.${key}.value`
                  objProps[path] = param.value
                  if (!propertyMap[path]) {
                    propertyMap[path] = {
                      concatenatedPath: path,
                      value: param.value,
                      type: typeof param.value
                    } as PropertyInfoBase
                  }
                }
              }
            }
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

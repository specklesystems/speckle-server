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
      // Pre-computed property to object IDs mapping for instant filter creation
      const propertyToObjectIds: Record<string, Record<string, string[]>> = {}

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

          // Build property-to-objectIds mapping for fast filter creation
          for (const [propKey, propValue] of Object.entries(objProps)) {
            if (!propertyToObjectIds[propKey]) {
              propertyToObjectIds[propKey] = {}
            }
            const stringValue = String(propValue)
            if (!propertyToObjectIds[propKey][stringValue]) {
              propertyToObjectIds[propKey][stringValue] = []
            }
            propertyToObjectIds[propKey][stringValue].push(objectId)
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
        objectProperties,
        propertyToObjectIds
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

      // Use pre-computed property mapping for instant lookups
      const propertyMapping = dataSource.propertyToObjectIds[criteria.propertyKey]

      if (criteria.condition === ExistenceFilterCondition.IsSet) {
        // Find all objects that have this property - use pre-computed mapping
        if (propertyMapping) {
          for (const objectIds of Object.values(propertyMapping)) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === ExistenceFilterCondition.IsNotSet) {
        // Find all objects that don't have this property
        const objectsWithProperty = new Set<string>()
        if (propertyMapping) {
          for (const objectIds of Object.values(propertyMapping)) {
            objectIds.forEach((id) => objectsWithProperty.add(id))
          }
        }

        for (const objectId of Object.keys(dataSource.objectMap)) {
          if (!objectsWithProperty.has(objectId)) {
            matchingIds.push(objectId)
          }
        }
      } else if (!propertyMapping) {
        // Property doesn't exist in this data source
        continue
      } else if (criteria.minValue !== undefined || criteria.maxValue !== undefined) {
        // Numeric filtering - use pre-computed mapping
        const minValue = criteria.minValue ?? -Infinity
        const maxValue = criteria.maxValue ?? Infinity

        for (const [value, objectIds] of Object.entries(propertyMapping)) {
          const numericValue = Number(value)
          if (isNaN(numericValue)) continue

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

          if (shouldInclude) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === StringFilterCondition.Is) {
        // String filtering - use pre-computed mapping for instant lookup
        for (const value of criteria.values) {
          const objectIds = propertyMapping[value]
          if (objectIds) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === StringFilterCondition.IsNot) {
        // String filtering - exclude values using pre-computed mapping
        const excludeValues = new Set(criteria.values)
        for (const [value, objectIds] of Object.entries(propertyMapping)) {
          if (!excludeValues.has(value)) {
            matchingIds.push(...objectIds)
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

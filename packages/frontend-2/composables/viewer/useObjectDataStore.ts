import type { SpeckleObject, TreeNode, Viewer } from '@speckle/viewer'
import { FilterCondition, FilterLogic } from '~/lib/viewer/helpers/filters/types'

export type PropertyInfoBase = {
  concatenatedPath: string
  [key: string]: unknown
}

export type DataSlice = {
  id: string
  name: string
  objectIds: string[]
  intersectedObjectIds?: string[]
}

export type QueryCriteria = {
  propertyKey: string
  condition: FilterCondition
  values: string[]
}

export type DataSource = {
  resourceUrl: string
  viewerInstance: Viewer
  rootObject: SpeckleObject | null
  objectMap: Record<string, SpeckleObject>
  propertyMap: Record<string, PropertyInfoBase>
  propertyIndex: Record<string, Record<string, string[]>> // propertyKey -> value -> objectIds[]
}

export type ResourceInfo = {
  resourceUrl: string
}

/**
 * Extracts nested properties from an object, similar to the viewer's property extraction
 */
function extractNestedProperties(obj: Record<string, unknown>): PropertyInfoBase[] {
  const properties: PropertyInfoBase[] = []

  function traverse(current: Record<string, unknown>, path: string[] = []) {
    for (const [key, value] of Object.entries(current)) {
      const currentPath = [...path, key]
      const concatenatedPath = currentPath.join('.')

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Recurse into nested objects
        traverse(value as Record<string, unknown>, currentPath)
      } else {
        // Add primitive values
        properties.push({
          concatenatedPath,
          value,
          type: typeof value
        } as PropertyInfoBase)
      }
    }
  }

  traverse(obj)
  return properties
}

// Global singleton state
const globalDataSourcesMap: Ref<Record<string, DataSource>> = ref({})
const globalDataSlices: Ref<DataSlice[]> = ref([])
const globalCurrentFilterLogic = ref<FilterLogic>(FilterLogic.All)

/**
 * Object data store for viewer filtering and data slicing operations.
 *
 * Based on the dashboard's objectDataStore pattern, this provides:
 * - Multi-resource object and property management
 * - Slice-based filtering with intersection logic
 * - Property extraction from viewer objects
 * - Query capabilities for filtering operations
 */
export function useObjectDataStore() {
  const logger = useLogger()

  const dataSourcesMap = globalDataSourcesMap
  const dataSources = computed(() => Object.values(dataSourcesMap.value))

  // Use global singleton state
  const currentFilterLogic = globalCurrentFilterLogic
  const selectedObjectIds = ref<string[]>([])
  const dataSlices = globalDataSlices

  /**
   * For each passed in resource info, traverses the viewer's world tree and
   * creates an appropriate data source.
   */
  async function populateDataStore(viewer: Viewer, resources: ResourceInfo[]) {
    const tree = viewer.getWorldTree()
    if (!tree) return

    for (const res of resources) {
      const foundNodes = tree.findId(res.resourceUrl)
      const subnode = foundNodes?.[0]
      if (!subnode) continue

      const objectMap: Record<string, SpeckleObject> = {}
      const propertyMap: Record<string, PropertyInfoBase> = {}
      const propertyIndex: Record<string, Record<string, string[]>> = {}

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

            // Build property index: propertyKey -> value -> objectIds[]
            const propertyKey = p.concatenatedPath
            const value = String(p.value)

            if (!propertyIndex[propertyKey]) {
              propertyIndex[propertyKey] = {}
            }
            if (!propertyIndex[propertyKey][value]) {
              propertyIndex[propertyKey][value] = []
            }
            propertyIndex[propertyKey][value].push(objectId)
          }
        }
        return true
      }, subnode)

      const rootObject = subnode.model.raw.children?.[0] as SpeckleObject

      dataSourcesMap.value[res.resourceUrl] = {
        ...res,
        viewerInstance: markRaw(viewer), // Viewer instance - avoid reactivity (circular refs, performance)
        rootObject: rootObject ? markRaw(rootObject) : null, // Root object - avoid reactivity, handle null
        objectMap: markRaw(objectMap), // Object map - avoid reactivity (large, doesn't need to be reactive)
        propertyMap, // Keep reactive - used for UI
        propertyIndex: markRaw(propertyIndex) // Index - avoid reactivity (large, static after creation)
      }
    }
  }

  /**
   * Iterates through all objects in given resources without blocking the UI
   */
  async function iterateAsync(
    resourceUrls: string[],
    predicate: (obj: SpeckleObject, parentDataSource: DataSource) => void
  ) {
    const dataSourceTargets: DataSource[] = resourceUrls.map(
      (url) => dataSourcesMap.value[url]!
    )

    for (const ds of dataSourceTargets) {
      if (!ds) {
        logger.error('Datasource was undefined')
        continue
      }
      for (const key in ds.objectMap) {
        predicate(ds.objectMap[key]!, ds)
      }
    }
  }

  /**
   * Queries objects based on criteria across all data sources using indexed lookups
   */
  function queryObjects(criteria: QueryCriteria): string[] {
    const matchingIds: string[] = []

    for (const dataSource of dataSources.value) {
      const propertyIndex = dataSource.propertyIndex[criteria.propertyKey]
      if (!propertyIndex) continue

      if (criteria.condition === FilterCondition.Is) {
        // "Is" condition: collect objects with matching values
        for (const value of criteria.values) {
          const objectIds = propertyIndex[value]
          if (objectIds) {
            matchingIds.push(...objectIds)
          }
        }
      } else if (criteria.condition === FilterCondition.IsNot) {
        // "Is not" condition: collect objects with non-matching values
        const excludeValues = new Set(criteria.values)
        for (const [value, objectIds] of Object.entries(propertyIndex)) {
          if (!excludeValues.has(value)) {
            matchingIds.push(...objectIds)
          }
        }
      }
    }

    return matchingIds
  }

  /**
   * Removes a data source
   */
  function removeDataSource(id: string) {
    const newDataSources: Record<string, DataSource> = {}
    for (const key in dataSourcesMap.value) {
      if (key !== id) {
        newDataSources[key] = dataSourcesMap.value[key]!
      }
    }
    dataSourcesMap.value = newDataSources
  }

  // Computes intersection of all slices for AND logic
  const computeSliceIntersections = () => {
    if (dataSlices.value.length < 1) return

    if (dataSlices.value.length === 1) {
      // Single slice - use its objectIds directly
      dataSlices.value[0]!.intersectedObjectIds = [...dataSlices.value[0]!.objectIds]
      return
    }

    // Multiple slices - compute intersection of ALL slices
    let intersection = new Set(dataSlices.value[0]!.objectIds)

    for (let i = 1; i < dataSlices.value.length; i++) {
      const currentSliceIds = new Set(dataSlices.value[i]!.objectIds)
      intersection = new Set([...intersection].filter((id) => currentSliceIds.has(id)))
    }

    const intersectionArray = Array.from(intersection)

    // Update all slices to have the same intersection result
    for (const slice of dataSlices.value) {
      slice.intersectedObjectIds = intersectionArray
    }
  }

  function pushOrReplaceSlice(dataSlice: DataSlice) {
    const existingIndex = dataSlices.value.findIndex(
      (slice) => slice.id === dataSlice.id
    )
    if (existingIndex === -1) {
      // If it's not present, push
      dataSlices.value.push(dataSlice)
    } else {
      // Replace existing slice
      dataSlices.value[existingIndex] = dataSlice
    }

    // Always compute intersections for slice management
    computeSliceIntersections()
  }

  function replaceExistingSlice(dataSlice: DataSlice) {
    const existingIndex = dataSlices.value.findIndex(
      (slice) => slice.id === dataSlice.id
    )
    if (existingIndex !== -1) {
      dataSlices.value[existingIndex] = dataSlice
      computeSliceIntersections()
    }
  }

  // Remove slice function
  function popSlice(dataSlice: DataSlice) {
    const existingIndex = dataSlices.value.findIndex(
      (slice) => slice.id === dataSlice.id
    )
    if (existingIndex !== -1) {
      dataSlices.value.splice(existingIndex, 1)
      computeSliceIntersections()
    }
  }

  /**
   * Gets the final filtered object IDs (intersection or union of all slices)
   */
  const finalObjectIds = computed(() => {
    if (dataSlices.value.length === 0) return []

    if (currentFilterLogic.value === FilterLogic.Any) {
      // OR logic: union of all slice objectIds
      const allObjectIds = new Set<string>()
      for (const slice of dataSlices.value) {
        if (slice.objectIds && Array.isArray(slice.objectIds)) {
          for (const objectId of slice.objectIds) {
            if (objectId) {
              allObjectIds.add(objectId)
            }
          }
        }
      }
      const result = Array.from(allObjectIds)

      return result
    } else {
      // AND logic: intersection of all slices
      const lastSlice = dataSlices.value[dataSlices.value.length - 1]
      const result = lastSlice?.intersectedObjectIds || []

      return result
    }
  })

  /**
   * Gets available properties for filtering
   */
  const availableProperties = computed(() => {
    const allProps: PropertyInfoBase[] = []
    for (const dataSource of dataSources.value) {
      allProps.push(...Object.values(dataSource.propertyMap))
    }
    return allProps
  })

  const blockDataSourceWatchers = ref(false)

  const clearDataOnRouteLeave = () => {
    dataSourcesMap.value = {}
    dataSlices.value = []
    blockDataSourceWatchers.value = true
  }

  const setFilterLogic = (logic: FilterLogic) => {
    currentFilterLogic.value = logic
  }

  return {
    populateDataStore,
    removeDataSource,
    iterateAsync,
    dataSourcesMap,
    dataSources,
    selectedObjectIds,
    dataSlices,
    pushOrReplaceSlice,
    replaceExistingSlice,
    popSlice,
    clearDataOnRouteLeave,
    blockDataSourceWatchers,
    queryObjects,
    finalObjectIds,
    availableProperties,
    setFilterLogic,
    currentFilterLogic
  }
}

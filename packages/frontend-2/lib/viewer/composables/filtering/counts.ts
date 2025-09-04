import type { PropertyInfo } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import {
  ExistenceFilterCondition,
  type FilterData
} from '~/lib/viewer/helpers/filters/types'

/**
 * Get count of filtered objects from the viewer state.
 */
export function useFilteredObjectsCount() {
  const {
    ui: { filters }
  } = useInjectedViewerState()

  return {
    filteredObjectsCount: readonly(filters.filteredObjectsCount)
  }
}

let valueGroupCountCache = new WeakMap<PropertyInfo, Map<string, number>>()
let existenceCountCache = new WeakMap<
  PropertyInfo,
  { isSet: number; isNotSet: number }
>()

/**
 * Get count for a specific filter value (optimized for large datasets)
 */
export function getFilterValueCount(filter: PropertyInfo, value: string): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return 0
  }

  if (valueGroupCountCache.has(filter)) {
    const countMap = valueGroupCountCache.get(filter)!
    return countMap.get(value) ?? 0
  }

  const valueGroups = filter.valueGroups as Array<{ value: unknown; ids?: string[] }>
  const countMap = new Map<string, number>()

  for (const vg of valueGroups) {
    const key = String(vg.value)
    const count = vg.ids?.length ?? 0
    countMap.set(key, count)
  }

  valueGroupCountCache.set(filter, countMap)
  return countMap.get(value) ?? 0
}

/**
 * Get count for existence filters (objects that have/don't have a property set)
 * This is optimized to use valueGroups for fast counting
 */
export function getExistenceFilterCount(
  filter: PropertyInfo,
  condition: ExistenceFilterCondition,
  totalObjectCount?: number
): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return filter.objectCount ?? 0
  }

  if (existenceCountCache.has(filter)) {
    const cached = existenceCountCache.get(filter)!
    if (condition === ExistenceFilterCondition.IsSet) {
      return cached.isSet
    } else {
      return totalObjectCount !== undefined
        ? Math.max(0, totalObjectCount - cached.isSet)
        : cached.isNotSet
    }
  }

  const objectsWithProperty = filter.valueGroups.reduce((total, vg) => {
    if ('ids' in vg && Array.isArray(vg.ids)) {
      return total + vg.ids.length
    }
    return total
  }, 0)

  const isNotSetCount =
    totalObjectCount !== undefined
      ? Math.max(0, totalObjectCount - objectsWithProperty)
      : 0

  existenceCountCache.set(filter, {
    isSet: objectsWithProperty,
    isNotSet: isNotSetCount
  })

  if (condition === ExistenceFilterCondition.IsSet) {
    return objectsWithProperty
  } else {
    return isNotSetCount
  }
}

/**
 * Composable for getting existence filter counts with proper optimization
 */
export function useExistenceFilterCount(filter: FilterData) {
  const { viewer } = useInjectedViewerState()

  const totalObjectCount = computed(() => {
    return viewer.metadata.worldTree.value?.nodeCount ?? 0
  })

  const condition = computed(() =>
    filter.condition === ExistenceFilterCondition.IsNotSet
      ? ExistenceFilterCondition.IsNotSet
      : ExistenceFilterCondition.IsSet
  )

  const displayCount = computed(() => {
    if (!filter.filter) return 0
    return getExistenceFilterCount(
      filter.filter,
      condition.value,
      totalObjectCount.value
    )
  })

  return {
    displayCount: readonly(displayCount)
  }
}

/**
 * Clean up the value group count cache
 * Call this when cleaning up the filtering system
 */
export function cleanupValueGroupCountCache() {
  valueGroupCountCache = new WeakMap()
  existenceCountCache = new WeakMap()
}

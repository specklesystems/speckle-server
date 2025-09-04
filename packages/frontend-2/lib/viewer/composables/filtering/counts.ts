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

  const objectsWithProperty = filter.valueGroups.reduce((total, vg) => {
    if ('ids' in vg && Array.isArray(vg.ids)) {
      return total + vg.ids.length
    }
    return total
  }, 0)

  if (condition === ExistenceFilterCondition.IsSet) {
    return objectsWithProperty
  } else {
    return totalObjectCount !== undefined
      ? Math.max(0, totalObjectCount - objectsWithProperty)
      : 0
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

import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import {
  ExistenceFilterCondition,
  type FilterData
} from '~/lib/viewer/helpers/filters/types'
import { getExistenceFilterCount } from '~/lib/viewer/helpers/filters/utils'

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

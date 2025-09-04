import { FilteringExtension, ViewerEvent } from '@speckle/viewer'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

/**
 * Integration composable that manages filteredObjectsCount in the viewer state.
 */
export const useFilteredObjectsCountPostSetup = () => {
  const {
    ui: { filters },
    viewer: { instance }
  } = useInjectedViewerState()

  const updateCount = () => {
    const filteringExtension = instance.getExtension(FilteringExtension)
    if (!filteringExtension) return

    const isolatedObjects = filteringExtension.filteringState.isolatedObjects

    const hasAppliedFilters = filters.propertyFilters.value.some(
      (f) =>
        f.isApplied &&
        (f.selectedValues.length > 0 ||
          ('isDefaultAllSelected' in f && f.isDefaultAllSelected))
    )

    if (!hasAppliedFilters) {
      filters.filteredObjectsCount.value = 0
      return
    }

    const rawCount = isolatedObjects?.length || 0

    // Ghost object that is used to represent objects that don't match the filter
    const isGhostOnly = rawCount === 1 && isolatedObjects?.[0] === 'no-match-ghost-all'

    if (isGhostOnly) {
      filters.filteredObjectsCount.value = 0
      return
    }

    const realObjectCount =
      isolatedObjects?.filter((id) => id !== 'no-match-ghost-all').length || 0
    filters.filteredObjectsCount.value = realObjectCount
  }

  useOnViewerLoadComplete(() => {
    const filteringExtension = instance.getExtension(FilteringExtension)

    filteringExtension.on(ViewerEvent.FilteringStateSet, updateCount)
    updateCount()
  })

  onBeforeUnmount(() => {
    const filteringExtension = instance?.getExtension(FilteringExtension)
    if (filteringExtension) {
      filteringExtension.removeListener(ViewerEvent.FilteringStateSet, updateCount)
    }
  })
}

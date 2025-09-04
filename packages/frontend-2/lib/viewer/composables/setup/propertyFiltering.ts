import { FilteringExtension } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'

/**
 * Integration composable for property-based filtering.
 * Should be invoked once during post-setup after the viewer is initialized.
 */
export const usePropertyFilteringPostSetup = () => {
  const {
    ui: { filters },
    viewer: { instance }
  } = useInjectedViewerState()

  const dataStore = useFilteringDataStore()
  const filteringExtension = () => instance.getExtension(FilteringExtension)

  /**
   * Apply property filters to the viewer based on current state
   */
  const applyPropertyFilters = () => {
    const objectIds = dataStore.getFinalObjectIds()
    const extension = filteringExtension()

    extension.resetFilters()

    const hasAppliedFilters = filters.propertyFilters.value.some(
      (filter) => filter.isApplied
    )

    if (objectIds.length > 0) {
      extension.isolateObjects(objectIds, 'property-filters', false, true)
    } else if (hasAppliedFilters) {
      // Show "no results" ghost object
      extension.isolateObjects(['no-match-ghost-all'], 'property-filters', false, true)
    }
  }

  /**
   * Watch for changes to property filters and apply them to the viewer
   */
  const { trigger: triggerDataSlicesWatch } = watchTriggerable(
    dataStore.dataSlices,
    (newSlices, oldSlices) => {
      if (newSlices === oldSlices) return

      applyPropertyFilters()
    },
    { deep: true }
  )

  /**
   * Watch for changes to filter logic (AND/OR)
   */
  watchTriggerable(dataStore.currentFilterLogic, (newLogic, oldLogic) => {
    if (newLogic !== oldLogic) {
      dataStore.computeSliceIntersections()
      applyPropertyFilters()
    }
  })

  /**
   * Watch for filter resets - when all property filters are removed
   */
  watch(
    () => filters.propertyFilters.value.length,
    (filterCount, prevFilterCount) => {
      if (prevFilterCount > 0 && filterCount === 0) {
        const extension = filteringExtension()
        extension.resetFilters()
      }
    }
  )

  /**
   * Initialize property filters on viewer load
   */
  useOnViewerLoadComplete(
    () => {
      triggerDataSlicesWatch()
    },
    { initialOnly: true }
  )

  onBeforeUnmount(() => {
    filteringExtension().resetFilters()
  })
}

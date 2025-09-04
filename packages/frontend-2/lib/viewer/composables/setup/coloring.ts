import { FilteringExtension } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'

/**
 * Integration composable that sets up watchers to sync state with the viewer.
 * This should only be called once during post-setup after the viewer is initialized.
 */
export const useFilterColoringPostSetup = () => {
  const {
    ui: { filters },
    viewer: { instance }
  } = useInjectedViewerState()

  const filteringExtension = () => instance.getExtension(FilteringExtension)

  /**
   * Watch for changes to activeColorFilterId and apply/remove color filters accordingly
   */
  const { trigger: triggerColorFilterWatch, ignoreUpdates: ignoreColorFilterUpdates } =
    watchTriggerable(filters.activeColorFilterId, (newFilterId, oldFilterId) => {
      if (newFilterId === oldFilterId) return

      const extension = filteringExtension()

      if (!newFilterId) {
        extension.removeColorFilter()
        return
      }

      const filter = filters.propertyFilters.value.find((f) => f.id === newFilterId)
      if (filter?.filter) {
        extension.removeColorFilter()
        extension.setColorFilter(filter.filter)
      } else {
        ignoreColorFilterUpdates(() => {
          filters.activeColorFilterId.value = null
        })
      }
    })

  /**
   * Watch for changes to propertyFilters to validate activeColorFilterId
   * and re-apply color filter after property filters are updated
   */
  watchTriggerable(
    filters.propertyFilters,
    () => {
      const activeFilterId = filters.activeColorFilterId.value
      if (!activeFilterId) return

      const activeFilter = filters.propertyFilters.value.find(
        (f) => f.id === activeFilterId
      )

      if (!activeFilter) {
        ignoreColorFilterUpdates(() => {
          filters.activeColorFilterId.value = null
        })
      } else {
        if (activeFilter.filter) {
          const extension = filteringExtension()
          extension.setColorFilter(activeFilter.filter)
        }
      }
    },
    { deep: true }
  )

  /**
   * Watch for filter resets - when all property filters are removed, clear color filter
   */
  watch(
    () => filters.propertyFilters.value.length,
    (filterCount, prevFilterCount) => {
      if (prevFilterCount > 0 && filterCount === 0) {
        const extension = filteringExtension()
        extension.removeColorFilter()
      }
    }
  )

  /**
   * Initialize color filter on viewer load
   */
  useOnViewerLoadComplete(
    () => {
      triggerColorFilterWatch()
    },
    { initialOnly: true }
  )

  onBeforeUnmount(() => {
    filteringExtension().removeColorFilter()
  })
}

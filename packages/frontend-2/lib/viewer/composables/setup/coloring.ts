import { FilteringExtension } from '@speckle/viewer'
import type { NumericPropertyInfo } from '@speckle/viewer'
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
    viewer
  } = useInjectedViewerState()

  const filteringExtension = () => viewer.instance.getExtension(FilteringExtension)

  /**
   * Sets color filter for numeric filters using setColorFilter
   */
  const setNumericColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter || filter.type !== 'numeric' || filter.filter.type !== 'number')
      return

    const numericFilter = filter.filter as NumericPropertyInfo
    // Use the same rounding precision as the filtering logic to avoid floating point issues
    const min = parseFloat(filter.numericRange.min.toFixed(4))
    const max = parseFloat(filter.numericRange.max.toFixed(4))

    const updatedFilter: NumericPropertyInfo = {
      key: numericFilter.key,
      objectCount: numericFilter.objectCount,
      type: numericFilter.type,
      min: numericFilter.min,
      max: numericFilter.max,
      valueGroups: numericFilter.valueGroups,
      passMin: min,
      passMax: max
    }

    const extension = filteringExtension()
    extension.setColorFilter(updatedFilter)
  }

  /**
   * Sets color filter for string filters using setColorFilter
   */
  const setStringColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter || filter.type !== 'string') return

    const extension = filteringExtension()
    extension.setColorFilter(filter.filter)
  }

  /**
   * Removes the active color filter by calling the viewer extension
   */
  const removeColorFilter = () => {
    const extension = filteringExtension()
    extension.removeColorFilter()
  }

  /**
   * Watch for changes to activeColorFilterId and apply/remove color filters accordingly
   */
  const { trigger: triggerColorFilterWatch, ignoreUpdates: ignoreColorFilterUpdates } =
    watchTriggerable(filters.activeColorFilterId, (newFilterId, oldFilterId) => {
      if (newFilterId === oldFilterId) return

      if (!newFilterId) {
        removeColorFilter()
        return
      }

      const filter = filters.propertyFilters.value.find((f) => f.id === newFilterId)
      if (filter?.filter) {
        if (filter.type === 'numeric') {
          setNumericColorFilter(newFilterId)
        } else {
          setStringColorFilter(newFilterId)
        }
      } else {
        ignoreColorFilterUpdates(() => {
          filters.activeColorFilterId.value = null
        })
      }
    })

  /**
   * Watch for changes to propertyFilters to validate activeColorFilterId
   * Only re-apply colors when filter structure changes, not when values change
   */
  watchTriggerable(
    () =>
      filters.propertyFilters.value.map((f) => ({
        id: f.id,
        key: f.filter?.key,
        type: f.type
      })),
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
          if (activeFilter.type === 'numeric') {
            setNumericColorFilter(activeFilterId)
          } else {
            setStringColorFilter(activeFilterId)
          }
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
        removeColorFilter()
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
    removeColorFilter()
  })
}

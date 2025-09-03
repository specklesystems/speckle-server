import { FilteringExtension } from '@speckle/viewer'
import type { ColorGroup } from '~/lib/viewer/helpers/filters/types'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

export function useFilterColors(options?: Partial<{ state: InjectableViewerState }>) {
  const state = options?.state || useInjectedViewerState()
  const {
    viewer,
    ui: { filters }
  } = state

  /**
   * Applies color filtering to objects based on a property filter
   */
  const setColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter) return

    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.removeColorFilter()
    filteringExtension.setColorFilter(filter.filter)
    filters.activeColorFilterId.value = filterId
  }

  /**
   * Removes color filtering from all objects
   */
  const removeColorFilter = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    filteringExtension.removeColorFilter()
    filters.activeColorFilterId.value = null
  }

  /**
   * Toggles color filtering for a specific filter
   */
  const toggleColorFilter = (filterId: string) => {
    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    } else {
      setColorFilter(filterId)
    }
  }

  /**
   * Gets the color groups from the FilteringExtension for the currently active color filter
   */
  const getFilterColorGroups = (): ColorGroup[] => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    const filteringState = filteringExtension.filteringState

    if (
      (!filteringState.colorGroups || filteringState.colorGroups.length === 0) &&
      filters.activeColorFilterId.value
    ) {
      filters.activeColorFilterId.value = null
    }

    return filteringState.colorGroups || []
  }

  /**
   * Gets the color for a specific filter value
   */
  const getFilterValueColor = (value: string): string | null => {
    const colorGroups = getFilterColorGroups()
    const colorGroup = colorGroups.find((group) => group.value === value)

    if (!colorGroup?.color) return null

    const color = colorGroup.color
    return color.startsWith('#') ? color : `#${color}`
  }

  /**
   * Checks if a filter is currently being used for color filtering
   */
  const isColorFilterActive = (filterId: string): boolean => {
    return filters.activeColorFilterId.value === filterId
  }

  return {
    // State
    activeColorFilterId: filters.activeColorFilterId,

    // Functions
    setColorFilter,
    removeColorFilter,
    toggleColorFilter,
    getFilterColorGroups,
    getFilterValueColor,
    isColorFilterActive
  }
}

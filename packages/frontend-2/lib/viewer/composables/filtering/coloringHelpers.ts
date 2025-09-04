import { FilteringExtension } from '@speckle/viewer'
import type { ColorGroup } from '~/lib/viewer/helpers/filters/types'
import type { InjectableViewerState } from '~~/lib/viewer/composables/setup'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

/**
 * Helper composable for filter coloring functionality.
 * The actual viewer integration is handled by the integration composable via watchers.
 */
export function useFilterColoringHelpers(
  options?: Partial<{ state: InjectableViewerState }>
) {
  const state = options?.state || useInjectedViewerState()
  const {
    viewer,
    ui: { filters }
  } = state

  /**
   * Sets the active color filter by updating the state.
   */
  const setColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter) return

    filters.activeColorFilterId.value = filterId
  }

  /**
   * Removes the active color filter by clearing the state.
   */
  const removeColorFilter = () => {
    filters.activeColorFilterId.value = null
  }

  /**
   * Toggles color filtering for a specific filter by updating state only.
   */
  const toggleColorFilter = (filterId: string) => {
    if (filters.activeColorFilterId.value === filterId) {
      removeColorFilter()
    } else {
      setColorFilter(filterId)
    }
  }

  /**
   * Gets the color groups from the FilteringExtension for the currently active color filter.
   */
  const getFilterColorGroups = (): ColorGroup[] => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    const filteringState = filteringExtension.filteringState

    return filteringState.colorGroups || []
  }

  /**
   * Gets the color for a specific filter value.
   */
  const getFilterValueColor = (value: string): string | null => {
    const colorGroups = getFilterColorGroups()
    const colorGroup = colorGroups.find((group) => group.value === value)

    if (!colorGroup?.color) return null

    const color = colorGroup.color
    return color.startsWith('#') ? color : `#${color}`
  }

  /**
   * Checks if a filter is currently being used for color filtering.
   */
  const isColorFilterActive = (filterId: string): boolean => {
    return filters.activeColorFilterId.value === filterId
  }

  return {
    activeColorFilterId: readonly(filters.activeColorFilterId),
    setColorFilter,
    removeColorFilter,
    toggleColorFilter,
    getFilterColorGroups,
    getFilterValueColor,
    isColorFilterActive
  }
}

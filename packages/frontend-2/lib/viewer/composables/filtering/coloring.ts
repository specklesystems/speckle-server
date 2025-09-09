import { FilteringExtension, type NumericPropertyInfo } from '@speckle/viewer'
import {
  useInjectedViewerState,
  type InjectableViewerState
} from '~/lib/viewer/composables/setup'
import {
  generateColorForNumericValue,
  generateColorForStringValue
} from '~/lib/viewer/helpers/coloring/utils'
import type { ColorGroup } from '~/lib/viewer/helpers/coloring/types'

export function useFilterColoringUtilities(
  options?: Partial<{ state: InjectableViewerState }>
) {
  const state = options?.state || useInjectedViewerState()
  const {
    viewer,
    ui: { filters, coloring }
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

    return (filteringState.colorGroups || []).map((group) => ({
      objectIds: group.ids,
      color: group.color
    }))
  }

  /**
   * Gets the property color groups from the centralized state.
   */
  const getPropertyColorGroups = () => {
    return coloring.propertyColorGroups.value
  }

  /**
   * Gets the color for a specific filter value.
   * For string filters, uses the viewer's colorGroups.
   * For numeric filters, uses our centralized property color groups.
   */
  const getFilterValueColor = (value: string): string | null => {
    const activeFilterId = filters.activeColorFilterId.value
    if (!activeFilterId) return null

    const filter = filters.propertyFilters.value.find((f) => f.id === activeFilterId)
    if (!filter?.filter) return null

    if (filter.type === 'string') {
      // For string filters, generate the same color we use in the centralized state
      return generateColorForStringValue(value)
    } else if (filter.type === 'numeric') {
      // For numeric filters, calculate the same color we used when setting up the color groups
      const numericFilter = filter.filter as NumericPropertyInfo
      const valueGroup = numericFilter.valueGroups?.find(
        (vg) => String(vg.value) === value
      )

      if (!valueGroup) return null

      // Use the same rounding precision as the filtering logic
      const min = parseFloat(filter.numericRange.min.toFixed(4))
      const max = parseFloat(filter.numericRange.max.toFixed(4))

      return generateColorForNumericValue(valueGroup.value, min, max)
    }

    return null
  }

  /**
   * Checks if a filter is currently being used for color filtering.
   */
  const isColorFilterActive = (filterId: string): boolean => {
    return filters.activeColorFilterId.value === filterId
  }

  return {
    activeColorFilterId: computed(() => filters.activeColorFilterId.value),
    setColorFilter,
    removeColorFilter,
    toggleColorFilter,
    getFilterColorGroups,
    getPropertyColorGroups,
    getFilterValueColor,
    isColorFilterActive
  }
}

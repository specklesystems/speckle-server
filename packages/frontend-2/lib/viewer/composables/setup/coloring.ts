import { FilteringExtension } from '@speckle/viewer'
import type { NumericPropertyInfo, StringPropertyInfo } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'
import type {
  ColorGroupWithSource,
  ColorGroup
} from '~/lib/viewer/helpers/coloring/types'
import {
  createNumericFilterColorGroups,
  createStringFilterColorGroups
} from '~/lib/viewer/helpers/coloring/utils'

/**
 * Setup composable for coloring-related state
 */
export const useColoringSetup = () => {
  // Centralized color state - property colors and highlights
  const coloredObjectGroups = ref<Array<ColorGroupWithSource>>([])

  // Computed properties for different color sources
  const propertyColorGroups = computed(() => {
    return coloredObjectGroups.value
      .filter((group) => group.source === 'property')
      .map((group) => ({ objectIds: group.objectIds, color: group.color }))
  })

  const highlightColorGroups = computed(() => {
    return coloredObjectGroups.value
      .filter((group) => group.source === 'highlight')
      .map((group) => ({ objectIds: group.objectIds, color: group.color }))
  })

  // Final merged color groups - highlights override property colors
  const finalColorGroups = computed(() => {
    const groups: Array<ColorGroup> = []

    // Add property-based colors first (lower priority)
    groups.push(...propertyColorGroups.value)

    // Add highlights on top (higher priority)
    // Highlights should override property colors for highlighted objects
    groups.push(...highlightColorGroups.value)

    return groups
  })

  return {
    coloring: {
      coloredObjectGroups,
      propertyColorGroups,
      highlightColorGroups,
      finalColorGroups
    }
  }
}

/**
 * Integration composable that sets up watchers to sync state with the viewer.
 * This should only be called once during post-setup after the viewer is initialized.
 */
export const useFilterColoringPostSetup = () => {
  const {
    ui: { filters, coloring },
    viewer
  } = useInjectedViewerState()

  const filteringExtension = () => viewer.instance.getExtension(FilteringExtension)

  /**
   * Helper to apply colors respecting current isolation state
   * Property colors respect isolation, but highlights work independently
   */
  const applyColorsWithIsolation = (colorGroups: Array<ColorGroup>) => {
    const extension = filteringExtension()
    if (colorGroups.length === 0) {
      extension.removeUserObjectColors()
    } else {
      // Separate property colors and highlights from the final color groups
      const propertyColors = coloring.propertyColorGroups.value
      const highlightColors = coloring.highlightColorGroups.value

      const currentIsolatedIds = filters.isolatedObjectIds.value

      // Property colors respect isolation - only color visible objects
      const filteredPropertyColors =
        currentIsolatedIds.length > 0
          ? propertyColors
              .map((group) => ({
                objectIds: group.objectIds.filter((id) =>
                  currentIsolatedIds.includes(id)
                ),
                color: group.color
              }))
              .filter((group) => group.objectIds.length > 0)
          : propertyColors

      // Highlights work independently - they can highlight any object
      const allColorGroups = [...filteredPropertyColors, ...highlightColors]

      extension.setUserObjectColors(allColorGroups)
    }
  }

  /**
   * Single watcher for all color updates - watches the final merged color groups
   */
  watch(coloring.finalColorGroups, applyColorsWithIsolation, {
    immediate: true,
    flush: 'sync'
  })

  /**
   * Re-apply colors when isolation state changes
   */
  watch(
    filters.isolatedObjectIds,
    () => {
      // Re-apply current colors with new isolation state
      applyColorsWithIsolation(coloring.finalColorGroups.value)
    },
    { flush: 'sync' }
  )

  /**
   * Sets color filter for numeric filters by updating the centralized color state
   */
  const setNumericColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter || filter.type !== 'numeric' || filter.filter.type !== 'number')
      return

    const numericFilter = filter.filter as NumericPropertyInfo
    // Use the same rounding precision as the filtering logic to avoid floating point issues
    const min = parseFloat(filter.numericRange.min.toFixed(4))
    const max = parseFloat(filter.numericRange.max.toFixed(4))

    const filteredValueGroups =
      numericFilter.valueGroups?.filter((vg) => {
        // Apply the same rounding precision to valueGroup values for consistent comparison
        const roundedValue = parseFloat(vg.value.toFixed(4))
        return roundedValue >= min && roundedValue <= max
      }) || []

    const propertyColorGroups = createNumericFilterColorGroups(
      filteredValueGroups,
      min,
      max
    )

    // Update centralized color state - remove existing property colors and add new ones
    const currentHighlights = coloring.coloredObjectGroups.value.filter(
      (g) => g.source === 'highlight'
    )
    coloring.coloredObjectGroups.value = [...propertyColorGroups, ...currentHighlights]
  }

  /**
   * Sets color filter for string filters by updating the centralized color state
   */
  const setStringColorFilter = (filterId: string) => {
    const filter = filters.propertyFilters.value.find((f) => f.id === filterId)
    if (!filter?.filter || filter.type !== 'string') return

    const stringFilter = filter.filter as StringPropertyInfo

    const propertyColorGroups = createStringFilterColorGroups(
      stringFilter.valueGroups || []
    )

    // Update centralized color state - remove existing property colors and add new ones
    const currentHighlights = coloring.coloredObjectGroups.value.filter(
      (g) => g.source === 'highlight'
    )
    coloring.coloredObjectGroups.value = [...propertyColorGroups, ...currentHighlights]
  }

  /**
   * Removes the active color filter by clearing property colors from centralized state
   */
  const removeColorFilter = () => {
    // Clear property colors from centralized state, keep highlights
    const currentHighlights = coloring.coloredObjectGroups.value.filter(
      (g) => g.source === 'highlight'
    )
    coloring.coloredObjectGroups.value = currentHighlights
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
    // Clear all color state
    coloring.coloredObjectGroups.value = []
    removeColorFilter()
  })
}

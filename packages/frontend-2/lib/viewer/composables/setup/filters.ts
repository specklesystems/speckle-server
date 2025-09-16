import type { FilterData } from '~/lib/viewer/helpers/filters/types'
import type { SpeckleObject } from '@speckle/viewer'
import type { Raw } from 'vue'
import { FilteringExtension } from '@speckle/viewer'
import { watchTriggerable } from '@vueuse/core'
import { useInjectedViewerState } from '~/lib/viewer/composables/setup'
import { useOnViewerLoadComplete } from '~/lib/viewer/composables/viewer'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'

/**
 * Setup composable for filter-related state
 */
export const useFiltersSetup = () => {
  const isolatedObjectIds = ref([] as string[])
  const hiddenObjectIds = ref([] as string[])
  const selectedObjects = shallowRef<Raw<SpeckleObject>[]>([])

  const propertyFilters = ref<FilterData[]>([])
  const filteredObjectsCount = ref(0)

  const activeColorFilterId = ref<string | null>(null)

  const hasAnyFiltersApplied = computed(() => {
    if (
      propertyFilters.value.some(
        (filter) =>
          filter.isApplied ||
          (filter.selectedValues && filter.selectedValues.length > 0)
      )
    )
      return true
    return false
  })

  const isolatedObjectsSet = computed(() => {
    return new Set(isolatedObjectIds.value)
  })

  return {
    filters: {
      isolatedObjectIds,
      hiddenObjectIds,
      selectedObjects,
      propertyFilters,
      filteredObjectsCount,
      activeColorFilterId,
      hasAnyFiltersApplied,
      isolatedObjectsSet
    }
  }
}

/**
 * Integration composable for manual object isolation and hiding.
 */
export const useManualFilteringPostSetup = () => {
  const {
    ui: { filters },
    viewer: { instance }
  } = useInjectedViewerState()

  const filteringExtension = () => instance.getExtension(FilteringExtension)

  /**
   * Watch for changes to manually isolated object IDs
   */
  const { trigger: triggerIsolationWatch } = watchTriggerable(
    filters.isolatedObjectIds,
    (newIds, oldIds) => {
      if (!newIds || !oldIds) return

      const extension = filteringExtension()

      const toIsolate = newIds.filter((id) => !oldIds.includes(id))
      if (toIsolate.length > 0) {
        extension.isolateObjects(toIsolate, 'manual-isolation', true, true)
      }

      const toUnIsolate = oldIds.filter((id) => !newIds.includes(id))
      if (toUnIsolate.length > 0) {
        extension.unIsolateObjects(toUnIsolate, 'manual-isolation', true, true)
      }
    },
    { deep: true }
  )

  /**
   * Watch for changes to manually hidden object IDs
   */
  const { trigger: triggerHidingWatch } = watchTriggerable(
    filters.hiddenObjectIds,
    (newIds, oldIds) => {
      if (!newIds || !oldIds) return

      const extension = filteringExtension()

      const toHide = newIds.filter((id) => !oldIds.includes(id))
      if (toHide.length > 0) {
        extension.hideObjects(toHide, 'manual-hiding', false, false)
      }

      const toShow = oldIds.filter((id) => !newIds.includes(id))
      if (toShow.length > 0) {
        extension.showObjects(toShow, 'manual-hiding', false)
      }
    },
    { deep: true }
  )

  /**
   * Initialize manual filtering on viewer load
   */
  useOnViewerLoadComplete(
    () => {
      triggerIsolationWatch()
      triggerHidingWatch()
    },
    { initialOnly: true }
  )

  onBeforeUnmount(() => {
    const extension = filteringExtension()
    if (filters.isolatedObjectIds.value.length > 0) {
      extension.unIsolateObjects(
        filters.isolatedObjectIds.value,
        'manual-isolation',
        true,
        true
      )
    }
    if (filters.hiddenObjectIds.value.length > 0) {
      extension.showObjects(filters.hiddenObjectIds.value, 'manual-hiding', false)
    }
  })
}

/**
 * Integration composable for property-based filtering.
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

    filters.isolatedObjectIds.value = objectIds
    filters.filteredObjectsCount.value = objectIds.length
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
   * Watch for property filter results and apply to viewer extension
   */
  watchTriggerable(
    () => filters.filteredObjectsCount.value,
    () => {
      const extension = filteringExtension()
      const objectIds = dataStore.getFinalObjectIds()

      const hasAppliedFilters = filters.propertyFilters.value.some(
        (filter) => filter.isApplied
      )

      if (objectIds.length > 0) {
        extension.isolateObjects(objectIds, 'property-filters', false, true)
      } else if (hasAppliedFilters) {
        extension.isolateObjects(
          ['no-match-ghost-all'],
          'property-filters',
          false,
          true
        )
      }
    }
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

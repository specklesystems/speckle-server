import { FilteringExtension, type PropertyInfo, ViewerEvent } from '@speckle/viewer'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'

/**
 * Get count of filtered objects directly from the viewer
 * Uses viewer events to stay in sync with the viewer's internal state
 */
export function useFilteredObjectsCount() {
  const {
    viewer,
    ui: { filters }
  } = useInjectedViewerState()
  const filteredObjectsCount = ref(0)

  const updateCount = () => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)
    const isolatedObjects = filteringExtension.filteringState.isolatedObjects

    // Check if there are any applied filters
    const hasAppliedFilters = filters.propertyFilters.value.some(
      (f) =>
        f.isApplied &&
        (f.selectedValues.length > 0 ||
          ('isDefaultAllSelected' in f && f.isDefaultAllSelected))
    )

    if (!hasAppliedFilters) {
      filteredObjectsCount.value = 0
      return
    }

    const rawCount = isolatedObjects?.length || 0

    // Check if the only object is the "no-match-ghost-all" placeholder
    const isGhostOnly = rawCount === 1 && isolatedObjects?.[0] === 'no-match-ghost-all'

    if (isGhostOnly) {
      filteredObjectsCount.value = 0
      return
    }

    // For performance with huge datasets, use the viewer's isolated objects count directly
    // This avoids expensive PropertyInfo traversal that was causing crashes
    const realObjectCount =
      isolatedObjects?.filter((id) => id !== 'no-match-ghost-all').length || 0
    filteredObjectsCount.value = realObjectCount
  }

  onMounted(() => {
    const filteringExtension = viewer.instance.getExtension(FilteringExtension)

    // Try listening on the extension directly
    filteringExtension.on(ViewerEvent.FilteringStateSet, updateCount)

    // Also try listening on the viewer instance
    viewer.instance.on(ViewerEvent.FilteringStateSet, updateCount)

    // Get initial count
    updateCount()
  })

  return {
    filteredObjectsCount: readonly(filteredObjectsCount)
  }
}

// Cache for value group maps to avoid repeated .find() operations
const valueGroupCountCache = new WeakMap<PropertyInfo, Map<string, number>>()

/**
 * Get count for a specific filter value (optimized for large datasets)
 */
export function getFilterValueCount(filter: PropertyInfo, value: string): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return 0
  }

  // Check cache first
  if (valueGroupCountCache.has(filter)) {
    const countMap = valueGroupCountCache.get(filter)!
    return countMap.get(value) ?? 0
  }

  // Build cache for this filter
  const valueGroups = filter.valueGroups as Array<{ value: unknown; ids?: string[] }>
  const countMap = new Map<string, number>()

  for (const vg of valueGroups) {
    const key = String(vg.value)
    const count = vg.ids?.length ?? 0
    countMap.set(key, count)
  }

  valueGroupCountCache.set(filter, countMap)
  return countMap.get(value) ?? 0
}

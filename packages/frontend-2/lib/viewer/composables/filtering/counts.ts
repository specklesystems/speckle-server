import type { PropertyInfo } from '@speckle/viewer'

/**
 * Composable for efficiently managing filter value counts
 * Pre-computes all counts once and caches them to avoid performance issues
 */
export function useFilterCounts() {
  const countsCache = ref(new Map<string, Record<string, number>>())

  /**
   * Get counts for a filter property, using cached data when available
   */
  const getFilterCounts = (filter: PropertyInfo): Record<string, number> => {
    const cacheKey = filter.key

    // Return cached counts if available
    if (countsCache.value.has(cacheKey)) {
      return countsCache.value.get(cacheKey)!
    }

    // Build counts from valueGroups if available
    if ('valueGroups' in filter && Array.isArray(filter.valueGroups)) {
      const counts: Record<string, number> = {}
      const valueGroups = filter.valueGroups as Array<{
        value: unknown
        ids?: string[]
      }>

      for (const vg of valueGroups) {
        const value = String(vg.value)
        counts[value] = vg.ids ? vg.ids.length : 0
      }

      // Cache the result
      countsCache.value.set(cacheKey, counts)
      return counts
    }

    // No valueGroups available, return empty counts
    const emptyCounts = {}
    countsCache.value.set(cacheKey, emptyCounts)
    return emptyCounts
  }

  /**
   * Get count for a specific filter value
   */
  const getValueCount = (filter: PropertyInfo, value: string): number | null => {
    const counts = getFilterCounts(filter)
    return counts[value] ?? null
  }

  /**
   * Get existence counts (set/not set) for a filter property
   */
  const getExistenceCounts = (
    filter: PropertyInfo
  ): { setCount: number; notSetCount: number } | null => {
    if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
      return null
    }

    const valueGroups = filter.valueGroups as Array<{
      value: unknown
      ids?: string[]
    }>

    // Sum up all objects that have this property set
    const setCount = valueGroups.reduce((total, vg) => {
      return total + (vg.ids ? vg.ids.length : 0)
    }, 0)

    // For notSetCount, we'd need total object count which isn't available in valueGroups
    // Return null for notSetCount for now - can be enhanced later if needed
    return {
      setCount,
      notSetCount: 0 // TODO: Calculate if total object count becomes available
    }
  }

  /**
   * Clear the cache (useful when data changes)
   */
  const clearCache = () => {
    countsCache.value.clear()
  }

  return {
    getFilterCounts,
    getValueCount,
    getExistenceCounts,
    clearCache
  }
}

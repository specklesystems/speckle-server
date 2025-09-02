import type { PropertyInfo } from '@speckle/viewer'

/**
 * Get count for a specific filter value
 */
export function getFilterValueCount(filter: PropertyInfo, value: string): number {
  if (!('valueGroups' in filter) || !Array.isArray(filter.valueGroups)) {
    return 0
  }

  const valueGroups = filter.valueGroups as Array<{ value: unknown; ids?: string[] }>
  const valueGroup = valueGroups.find((vg) => String(vg.value) === value)
  return valueGroup?.ids?.length ?? 0
}

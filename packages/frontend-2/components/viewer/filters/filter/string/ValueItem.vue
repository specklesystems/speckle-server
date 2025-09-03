<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<!-- eslint-disable vuejs-accessibility/mouse-events-have-key-events -->
<template>
  <div class="px-1">
    <div
      class="group/checkbox flex items-center justify-between gap-2 text-body-3xs py-0.5 px-2 hover:bg-highlight-1 rounded-md cursor-pointer"
      @click="$emit('toggle')"
    >
      <div class="flex items-center min-w-0">
        <!-- Checkbox is purely visual - so pointer-events-none -->
        <FormCheckbox
          class="pointer-events-none -mt-1"
          :class="{
            'border-transparent group-hover/checkbox:border-outline-5': !isSelected,
            'opacity-50 dark:!bg-transparent !border dark:!border-outline-5 !group-hover/checkbox:border-outline-5':
              isDefaultSelected
          }"
          :name="`filter-${filter.id}-${value}`"
          :model-value="isSelected"
          hide-label
        />
        <span v-if="value" class="flex-1 truncate text-foreground ml-0.5">
          {{ value }}
        </span>
        <span v-else class="flex-1 text-foreground ml-0.5 italic">null</span>
      </div>
      <div class="flex items-center">
        <div v-if="count" class="shrink-0 text-foreground-2 text-body-3xs">
          {{ count }}
        </div>
        <div
          v-if="color"
          class="w-3 h-3 rounded-full border border-outline-3 ml-2 shrink-0"
          :style="{ backgroundColor: color }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCheckbox } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { getFilterValueCount } from '~/lib/viewer/composables/filtering/counts'
import {
  isStringFilter,
  type FilterData,
  type ValueGroupsMap
} from '~/lib/viewer/helpers/filters/types'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useFilterColors } from '~/lib/viewer/composables/filtering/colors'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  filter: FilterData
  value: string
  valueGroupsMap?: Nullable<ValueGroupsMap>
}>()

defineEmits<{
  toggle: []
}>()

const { isActiveFilterValueSelected, filters } = useFilterUtilities()

const { getFilterValueColor } = useFilterColors()

const {
  viewer: {
    metadata: { filteringState }
  }
} = useInjectedViewerState()

const isSelected = computed(() => {
  // For lazy-loaded filters with isDefaultAllSelected, all items should appear selected
  if (
    isStringFilter(props.filter) &&
    props.filter.isDefaultAllSelected &&
    props.filter.selectedValues.length === 0
  ) {
    return true
  }
  return isActiveFilterValueSelected(props.filter.id, props.value)
})

const totalCount = computed(() => {
  if (!props.filter.filter) return null
  return getFilterValueCount(props.filter.filter, props.value)
})

// Use the pre-computed value groups map passed from parent to avoid expensive repeated computations

// Pre-compute isolated objects Set once, outside the per-item computation
const isolatedObjectsSet = computed(() => {
  const currentlyIsolated = filteringState.value?.isolatedObjects
  if (!currentlyIsolated || currentlyIsolated.length === 0) return null

  const realIsolatedObjects = currentlyIsolated.filter(
    (id) => id !== 'no-match-ghost-all'
  )

  return realIsolatedObjects.length > 0 ? new Set(realIsolatedObjects) : null
})

const availableCount = computed(() => {
  if (!props.filter.filter || !totalCount.value) return null

  // Only show available count when there are multiple filter properties applied
  const appliedFilters = filters.propertyFilters.value.filter((f) => f.isApplied)
  if (appliedFilters.length <= 1) {
    return totalCount.value // No bracketed view for single property
  }

  const map = props.valueGroupsMap
  if (!map) {
    return totalCount.value
  }

  // Skip expensive intersection calculation for huge datasets
  if (map.size > 5000) {
    return totalCount.value // Just show total count for large datasets
  }

  const isolatedSet = isolatedObjectsSet.value
  if (!isolatedSet) {
    return totalCount.value
  }

  // Use O(1) Map lookup instead of O(n) .find() operation
  const valueGroup = map.get(props.value)
  const valueObjectIds = valueGroup?.ids || []

  // Count intersection efficiently
  const availableIds = valueObjectIds.filter((id) => isolatedSet.has(id))
  return availableIds.length
})

const count = computed(() => {
  const total = totalCount.value
  const available = availableCount.value

  if (total === null || available === null) return null

  // Only show available count when there are multiple filter properties applied
  const appliedFilters = filters.propertyFilters.value.filter((f) => f.isApplied)
  if (appliedFilters.length > 1) {
    // Always show bracketed format when multiple properties are applied
    return `${available} (${total})`
  }

  return String(total)
})

const color = computed(() => {
  if (filters.activeColorFilterId.value !== props.filter.id) {
    return null
  }
  return getFilterValueColor(props.value)
})

const isDefaultSelected = computed(() => {
  return (
    isStringFilter(props.filter) &&
    props.filter.isDefaultAllSelected &&
    props.filter.selectedValues.length === 0
  )
})
</script>

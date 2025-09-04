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
import type { StringFilterData } from '~/lib/viewer/helpers/filters/types'
import { useInjectedViewerState } from '~~/lib/viewer/composables/setup'
import { useFilterColoringHelpers } from '~/lib/viewer/composables/filtering/coloringHelpers'

const props = defineProps<{
  filter: StringFilterData
  value: string
}>()

defineEmits<{
  toggle: []
}>()

const { isActiveFilterValueSelected, filters, getCachedValueGroupsMap } =
  useFilterUtilities()

const { getFilterValueColor } = useFilterColoringHelpers()

const { ui } = useInjectedViewerState()

// Create valueGroupsMap at setup level
const valueGroupsMap = computed(() => {
  if (!props.filter.filter) return null
  return getCachedValueGroupsMap(props.filter.filter)
})

const isSelected = computed(() => {
  if (props.filter.isDefaultAllSelected && props.filter.selectedValues.length === 0) {
    return true
  }
  return isActiveFilterValueSelected(props.filter.id, props.value)
})

const totalCount = computed(() => {
  if (!props.filter.filter) return null
  return getFilterValueCount(props.filter.filter, props.value)
})

// Use singleton isolatedObjectsSet from viewer state
const { isolatedObjectsSet } = ui.filters

const availableCount = computed(() => {
  if (!props.filter.filter || !totalCount.value) return null

  const appliedFilters = filters.propertyFilters.value.filter((f) => f.isApplied)

  if (appliedFilters.length <= 1) {
    return totalCount.value
  }

  const map = valueGroupsMap.value

  if (!map) {
    return totalCount.value
  }

  const isolatedSet = isolatedObjectsSet.value
  if (!isolatedSet) {
    return totalCount.value
  }

  const valueGroup = map.get(props.value)
  const valueObjectIds = valueGroup?.ids || []

  const availableIds = valueObjectIds.filter((id) => isolatedSet.has(id))
  const result = availableIds.length
  return result
})

const count = computed(() => {
  const total = totalCount.value
  const available = availableCount.value

  if (total === null || available === null) return null

  const appliedFilters = filters.propertyFilters.value.filter((f) => f.isApplied)
  if (appliedFilters.length > 1) {
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
  return props.filter.isDefaultAllSelected && props.filter.selectedValues.length === 0
})
</script>

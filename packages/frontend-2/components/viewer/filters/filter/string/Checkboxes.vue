<template>
  <div>
    <div
      v-if="shouldShowAppliedSection"
      class="bg-highlight-1 rounded-md mx-2 my-1 p-1"
    >
      <div class="flex flex-wrap gap-1">
        <span
          v-for="value in displayedSelectedValues"
          :key="value"
          class="inline-flex items-center gap-1 px-2 py-0.5 bg-highlight-3 text-foreground text-body-3xs rounded"
        >
          {{ value }}
          <button
            class="text-foreground-2 hover:text-foreground"
            @click="() => toggleValue(value)"
          >
            ×
          </button>
        </span>
        <span
          v-if="remainingCount > 0"
          class="inline-flex items-center px-2 py-0.5 bg-highlight-3 text-foreground-2 text-body-3xs rounded"
        >
          and {{ remainingCount }} more
        </span>
      </div>
    </div>

    <ViewerFiltersFilterStringSelectAll
      :selected-count="selectedCount"
      :total-count="filteredValues.length"
      @select-all="selectAll"
    />

    <div
      v-bind="containerProps"
      class="relative simple-scrollbar"
      :style="{ height: containerHeight }"
    >
      <div
        v-for="{ data: value, index } in list"
        :key="`${index}-${value}`"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${itemHeight}px`,
          transform: `translateY(${index * itemHeight}px)`
        }"
      >
        <ViewerFiltersFilterStringValueItem
          :filter-id="filter.id"
          :value="value"
          :is-selected="isValueSelected(value)"
          :count="getValueCount(value)"
          :color="getValueColor(value)"
          :is-default-selected="
            isStringFilter(filter) &&
            filter.isDefaultAllSelected &&
            isValueSelected(value)
          "
          @toggle="() => toggleValue(value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { isStringFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
}>()

const {
  toggleActiveFilterValue,
  updateActiveFilterValues,
  isActiveFilterValueSelected,
  getFilterValueColor,
  getAvailableFilterValues,
  filters
} = useFilterUtilities()

const isValueSelected = (value: string): boolean => {
  return isActiveFilterValueSelected(props.filter.id, value)
}

const getValueCount = (_value: string): number => {
  return 1
}

// Get value color - only show colors if this filter is the active color filter
const getValueColor = (value: string): string | null => {
  // Only show colors if this specific filter is the one applying colors
  if (filters.activeColorFilterId.value !== props.filter.id) {
    return null
  }
  return getFilterValueColor(value)
}

// Toggle value selection
const toggleValue = (value: string) => {
  toggleActiveFilterValue(props.filter.id, value)
}

// Select all values
const selectAll = (selected: boolean) => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return

  const allAvailableValues = getAvailableFilterValues(props.filter.filter)
  if (selected) {
    // Select all available values in one batch operation
    updateActiveFilterValues(props.filter.id, allAvailableValues)
  } else {
    // Deselect all - set to empty array in one operation
    updateActiveFilterValues(props.filter.id, [])
  }

  // Note: default state clearing is now handled in updateActiveFilterValues
}

// Get available values from the filter
const availableValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getAvailableFilterValues(props.filter.filter)
  }
  return []
})

// Filter values based on search query
const filteredValues = computed(() => {
  if (!props.searchQuery?.trim()) {
    return availableValues.value
  }

  const searchTerm = props.searchQuery.toLowerCase().trim()
  return availableValues.value.filter((value: string) =>
    value.toLowerCase().includes(searchTerm)
  )
})

// Get selected values
const selectedValues = computed(() => {
  return props.filter.selectedValues || []
})

// Check if we should show the applied section (not when select all is active)
const shouldShowAppliedSection = computed(() => {
  return selectedValues.value.length > 0 && !isSelectAllActive.value
})

// Check if select all is active (when all available values are selected)
const isSelectAllActive = computed(() => {
  return (
    selectedValues.value.length === availableValues.value.length &&
    availableValues.value.length > 0
  )
})

// Limit displayed values to 8 items
const maxDisplayedItems = 5
const displayedSelectedValues = computed(() => {
  return selectedValues.value.slice(0, maxDisplayedItems)
})

// Count of remaining items not displayed
const remainingCount = computed(() => {
  return Math.max(0, selectedValues.value.length - maxDisplayedItems)
})

// Select all logic
const selectedCount = computed(() => {
  return filteredValues.value.filter((value) => isValueSelected(value)).length
})

// Virtual list setup
const itemHeight = 28 // Height of each checkbox item in pixels
const maxHeight = 210

const containerHeight = computed(() => {
  const contentHeight = filteredValues.value.length * itemHeight
  return `${Math.min(contentHeight, maxHeight)}px`
})

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

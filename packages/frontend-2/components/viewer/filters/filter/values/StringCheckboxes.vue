<template>
  <div>
    <ViewerFiltersFilterValuesSelectAllCheckbox
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
        <ViewerFiltersFilterValuesFilterValueItem
          :filter-id="filter.id"
          :value="value"
          :is-selected="isValueSelected(value)"
          :count="getValueCount(value)"
          :color="getValueColor(value)"
          @toggle="() => toggleValue(value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { isStringFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
}>()

const {
  toggleActiveFilterValue,
  isActiveFilterValueSelected,
  getFilterValueColor,
  getAvailableFilterValues
} = useFilterUtilities()

const isValueSelected = (value: string): boolean => {
  return isActiveFilterValueSelected(props.filter.id, value)
}

const getValueCount = (_value: string): number => {
  return 1
}

// Get value color
const getValueColor = (value: string): string | null => {
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
    // Select all available values that aren't already selected
    allAvailableValues.forEach((value) => {
      if (!props.filter.selectedValues.includes(value)) {
        toggleActiveFilterValue(props.filter.id, value)
      }
    })
  } else {
    // Deselect all currently selected values
    const selectedValuesCopy = [...props.filter.selectedValues]
    selectedValuesCopy.forEach((value) => {
      toggleActiveFilterValue(props.filter.id, value)
    })
  }
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

// Select all logic
const selectedCount = computed(() => {
  return filteredValues.value.filter((value) => isValueSelected(value)).length
})

// Virtual list setup
const itemHeight = 32 // Height of each checkbox item in pixels
const maxHeight = 144 // 36 * 4px (h-36 equivalent)

const containerHeight = computed(() => {
  const contentHeight = filteredValues.value.length * itemHeight
  return `${Math.min(contentHeight, maxHeight)}px`
})

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll v-if="!searchQuery" :filter="filter" />
      <div v-else />
      <div
        :title="
          isLargeDataset
            ? 'Sorting disabled for large datasets (5,000+ values)'
            : undefined
        "
      >
        <ViewerFiltersFilterStringSortButton
          :disabled="isLargeDataset"
          :model-value="sortMode"
          @update:model-value="$emit('update:sortMode', $event)"
        />
      </div>
    </div>

    <div
      v-bind="containerProps"
      class="simple-scrollbar"
      :style="{ maxHeight: `${maxHeight}px` }"
    >
      <div v-bind="wrapperProps" class="relative">
        <div
          v-for="{ data: value, index } in list"
          :key="`${index}-${value}`"
          :style="{
            height: `${itemHeight}px`,
            overflow: 'hidden'
          }"
        >
          <ViewerFiltersFilterStringValueItem
            :filter="filter"
            :value="value"
            :value-groups-map="valueGroupsMap"
            @toggle="() => toggleActiveFilterValue(filter.id, value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import {
  isStringFilter,
  type FilterData,
  type SortMode,
  type ValueGroupsMap
} from '~/lib/viewer/helpers/filters/types'
import type { Nullable } from '@speckle/shared'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
  sortMode: SortMode
  valueGroupsMap?: Nullable<ValueGroupsMap>
}>()

defineEmits<{
  'update:sortMode': [value: SortMode]
}>()

const itemHeight = 28
const maxHeight = 240

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

const filteredValues = computed(() => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return []

  // Use the centralized function that includes proper sorting logic
  return getFilteredFilterValues(props.filter.filter, {
    searchQuery: props.searchQuery,
    sortMode: props.sortMode,
    filterId: props.filter.id
  })
})

const isLargeDataset = computed(() => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return false
  return (
    'valueGroups' in props.filter.filter &&
    Array.isArray(props.filter.filter.valueGroups) &&
    props.filter.filter.valueGroups.length > 5000
  )
})

// Optimize virtual list for huge datasets
const virtualListOptions = computed(() => {
  const baseOptions = {
    itemHeight,
    overscan: 5
  }

  // For huge datasets, reduce overscan to minimize DOM nodes
  if (filteredValues.value.length > 10000) {
    return {
      ...baseOptions,
      overscan: 2 // Reduce overscan for huge datasets
    }
  }

  return baseOptions
})

const { list, containerProps, wrapperProps } = useVirtualList(
  filteredValues,
  virtualListOptions.value
)
</script>

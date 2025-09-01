<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll
        :filter="filter"
        :search-query="searchQuery"
      />

      <ViewerFiltersFilterStringSortButton v-model="sortMode" />
    </div>
    <div
      v-bind="containerProps"
      class="relative simple-scrollbar"
      :style="{ height: containerHeight }"
    >
      <div
        v-for="{ data: value, index } in list"
        :key="`${index}-${value}`"
        class="absolute top-0 left-0 w-full h-full"
        :style="{ transform: `translateY(${index * itemHeight}px)` }"
      >
        <ViewerFiltersFilterStringValueItem
          :filter="filter"
          :value="value"
          @toggle="() => toggleActiveFilterValue(filter.id, value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import {
  isStringFilter,
  type FilterData,
  SortMode
} from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
}>()

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

const sortMode = ref<SortMode>(SortMode.Alphabetical)

const filteredValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getFilteredFilterValues(props.filter.filter, {
      sortMode: sortMode.value,
      filterId: props.filter.id
    })
  }
  return []
})

const itemHeight = 28 // Height of each checkbox item in pixels
const maxHeight = 240

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight: 28,
  overscan: 5
})

const containerHeight = computed(() => {
  const contentHeight = filteredValues.value.length * itemHeight
  return `${Math.min(contentHeight, maxHeight)}px`
})
</script>

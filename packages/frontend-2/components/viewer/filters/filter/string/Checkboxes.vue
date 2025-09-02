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
  SortMode
} from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
}>()

const itemHeight = 28
const maxHeight = 240

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

const sortMode = ref<SortMode>(SortMode.Alphabetical)

const filteredValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getFilteredFilterValues(props.filter.filter, {
      searchQuery: props.searchQuery,
      sortMode: sortMode.value,
      filterId: props.filter.id
    })
  }
  return []
})

const { list, containerProps, wrapperProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll v-if="!searchQuery" :filter="filter" />
      <div v-else />

      <ViewerFiltersFilterStringSortButton
        :model-value="sortMode"
        @update:model-value="$emit('update:sortMode', $event)"
      />
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
import type { StringFilterData, SortMode } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: StringFilterData
  searchQuery?: string
  sortMode: SortMode
}>()

defineEmits<{
  'update:sortMode': [value: SortMode]
}>()

const itemHeight = 28
const maxHeight = 240

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

const filteredValues = computed(() => {
  if (!props.filter.filter) return []

  return getFilteredFilterValues(props.filter.filter, {
    searchQuery: props.searchQuery,
    sortMode: props.sortMode,
    filterId: props.filter.id
  })
})

const { list, containerProps, wrapperProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

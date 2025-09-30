<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll
        :filter="filter"
        :disabled="!isEmpty(searchQuery?.trim())"
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
          v-for="{ data: value } in list"
          :key="`${filter.id}-${value}`"
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
import { isEmpty } from 'lodash-es'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import { SortMode } from '~/lib/viewer/helpers/filters/types'
import type { StringFilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: StringFilterData
  searchQuery?: string
}>()

const sortMode = defineModel<SortMode>('sortMode', {
  default: SortMode.Alphabetical
})

const previousLength = ref(0)
const itemHeight = 28
const maxHeight = 240

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

const filteredValues = computed(() => {
  if (!props.filter.filter) return []

  return getFilteredFilterValues(props.filter.filter, {
    searchQuery: props.searchQuery,
    sortMode: sortMode.value,
    filterId: props.filter.id
  })
})

const { list, containerProps, wrapperProps, scrollTo } = useVirtualList(
  filteredValues,
  {
    itemHeight,
    overscan: 10
  }
)

// Scroll to newly added values
watch(
  () => props.filter.selectedValues,
  (newValues) => {
    if (newValues.length > previousLength.value) {
      // Find the newly added value
      const newValue = newValues[newValues.length - 1]
      const index = filteredValues.value.findIndex((v) => v === newValue)
      if (index !== -1) {
        nextTick(() => {
          const scrollIndex = Math.max(0, index - 3) // Center-ish position
          scrollTo(scrollIndex)
        })
      }
    }
    previousLength.value = newValues.length
  },
  { immediate: true }
)
</script>

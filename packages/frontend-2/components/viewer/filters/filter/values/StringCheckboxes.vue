<template>
  <div>
    <ViewerFiltersFilterValuesSelectAllCheckbox
      :selected-count="selectedCount"
      :total-count="filteredValues.length"
      @select-all="emit('selectAll', $event)"
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
          :filter-id="filterId"
          :value="value"
          :is-selected="isValueSelected(value)"
          :count="getValueCount(value)"
          :color="getValueColor(value)"
          @toggle="emit('toggleValue', value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

const props = defineProps<{
  filterId: string
  availableValues: string[]
  searchQuery?: string
  isValueSelected: (value: string) => boolean
  getValueCount: (value: string) => number
  getValueColor: (value: string) => string | null
}>()

const emit = defineEmits<{
  toggleValue: [value: string]
  selectAll: [selected: boolean]
}>()

// Filter values based on search query
const filteredValues = computed(() => {
  if (!props.searchQuery?.trim()) {
    return props.availableValues
  }

  const searchTerm = props.searchQuery.toLowerCase().trim()
  return props.availableValues.filter((value) =>
    value.toLowerCase().includes(searchTerm)
  )
})

// Select all logic
const selectedCount = computed(() => {
  return filteredValues.value.filter((value) => props.isValueSelected(value)).length
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

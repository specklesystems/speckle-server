<template>
  <div ref="containerRef" class="h-48 overflow-auto">
    <div v-bind="containerProps" class="relative h-full simple-scrollbar">
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
        class="flex items-center justify-between gap-2 text-body-2xs pr-2 py-1 px-2 hover:bg-primary-muted"
      >
        <div class="flex items-center min-w-0">
          <FormCheckbox
            :name="`filter-${filterId}-${value}`"
            :model-value="isValueSelected(value)"
            hide-label
            @update:model-value="$emit('toggleValue', value)"
          />
          <span class="flex-1 truncate text-foreground ml-2">
            {{ value }}
          </span>
        </div>
        <div class="flex items-center">
          <div class="shrink-0 text-foreground-2 text-body-3xs">
            {{ getValueCount(value) }}
          </div>
          <div
            v-if="getValueColor(value)"
            class="w-3 h-3 rounded-full border border-outline-3 ml-2 shrink-0"
            :style="{ backgroundColor: getValueColor(value) || undefined }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FormCheckbox } from '@speckle/ui-components'
import { useVirtualList } from '@vueuse/core'

const props = defineProps<{
  filterId: string
  availableValues: string[]
  searchQuery?: string
  isValueSelected: (value: string) => boolean
  getValueCount: (value: string) => number
  getValueColor: (value: string) => string | null
}>()

defineEmits<{
  toggleValue: [value: string]
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

// Virtual list setup
const itemHeight = 32 // Height of each checkbox item in pixels

const containerRef = ref<HTMLElement>()

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

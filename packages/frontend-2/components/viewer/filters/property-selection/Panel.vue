<template>
  <div class="h-full flex flex-col">
    <ViewerFiltersPropertySelectionSearch
      v-model="searchQuery"
      placeholder="Search for a property..."
      input-id="property-search"
    />

    <div
      v-bind="containerProps"
      class="relative simple-scrollbar"
      :style="{ height: containerHeight }"
    >
      <div
        v-for="{ data: property, index } in list"
        :key="`${index}-${property.value}`"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: `${getItemHeight(property)}px`,
          transform: `translateY(${getItemOffset(index)}px)`
        }"
      >
        <div class="px-1">
          <button
            class="w-full h-full px-2 text-foreground rounded hover:bg-highlight-1 text-left flex items-center gap-2"
            :class="!property.parentPath ? 'py-1.5' : 'py-1'"
            @click="$emit('selectProperty', property.value)"
          >
            <Hash v-if="property.type === 'number'" class="h-3 w-3" />
            <CaseLower v-else class="h-3 w-3" />
            <div class="min-w-0 flex-1">
              <div class="text-body-2xs font-medium text-foreground truncate">
                {{ property.label }}
              </div>
              <div
                v-if="property.parentPath"
                class="text-body-3xs text-foreground-2 truncate -mt-0.5"
              >
                {{ property.parentPath }}
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { Hash, CaseLower } from 'lucide-vue-next'

type PropertyOption = {
  value: string
  label: string
  parentPath: string
  type: 'number' | 'string'
  hasParent: boolean
}

const props = defineProps<{
  options: PropertyOption[]
}>()

defineEmits<{
  selectProperty: [propertyKey: string]
}>()

const searchQuery = ref('')

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.options
  }

  const searchTerm = searchQuery.value.toLowerCase().trim()
  return props.options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm) ||
      option.value.toLowerCase().includes(searchTerm) ||
      option.parentPath.toLowerCase().includes(searchTerm) ||
      option.type.toLowerCase().includes(searchTerm)
  )
})

// Virtual list setup with dynamic heights
const smallItemHeight = 28 // Height for items without parent
const largeItemHeight = 38 // Height for items with parent
const maxHeight = 300 // Maximum height for the container

// Helper function to get height for a specific property
const getItemHeight = (property: PropertyOption) => {
  return property.parentPath && property.parentPath !== '-'
    ? largeItemHeight
    : smallItemHeight
}

// Helper function to calculate offset for a specific index
const getItemOffset = (index: number) => {
  let offset = 0
  for (let i = 0; i < index; i++) {
    const property = filteredOptions.value[i]
    if (property) {
      offset += getItemHeight(property)
    }
  }
  return offset
}

const containerHeight = computed(() => {
  const contentHeight = filteredOptions.value.reduce((total, property) => {
    return total + getItemHeight(property)
  }, 0)
  return `${Math.min(contentHeight, maxHeight)}px`
})

const { list, containerProps } = useVirtualList(filteredOptions, {
  itemHeight: largeItemHeight, // Use larger height as base for virtual list calculations
  overscan: 5
})
</script>

<template>
  <div class="h-full flex flex-col">
    <ViewerFiltersPropertySelectionSearch
      v-model="searchQuery"
      placeholder="Search for a property..."
      input-id="property-search"
    />

    <div
      v-bind="containerProps"
      class="simple-scrollbar"
      :style="{ maxHeight: `${maxHeight}px` }"
    >
      <div v-bind="wrapperProps" class="relative">
        <div
          v-for="{ data: item, index } in list"
          :key="`${index}-${
            item.type === 'header' ? item.title : item.property?.value
          }`"
          :style="{
            height: `${itemHeight}px`,
            overflow: 'hidden'
          }"
        >
          <ViewerFiltersPropertySelectionHeader
            v-if="item.type === 'header'"
            :title="item.title!"
          />

          <ViewerFiltersPropertySelectionItem
            v-else-if="item.property"
            :property="item.property"
            @select-property="$emit('selectProperty', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'

type PropertyOption = {
  value: string
  label: string
  parentPath: string
  type: 'number' | 'string'
  hasParent: boolean
}

type ListItem = {
  type: 'header' | 'property'
  title?: string
  property?: PropertyOption
}

const props = defineProps<{
  options: PropertyOption[]
}>()

defineEmits<{
  selectProperty: [propertyKey: string]
}>()

const searchQuery = ref('')

const popularFilters = [
  'speckle_type',
  'Name',
  'Category',
  'Family',
  'Type',
  'Level',
  'Material',
  'Phase Created',
  'Phase Demolished',
  'Area',
  'Length',
  'Phase Created',
  'IFCType',
  'Layer'
]

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

const listItems = computed((): ListItem[] => {
  const items: ListItem[] = []

  // If there's a search query, just show filtered results without sections
  if (searchQuery.value.trim()) {
    filteredOptions.value.forEach((property) => {
      items.push({ type: 'property', property })
    })
    return items
  }

  // Find popular filters that exist in the options
  const availablePopular = popularFilters
    .map((filterKey) => props.options.find((opt) => opt.value === filterKey))
    .filter(Boolean)
    .slice(0, 6) // Show max 6 popular filters

  // Add Popular filters section if we have any
  if (availablePopular.length > 0) {
    items.push({ type: 'header', title: 'Popular properties' })
    availablePopular.forEach((property) => {
      items.push({ type: 'property', property })
    })
  }

  items.push({ type: 'header', title: `All properties (${props.options.length})` })
  props.options.forEach((property) => {
    items.push({ type: 'property', property })
  })

  return items
})

const itemHeight = 36
const maxHeight = 600

const { list, containerProps, wrapperProps } = useVirtualList(listItems, {
  itemHeight,
  overscan: 5
})
</script>

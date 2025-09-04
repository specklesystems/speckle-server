<template>
  <div class="h-full flex flex-col select-none">
    <ViewerFiltersPropertySelectionSearch
      v-model="searchQuery"
      placeholder="Search for a property..."
      input-id="property-search"
    />

    <div v-if="isLoading" class="flex-1 flex items-center justify-center py-8">
      <CommonLoadingIcon class="h-6 w-6 text-foreground-2" />
    </div>

    <!-- Property list -->
    <div
      v-else
      v-bind="containerProps"
      class="simple-scrollbar py-1"
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
            v-else-if="item.type === 'property' && item.property"
            :property="item.property"
            @select-property="$emit('selectProperty', $event)"
          />

          <div v-else-if="item.type === 'spacer'" class="h-9" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import type {
  PropertyOption,
  PropertySelectionListItem
} from '~/lib/viewer/helpers/filters/types'
import {
  FILTERS_POPULAR_PROPERTIES,
  PROPERTY_SELECTION_ITEM_HEIGHT,
  PROPERTY_SELECTION_MAX_HEIGHT,
  PROPERTY_SELECTION_OVERSCAN
} from '~/lib/viewer/helpers/filters/constants'
import { useFilteringDataStore } from '~/lib/viewer/composables/filtering/dataStore'

const props = defineProps<{
  options: PropertyOption[]
}>()

defineEmits<{
  selectProperty: [propertyKey: string]
}>()

const searchQuery = ref('')
const dataStore = useFilteringDataStore()

const isLoading = computed(() => {
  return dataStore.dataSources.value.length === 0
})

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

const listItems = computed((): PropertySelectionListItem[] => {
  const items: PropertySelectionListItem[] = []

  if (searchQuery.value.trim()) {
    const searchResults = filteredOptions.value.map((property) => ({
      type: 'property' as const,
      property
    }))
    return searchResults
  }

  const availablePopular = FILTERS_POPULAR_PROPERTIES.map((filterKey) =>
    props.options.find((opt) => opt.value === filterKey)
  )
    .filter(Boolean)
    .slice(0, 6) // Show max 6 popular filters

  if (availablePopular.length > 0) {
    items.push({ type: 'header', title: 'Popular properties' })
    const popularItems = availablePopular.map((property) => ({
      type: 'property' as const,
      property: property!
    }))
    items.push(...popularItems)
  }

  items.push({ type: 'header', title: `All properties (${props.options.length})` })

  const allPropertyItems = props.options.map((property) => ({
    type: 'property' as const,
    property
  }))
  items.push(...allPropertyItems)

  items.push({ type: 'spacer' })

  return items
})

const itemHeight = computed(() => PROPERTY_SELECTION_ITEM_HEIGHT)
const maxHeight = computed(() => PROPERTY_SELECTION_MAX_HEIGHT)

const { list, containerProps, wrapperProps } = useVirtualList(listItems, {
  itemHeight: PROPERTY_SELECTION_ITEM_HEIGHT,
  overscan: PROPERTY_SELECTION_OVERSCAN
})
</script>

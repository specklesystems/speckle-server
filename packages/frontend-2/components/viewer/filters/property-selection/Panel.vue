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
          :key="index"
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
import { useVirtualList, useDebounceFn } from '@vueuse/core'
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

const debouncedSearchQuery = ref('')

const updateDebouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchQuery.value = query
}, 200)

// Pre-compute lowercase versions for efficient searching
const optionsWithLowercase = computed(() => {
  return props.options.map((option) => ({
    ...option,
    _searchLabel: option.label.toLowerCase(),
    _searchValue: option.value.toLowerCase(),
    _searchParentPath: option.parentPath.toLowerCase(),
    _searchType: option.type.toLowerCase()
  }))
})

const filteredOptions = computed(() => {
  if (!debouncedSearchQuery.value.trim()) {
    return props.options
  }

  const searchTerm = debouncedSearchQuery.value.toLowerCase().trim()
  return optionsWithLowercase.value
    .filter(
      (option) =>
        option._searchLabel.includes(searchTerm) ||
        option._searchValue.includes(searchTerm) ||
        option._searchParentPath.includes(searchTerm) ||
        option._searchType.includes(searchTerm)
    )
    .map(
      ({ _searchLabel, _searchValue, _searchParentPath, _searchType, ...option }) =>
        option
    )
})

const listItems = computed((): PropertySelectionListItem[] => {
  const items: PropertySelectionListItem[] = []

  if (debouncedSearchQuery.value.trim()) {
    const searchResults = filteredOptions.value.map((property) => ({
      type: 'property' as const,
      property
    }))
    return searchResults
  }

  // Create a map for O(1) lookup instead of O(n) find operations
  const optionsMap = new Map(props.options.map((opt) => [opt.value, opt]))
  const availablePopular = FILTERS_POPULAR_PROPERTIES.map((filterKey) =>
    optionsMap.get(filterKey)
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

watch(
  searchQuery,
  (newQuery) => {
    updateDebouncedSearch(newQuery)
  },
  { immediate: true }
)
</script>

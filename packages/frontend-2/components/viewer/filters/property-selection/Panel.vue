<template>
  <div
    ref="listContainer"
    class="h-full flex flex-col select-none focus-visible:outline-none border border-outline-2 rounded-lg"
    tabindex="0"
    role="listbox"
    @keydown="handleListKeydown"
  >
    <ViewerFiltersPropertySelectionSearch
      ref="searchComponent"
      v-model="searchQuery"
      placeholder="Search for a property..."
      input-id="property-search"
      @keydown="handleSearchKeydown"
    />

    <div v-if="isLoading" class="flex-1 flex items-center justify-center py-8">
      <CommonLoadingIcon class="h-6 w-6 text-foreground-2" />
    </div>

    <!-- Empty state for no search results -->
    <div
      v-else-if="hasSearchQuery && filteredOptions.length === 0"
      class="flex-1 flex flex-col items-center justify-center p-6 gap-2"
    >
      <p class="text-body-2xs text-center">No properties found</p>

      <FormButton color="outline" size="sm" @click="clearSearch">
        Clear search
      </FormButton>
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
            :is-focused="isItemFocused(index)"
            @select-property="$emit('selectProperty', $event)"
            @mouseenter="handleItemHover(index)"
            @focus="handleItemHover(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList, useDebounceFn, onKeyStroke } from '@vueuse/core'
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

const emit = defineEmits<{
  selectProperty: [propertyKey: string]
  close: []
}>()

const dataStore = useFilteringDataStore()

const searchQuery = ref('')
const listContainer = ref<HTMLElement>()
const searchComponent = ref()
const focusedIndex = ref(-1)
const debouncedSearchQuery = ref('')

const updateDebouncedSearch = useDebounceFn((query: string) => {
  debouncedSearchQuery.value = query
}, 200)

const isLoading = computed(() => {
  return dataStore.dataSources.value.length === 0
})

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

  const optionsMap = new Map(filteredOptions.value.map((opt) => [opt.value, opt]))
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

  items.push({
    type: 'header',
    title: `All properties (${filteredOptions.value.length})`
  })

  const allPropertyItems = filteredOptions.value.map((property) => ({
    type: 'property' as const,
    property
  }))
  items.push(...allPropertyItems)

  return items
})

const itemHeight = computed(() => PROPERTY_SELECTION_ITEM_HEIGHT)
const maxHeight = computed(() => PROPERTY_SELECTION_MAX_HEIGHT - 28)

const { list, containerProps, wrapperProps } = useVirtualList(listItems, {
  itemHeight: PROPERTY_SELECTION_ITEM_HEIGHT,
  overscan: PROPERTY_SELECTION_OVERSCAN
})

const hasSearchQuery = computed(() => debouncedSearchQuery.value.trim().length > 0)

const propertyItems = computed(() => {
  return listItems.value.filter((item) => item.type === 'property' && item.property)
})

const isItemFocused = (index: number) => {
  const propertyItemIndex = getPropertyItemIndex(index)
  return propertyItemIndex === focusedIndex.value
}

const getPropertyItemIndex = (virtualIndex: number) => {
  let propertyIndex = -1
  for (let i = 0; i <= virtualIndex; i++) {
    const item = listItems.value[i]
    if (item && item.type === 'property' && item.property) {
      propertyIndex++
    }
  }
  return propertyIndex
}

const getVirtualIndex = (propertyIndex: number) => {
  let currentPropertyIndex = -1
  for (let i = 0; i < listItems.value.length; i++) {
    const item = listItems.value[i]
    if (item && item.type === 'property' && item.property) {
      currentPropertyIndex++
      if (currentPropertyIndex === propertyIndex) {
        return i
      }
    }
  }
  return -1
}

// Handle keyboard events from search input
const handleSearchKeydown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      if (propertyItems.value.length > 0) {
        focusedIndex.value = 0
        scrollToFocusedItem()
        nextTick(() => {
          listContainer.value?.focus()
        })
      }
      break
    case 'Enter':
      event.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < propertyItems.value.length) {
        const property = propertyItems.value[focusedIndex.value].property
        if (property) {
          emit('selectProperty', property.value)
        }
      }
      break
    case 'Escape':
      event.preventDefault()
      emit('close')
      break
  }
}

const handleListKeydown = (event: KeyboardEvent) => {
  if (propertyItems.value.length === 0) return

  switch (event.key) {
    case 'ArrowDown':
      event.preventDefault()
      event.stopPropagation()
      if (focusedIndex.value < propertyItems.value.length - 1) {
        focusedIndex.value++
        scrollToFocusedItem()
      }
      break
    case 'ArrowUp':
      event.preventDefault()
      event.stopPropagation()
      if (focusedIndex.value > 0) {
        focusedIndex.value--
        scrollToFocusedItem()
      }
      break
    case 'Enter':
      event.stopPropagation()
      event.preventDefault()
      if (focusedIndex.value >= 0 && focusedIndex.value < propertyItems.value.length) {
        const property = propertyItems.value[focusedIndex.value].property
        if (property) {
          emit('selectProperty', property.value)
        }
      }
      break
    case 'Escape': {
      event.stopPropagation()
      event.preventDefault()
      emit('close')
      break
    }
  }
}

// Handle item hover to update focused index
const handleItemHover = (virtualIndex: number) => {
  const propertyItemIndex = getPropertyItemIndex(virtualIndex)
  if (propertyItemIndex >= 0) {
    focusedIndex.value = propertyItemIndex
  }
}

const scrollToFocusedItem = () => {
  if (focusedIndex.value >= 0) {
    const virtualIndex = getVirtualIndex(focusedIndex.value)
    if (virtualIndex >= 0) {
      nextTick(() => {
        const container = containerProps.ref.value
        if (container) {
          const containerHeight = container.clientHeight
          const itemHeight = PROPERTY_SELECTION_ITEM_HEIGHT
          const totalOffset = virtualIndex * itemHeight
          const centerOffset = containerHeight / 2 - itemHeight / 2
          const scrollPosition = Math.max(0, totalOffset - centerOffset)

          container.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          })
        }
      })
    }
  }
}

// Reset scroll position to top when search results change
const resetScrollPosition = () => {
  nextTick(() => {
    const container = containerProps.ref.value
    if (container) {
      container.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  })
}

const clearSearch = () => {
  searchQuery.value = ''
  focusedIndex.value = -1
  resetScrollPosition()
}

watch(
  searchQuery,
  (newQuery) => {
    updateDebouncedSearch(newQuery)
  },
  { immediate: true }
)

// Reset focused index and scroll position when list changes
watch(listItems, () => {
  focusedIndex.value = -1
  resetScrollPosition()
})

// Reset focused index and scroll position when search changes
watch(debouncedSearchQuery, () => {
  focusedIndex.value = -1
  resetScrollPosition()
})

// Handle typing to focus search input
onKeyStroke((event) => {
  event.preventDefault()
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const searchInput = document.getElementById('property-search') as HTMLInputElement
    searchInput?.focus()
  }
})
</script>

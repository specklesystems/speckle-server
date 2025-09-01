<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll
        :selected-count="selectedCount"
        :total-count="filteredValues.length"
        @select-all="selectAll"
      />

      <!-- Sorting Controls -->
      <LayoutMenu
        v-model:open="showSortMenu"
        :items="sortMenuItems"
        show-ticks="right"
        :menu-position="HorizontalDirection.Left"
        :custom-menu-items-classes="['!text-body-2xs', '!w-36']"
        @chosen="onSortOptionChosen"
      >
        <FormButton
          size="sm"
          color="subtle"
          hide-text
          :icon-right="ArrowUpDown"
          :class="[
            'text-xs transition-colors hover:text-foreground',
            showSortMenu ? '!bg-highlight-2 !text-foreground' : 'text-foreground-2'
          ]"
          @click="showSortMenu = !showSortMenu"
        />
      </LayoutMenu>
    </div>
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
        <ViewerFiltersFilterStringValueItem
          :filter-id="filter.id"
          :value="value"
          :is-selected="isValueSelected(value)"
          :count="getValueCount(value)"
          :color="getValueColor(value)"
          :is-default-selected="
            isStringFilter(filter) &&
            filter.isDefaultAllSelected &&
            isValueSelected(value)
          "
          @toggle="() => toggleValue(value)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { isStringFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'
import {
  LayoutMenu,
  FormButton,
  HorizontalDirection,
  type LayoutMenuItem
} from '@speckle/ui-components'
import { ArrowUpDown } from 'lucide-vue-next'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
}>()

const {
  toggleActiveFilterValue,
  updateActiveFilterValues,
  isActiveFilterValueSelected,
  getFilterValueColor,
  getAvailableFilterValues,
  filters
} = useFilterUtilities()

const showSortMenu = ref(false)
const sortMode = ref<'selected-first' | 'alphabetical'>('alphabetical')

const sortMenuItems = computed<LayoutMenuItem[][]>(() => [
  [
    {
      id: 'alphabetical',
      title: 'A-Z',
      active: sortMode.value === 'alphabetical'
    },
    {
      id: 'selected-first',
      title: 'Selected first',
      active: sortMode.value === 'selected-first'
    }
  ]
])

// Handle sort option selection
const onSortOptionChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  sortMode.value = item.id as 'selected-first' | 'alphabetical'
  showSortMenu.value = false
}

const isValueSelected = (value: string): boolean => {
  return isActiveFilterValueSelected(props.filter.id, value)
}

const getValueCount = (_value: string): number => {
  return 1
}

const getValueColor = (value: string): string | null => {
  if (filters.activeColorFilterId.value !== props.filter.id) {
    return null
  }
  return getFilterValueColor(value)
}

const toggleValue = (value: string) => {
  toggleActiveFilterValue(props.filter.id, value)
}

const selectAll = (selected: boolean) => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return

  const allAvailableValues = getAvailableFilterValues(props.filter.filter)
  if (selected) {
    updateActiveFilterValues(props.filter.id, allAvailableValues)
  } else {
    updateActiveFilterValues(props.filter.id, [])
  }
}

const availableValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getAvailableFilterValues(props.filter.filter)
  }
  return []
})

const filteredValues = computed(() => {
  let values = availableValues.value

  if (props.searchQuery?.trim()) {
    const searchTerm = props.searchQuery.toLowerCase().trim()
    values = values.filter((value: string) => value.toLowerCase().includes(searchTerm))
  }

  if (sortMode.value === 'selected-first') {
    // Sort: selected first, then alphabetical
    const selectedValues = values.filter((value: string) => isValueSelected(value))
    const unselectedValues = values.filter((value: string) => !isValueSelected(value))

    // Sort each group alphabetically
    const sortedSelectedValues = selectedValues.sort((a, b) => a.localeCompare(b))
    const sortedUnselectedValues = unselectedValues.sort((a, b) => a.localeCompare(b))

    return [...sortedSelectedValues, ...sortedUnselectedValues]
  } else {
    // Sort: pure alphabetical
    return values.sort((a, b) => a.localeCompare(b))
  }
})

const selectedCount = computed(() => {
  return filteredValues.value.filter((value) => isValueSelected(value)).length
})

const itemHeight = 28 // Height of each checkbox item in pixels
const maxHeight = 240

const containerHeight = computed(() => {
  const contentHeight = filteredValues.value.length * itemHeight
  return `${Math.min(contentHeight, maxHeight)}px`
})

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight,
  overscan: 5
})
</script>

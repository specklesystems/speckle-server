<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll
        :filter="filter"
        :search-query="searchQuery"
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
        class="absolute top-0 left-0 w-full h-full"
        :style="{ transform: `translateY(${index * itemHeight}px)` }"
      >
        <ViewerFiltersFilterStringValueItem
          :filter="filter"
          :value="value"
          @toggle="() => toggleActiveFilterValue(filter.id, value)"
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

const { toggleActiveFilterValue, getFilteredFilterValues } = useFilterUtilities()

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

const filteredValues = computed(() => {
  if (isStringFilter(props.filter) && props.filter.filter) {
    return getFilteredFilterValues(props.filter.filter, {
      sortMode: sortMode.value,
      filterId: props.filter.id
    })
  }
  return []
})

const itemHeight = 28 // Height of each checkbox item in pixels
const maxHeight = 240

const { list, containerProps } = useVirtualList(filteredValues, {
  itemHeight: 28,
  overscan: 5
})

const containerHeight = computed(() => {
  const contentHeight = filteredValues.value.length * itemHeight
  return `${Math.min(contentHeight, maxHeight)}px`
})

const onSortOptionChosen = ({ item }: { item: LayoutMenuItem; event: MouseEvent }) => {
  sortMode.value = item.id as 'selected-first' | 'alphabetical'
  showSortMenu.value = false
}
</script>

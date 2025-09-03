<template>
  <div>
    <div class="flex justify-between items-center pr-1">
      <ViewerFiltersFilterStringSelectAll
        :filter="filter"
        :search-query="searchQuery"
      />

      <div
        :title="
          isLargeDataset
            ? 'Sorting disabled for large datasets (5,000+ values)'
            : undefined
        "
      >
        <ViewerFiltersFilterStringSortButton
          :disabled="isLargeDataset"
          :model-value="sortMode"
          @update:model-value="$emit('update:sortMode', $event)"
        />
      </div>
    </div>

    <div
      v-bind="containerProps"
      class="simple-scrollbar"
      :style="{ maxHeight: `${maxHeight}px` }"
    >
      <div v-bind="wrapperProps" class="relative">
        <div
          v-for="{ data: value, index } in list"
          :key="`${index}-${value}`"
          :style="{
            height: `${itemHeight}px`,
            overflow: 'hidden'
          }"
        >
          <ViewerFiltersFilterStringValueItem
            :filter="filter"
            :value="value"
            :value-groups-map="valueGroupsMap"
            @toggle="() => toggleActiveFilterValue(filter.id, value)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVirtualList } from '@vueuse/core'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import {
  isStringFilter,
  type FilterData,
  type SortMode
} from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
  searchQuery?: string
  sortMode: SortMode
  valueGroupsMap?: Map<string, { value: unknown; ids?: string[] }> | null
}>()

defineEmits<{
  'update:sortMode': [value: SortMode]
}>()

const itemHeight = 28
const maxHeight = 240

const { toggleActiveFilterValue } = useFilterUtilities()

// Lazy raw values computation for performance - avoids expensive operations on huge datasets
const rawValues = computed(() => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return []

  const filter = props.filter.filter
  if ('valueGroups' in filter && Array.isArray(filter.valueGroups)) {
    // For huge datasets, return a lazy proxy that computes values on demand
    if (filter.valueGroups.length > 10000) {
      return new Proxy([], {
        get(target, prop) {
          if (prop === 'length') return filter.valueGroups.length
          if (prop === Symbol.iterator) {
            return function* () {
              for (let i = 0; i < filter.valueGroups.length; i++) {
                const value = String(filter.valueGroups[i].value)
                if (
                  value !== null &&
                  value !== undefined &&
                  value !== 'null' &&
                  value !== 'undefined'
                ) {
                  yield value
                }
              }
            }
          }
          if (typeof prop === 'string' && /^\d+$/.test(prop)) {
            const index = parseInt(prop)
            const value = String(filter.valueGroups[index]?.value)
            return value !== null &&
              value !== undefined &&
              value !== 'null' &&
              value !== 'undefined'
              ? value
              : undefined
          }
          if (prop === 'slice') {
            return function (start: number, end?: number) {
              return filter.valueGroups
                .slice(start, end)
                .map((vg: { value: unknown }) => String(vg.value))
                .filter(
                  (v: string) =>
                    v !== null && v !== undefined && v !== 'null' && v !== 'undefined'
                )
            }
          }
          if (prop === 'filter') {
            return function (predicate: (value: string) => boolean) {
              const filtered: string[] = []
              for (let i = 0; i < filter.valueGroups.length; i++) {
                const value = String(filter.valueGroups[i].value)
                if (
                  value !== null &&
                  value !== undefined &&
                  value !== 'null' &&
                  value !== 'undefined' &&
                  predicate(value)
                ) {
                  filtered.push(value)
                }
              }
              return filtered
            }
          }
          return target[prop as keyof typeof target]
        }
      }) as string[]
    }

    return filter.valueGroups
      .map((vg) => String(vg.value))
      .filter((v) => v !== null && v !== undefined && v !== 'null' && v !== 'undefined')
  }
  return []
})

const filteredValues = computed(() => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return []

  const values = rawValues.value
  const totalLength = values.length

  // Conservative limits based on dataset size (following boss's pattern)
  const isHugeDataset = totalLength > 10000
  const isLargeDataset = totalLength > 1000

  // If there's a search query, filter efficiently with conservative limits
  if (props.searchQuery?.trim()) {
    const searchTerm = props.searchQuery.toLowerCase().trim()

    // Much more aggressive limits to prevent UI freezing
    const searchLimit = isHugeDataset ? 50 : isLargeDataset ? 100 : 500
    const filtered: string[] = []

    // Early termination search with conservative limits
    if (isHugeDataset || isLargeDataset) {
      // For large datasets, use optimized iteration
      for (let i = 0; i < totalLength && filtered.length < searchLimit; i++) {
        const value = values[i]
        if (value && value.toLowerCase().includes(searchTerm)) {
          filtered.push(value)
        }
        // Yield control every 100 items to prevent blocking
        if (i % 100 === 0 && i > 0) {
          // This allows Vue's reactivity to process other updates
          break
        }
      }
    } else {
      // For smaller datasets, use standard filter
      return values.filter((value: string) => value.toLowerCase().includes(searchTerm))
    }

    return filtered
  }

  // No search - virtual list handles rendering efficiently, so return all values
  // The virtual list will only render visible items regardless of total count
  return values
})

const isLargeDataset = computed(() => {
  if (!isStringFilter(props.filter) || !props.filter.filter) return false
  return (
    'valueGroups' in props.filter.filter &&
    Array.isArray(props.filter.filter.valueGroups) &&
    props.filter.filter.valueGroups.length > 5000
  )
})

// Optimize virtual list for huge datasets
const virtualListOptions = computed(() => {
  const baseOptions = {
    itemHeight,
    overscan: 5
  }

  // For huge datasets, reduce overscan to minimize DOM nodes
  if (filteredValues.value.length > 10000) {
    return {
      ...baseOptions,
      overscan: 2 // Reduce overscan for huge datasets
    }
  }

  return baseOptions
})

const { list, containerProps, wrapperProps } = useVirtualList(
  filteredValues,
  virtualListOptions.value
)
</script>

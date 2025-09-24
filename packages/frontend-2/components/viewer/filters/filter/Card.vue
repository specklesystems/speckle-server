<template>
  <div class="border border-outline-2 rounded-xl mb-2">
    <div
      class="p-1"
      :class="{ 'border-b border-outline-3': !collapsed && !isBooleanFilter(filter) }"
    >
      <ViewerFiltersFilterHeader
        v-model:collapsed="collapsed"
        :filter="filter"
        @swap-property="$emit('swapProperty', $event)"
      />
    </div>

    <div
      v-if="filter.filter && !collapsed"
      :class="{ 'opacity-50': !filter.isApplied }"
    >
      <ViewerFiltersFilterNumeric v-if="isNumericFilter(filter)" :filter="filter" />
      <ViewerFiltersFilterBoolean
        v-else-if="isBooleanFilter(filter)"
        :filter="filter"
      />
      <ViewerFiltersFilterArray v-else-if="isArrayFilter(filter)" :filter="filter" />
      <ViewerFiltersFilterString
        v-else
        :filter="filter"
        :sort-mode="sortMode"
        @update:sort-mode="sortMode = $event"
      />
      <ViewerFiltersFilterExistenceCount
        v-if="isExistenceCondition(filter.condition)"
        :filter="filter"
        @select-condition="handleConditionChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterData, ConditionOption } from '~/lib/viewer/helpers/filters/types'
import {
  isNumericFilter,
  isExistenceCondition,
  SortMode,
  isBooleanFilter,
  isArrayFilter
} from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

const props = defineProps<{
  filter: FilterData
}>()

defineEmits<{
  swapProperty: [filterId: string]
}>()

const { updateFilterCondition } = useFilterUtilities()

const collapsed = ref(false)
const sortMode = ref<SortMode>(SortMode.Alphabetical)

const handleConditionChange = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

<template>
  <div class="p-1">
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      class="pl-4"
      @select-condition="handleConditionSelect"
    />

    <ViewerFiltersFilterNumericBetween
      v-if="filter.condition === NumericFilterCondition.IsBetween"
      :filter="filter"
    />

    <ViewerFiltersFilterNumericSingle v-else :filter="filter" />
  </div>
</template>

<script setup lang="ts">
import type { FilterData, ConditionOption } from '~/lib/viewer/helpers/filters/types'
import { NumericFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

const props = defineProps<{
  filter: FilterData
}>()

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

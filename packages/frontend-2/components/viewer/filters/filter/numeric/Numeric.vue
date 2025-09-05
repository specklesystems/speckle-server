<template>
  <div class="pt-0.5">
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      @select-condition="handleConditionSelect"
    />

    <ViewerFiltersFilterNumericBetween
      v-if="filter.condition === NumericFilterCondition.IsBetween"
      :filter="filter"
    />

    <ViewerFiltersFilterNumericSingle
      v-else-if="!isExistenceCondition(filter.condition)"
      :filter="filter"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  NumericFilterData,
  ConditionOption
} from '~/lib/viewer/helpers/filters/types'
import {
  NumericFilterCondition,
  isExistenceCondition
} from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

const props = defineProps<{
  filter: NumericFilterData
}>()

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

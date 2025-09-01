<template>
  <div
    class="pt-0.5"
    :class="{
      'pb-1.5':
        filter.condition === ExistenceFilterCondition.IsSet ||
        filter.condition === ExistenceFilterCondition.IsNotSet
    }"
  >
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      class="pl-9"
      @select-condition="handleConditionSelect"
    />

    <ViewerFiltersFilterNumericBetween
      v-if="filter.condition === NumericFilterCondition.IsBetween"
      :filter="filter"
    />

    <ViewerFiltersFilterNumericSingle
      v-else-if="
        filter.condition !== ExistenceFilterCondition.IsSet &&
        filter.condition !== ExistenceFilterCondition.IsNotSet
      "
      :filter="filter"
    />
  </div>
</template>

<script setup lang="ts">
import type { FilterData, ConditionOption } from '~/lib/viewer/helpers/filters/types'
import {
  NumericFilterCondition,
  ExistenceFilterCondition
} from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'

const props = defineProps<{
  filter: FilterData
}>()

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

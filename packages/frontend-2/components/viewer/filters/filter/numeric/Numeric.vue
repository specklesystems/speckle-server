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
      v-else-if="!isExistenceCondition"
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
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

const props = defineProps<{
  filter: FilterData
}>()

const { updateFilterCondition } = useFilterUtilities()

const isExistenceCondition = computed(() => {
  return (
    props.filter.condition === ExistenceFilterCondition.IsSet ||
    props.filter.condition === ExistenceFilterCondition.IsNotSet
  )
})

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

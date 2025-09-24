<template>
  <div class="pt-0.5 pb-1 w-full">
    <ViewerFiltersFilterConditionSelector
      :filter="filter"
      :no-padding="noPadding"
      @select-condition="handleConditionSelect"
    />

    <ViewerFiltersFilterArrayContains
      v-if="
        filter.condition === ArrayFilterCondition.Contains ||
        filter.condition === ArrayFilterCondition.DoesNotContain
      "
      :filter="filter"
      :no-padding="noPadding"
    />
  </div>
</template>

<script setup lang="ts">
import type {
  ArrayFilterData,
  ConditionOption
} from '~/lib/viewer/helpers/filters/types'
import { ArrayFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

const props = defineProps<{
  filter: ArrayFilterData
  noPadding?: boolean
}>()

const { updateFilterCondition } = useFilterUtilities()

const handleConditionSelect = (conditionOption: ConditionOption) => {
  updateFilterCondition(props.filter.id, conditionOption.value)
}
</script>

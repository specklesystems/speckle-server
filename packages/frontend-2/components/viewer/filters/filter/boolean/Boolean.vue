<template>
  <div class="pt-2 pb-3 pl-8 flex flex-col gap-1">
    <FormRadio
      :name="`boolean-filter-${filter.id}`"
      :model-value="filter.condition"
      :value="BooleanFilterCondition.IsTrue"
      label="True"
      size="sm"
      @update:model-value="updateCondition(BooleanFilterCondition.IsTrue)"
    />

    <FormRadio
      :name="`boolean-filter-${filter.id}`"
      :model-value="filter.condition"
      :value="BooleanFilterCondition.IsFalse"
      label="False"
      size="sm"
      @update:model-value="updateCondition(BooleanFilterCondition.IsFalse)"
    />
  </div>
</template>

<script setup lang="ts">
import { BooleanFilterCondition } from '~/lib/viewer/helpers/filters/types'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'

import type { BooleanFilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: BooleanFilterData
}>()

const { updateFilterCondition } = useFilterUtilities()

const updateCondition = (condition: BooleanFilterCondition) => {
  updateFilterCondition(props.filter.id, condition)
}
</script>

<template>
  <div class="flex flex-col gap-2 px-9 pt-1 pb-2">
    <FormDualRange
      v-model="rangeValues"
      :name="`range-${filter.id}`"
      :min="filterMin"
      :max="filterMax"
      :step="0.0001"
      :style="
        isColoringActive
          ? {
              '--gradient-from': '#3b82f6',
              '--gradient-to': '#ec4899'
            }
          : {}
      "
      show-fields
    />
  </div>
</template>

<script setup lang="ts">
import { FormDualRange } from '@speckle/ui-components'
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import type { NumericFilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: NumericFilterData
}>()

const { setNumericRange, filters } = useFilterUtilities()

const filterMin = computed(() => props.filter.filter.min)
const filterMax = computed(() => props.filter.filter.max)

const rangeValues = computed({
  get: () => ({
    min: props.filter.numericRange.min,
    max: props.filter.numericRange.max
  }),
  set: (values: { min: number; max: number }) => {
    setNumericRange(props.filter.id, values.min, values.max)
  }
})

const isColoringActive = computed(() => {
  return filters.activeColorFilterId.value === props.filter.id
})
</script>

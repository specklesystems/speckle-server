<template>
  <div class="flex flex-col gap-2 px-9 pt-1 pb-2">
    <FormDualRange
      :min-value="currentMin"
      :max-value="currentMax"
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
      @update:min-value="updateMinValue"
      @update:max-value="updateMaxValue"
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

const currentMin = computed(() => props.filter.numericRange.min)
const currentMax = computed(() => props.filter.numericRange.max)

const updateMinValue = (value: number) => {
  setNumericRange(props.filter.id, value, props.filter.numericRange.max)
}

const updateMaxValue = (value: number) => {
  setNumericRange(props.filter.id, props.filter.numericRange.min, value)
}

const isColoringActive = computed(() => {
  return filters.activeColorFilterId.value === props.filter.id
})
</script>

<template>
  <div class="flex flex-col px-2 py-1 gap-1">
    <FormRange
      v-if="showRangeSlider"
      v-model="singleValueReactive"
      :min="filterMin"
      :max="filterMax"
      :step="0.01"
      name="singleValueRange"
      :label="rangeLabel"
      hide-header
      class="-mt-1.5"
    />

    <FormTextInput
      :model-value="String(singleValue)"
      name="singleValue"
      size="sm"
      type="number"
      placeholder="Enter value"
      @update:model-value="updateSingleValue"
    />
  </div>
</template>

<script setup lang="ts">
import { FormTextInput, FormRange } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import {
  isNumericFilter,
  NumericFilterCondition,
  type FilterData
} from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { setNumericRange } = useFilterUtilities()

// Get the filter's min/max bounds for range inputs
const filterMin = computed(() => {
  if (isNumericFilter(props.filter)) {
    return props.filter.filter.min
  }
  return 0
})

const filterMax = computed(() => {
  if (isNumericFilter(props.filter)) {
    return props.filter.filter.max
  }
  return 100
})

const singleValue = computed(() => props.filter.numericRange.min)

// Show range slider for greater than / less than conditions
const showRangeSlider = computed(() => {
  return (
    props.filter.condition === NumericFilterCondition.IsGreaterThan ||
    props.filter.condition === NumericFilterCondition.IsLessThan
  )
})

const rangeLabel = computed(() => {
  return props.filter.condition === NumericFilterCondition.IsGreaterThan
    ? 'Greater than'
    : 'Less than'
})

// Reactive value for FormRange v-model
const singleValueReactive = computed({
  get: () => props.filter.numericRange.min,
  set: (value: number) => {
    setNumericRange(props.filter.id, value, value)
  }
})

const updateSingleValue = (value: string) => {
  const numericValue = parseFloat(value) || 0
  // For single value conditions, set both min and max to the same value
  setNumericRange(props.filter.id, numericValue, numericValue)
}
</script>

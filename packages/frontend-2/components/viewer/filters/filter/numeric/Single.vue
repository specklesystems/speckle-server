<template>
  <div class="pl-9 pr-9 pt-1 pb-2">
    <FormRange
      v-if="showRangeSlider"
      v-model="singleValueReactive"
      :min="filterMin"
      :max="filterMax"
      :step="0.01"
      name="singleValueRange"
      :label="rangeLabel"
      hide-header
      input-below-slider
    />

    <FormTextInput
      v-if="!showRangeSlider"
      :model-value="String(singleValue)"
      type="number"
      name="singleValue"
      size="sm"
      auto-focus
      class="text-foreground !text-[12px] w-full bg-transparent !px-2 !border !border-outline-2 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 rounded no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      @update:model-value="updateSingleValue"
    />
  </div>
</template>

<script setup lang="ts">
import { FormRange } from '@speckle/ui-components'
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

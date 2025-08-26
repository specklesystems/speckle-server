<template>
  <div class="flex flex-col px-2 py-1">
    <FormDualRange
      v-model:min-value="currentMin"
      v-model:max-value="currentMax"
      :name="`range-${filter.id}`"
      :min="filterMin"
      :max="filterMax"
      :step="0.01"
      show-fields
    />
  </div>
</template>

<script setup lang="ts">
import { FormDualRange } from '@speckle/ui-components'
import { useFilterUtilities } from '~~/lib/viewer/composables/filtering'
import { isNumericFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { setNumericRange } = useFilterUtilities()

// Get the filter's min/max bounds
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

const currentMin = computed({
  get: () => {
    if (isNumericFilter(props.filter)) {
      return props.filter.numericRange.min
    }
    return 0
  },
  set: (value: number) => {
    if (isNumericFilter(props.filter)) {
      setNumericRange(props.filter.id, value, props.filter.numericRange.max)
    }
  }
})

const currentMax = computed({
  get: () => {
    if (isNumericFilter(props.filter)) {
      return props.filter.numericRange.max
    }
    return 100
  },
  set: (value: number) => {
    if (isNumericFilter(props.filter)) {
      setNumericRange(props.filter.id, props.filter.numericRange.min, value)
    }
  }
})
</script>

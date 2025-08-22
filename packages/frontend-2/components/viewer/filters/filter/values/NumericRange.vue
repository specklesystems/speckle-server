<template>
  <div class="flex flex-col p-3">
    <FormDualRange
      v-model:min-value="currentMin"
      v-model:max-value="currentMax"
      :name="`range-${filter.id}`"
      :min="(filter.filter as NumericPropertyInfo).min"
      :max="(filter.filter as NumericPropertyInfo).max"
      :step="0.01"
      show-fields
    />
  </div>
</template>

<script setup lang="ts">
import { FormDualRange } from '@speckle/ui-components'
import type { NumericPropertyInfo } from '@speckle/viewer'
import { useFilterUtilities } from '~~/lib/viewer/composables/ui'
import { isNumericFilter, type FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { setNumericRange } = useFilterUtilities()

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

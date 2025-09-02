<template>
  <div class="px-9 pt-1 pb-2">
    <FormTextInput
      :model-value="String(singleValue)"
      type="number"
      name="singleValue"
      size="sm"
      step="0.0001"
      auto-focus
      class="text-foreground !text-[12px] w-full bg-transparent !px-2 !border !border-outline-2 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 rounded no-spinner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      @update:model-value="updateSingleValue"
    />
  </div>
</template>

<script setup lang="ts">
import { useFilterUtilities } from '~/lib/viewer/composables/filtering/filtering'
import type { FilterData } from '~/lib/viewer/helpers/filters/types'

const props = defineProps<{
  filter: FilterData
}>()

const { setNumericRange } = useFilterUtilities()

const singleValue = computed(() => props.filter.numericRange.min)

const updateSingleValue = (value: string) => {
  const numericValue = parseFloat(value) || 0
  setNumericRange(props.filter.id, numericValue, numericValue)
}
</script>

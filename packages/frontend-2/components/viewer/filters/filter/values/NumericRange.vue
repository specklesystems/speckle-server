<template>
  <div class="flex flex-col p-3">
    <div class="flex justify-between text-body-3xs text-foreground-2">
      <span>{{ localMin.toFixed(2) }}</span>
      <span>{{ localMax.toFixed(2) }}</span>
    </div>

    <FormDualRange
      v-model:min-value="localMin"
      v-model:max-value="localMax"
      :name="`range-${filterId}`"
      :min="min"
      :max="max"
      :step="0.01"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { FormDualRange } from '@speckle/ui-components'

interface DualRangeValue {
  min: number
  max: number
}

const props = defineProps<{
  filterId: string
  propertyName: string
  min: number
  max: number
  currentMin: number
  currentMax: number
  hasColors: boolean
}>()

const emit = defineEmits<{
  rangeChange: [value: DualRangeValue]
}>()

const localMin = ref(props.currentMin)
const localMax = ref(props.currentMax)

// Watch for changes and emit (immediate)
watch([localMin, localMax], ([newMin, newMax]) => {
  emit('rangeChange', { min: newMin, max: newMax })
})

// Watch for external prop changes
watch(
  () => props.currentMin,
  (newMin) => {
    localMin.value = newMin
  }
)

watch(
  () => props.currentMax,
  (newMax) => {
    localMax.value = newMax
  }
)
</script>

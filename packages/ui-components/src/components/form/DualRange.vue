<template>
  <div>
    <div class="w-full h-5">
      <div class="relative">
        <!-- Min range input -->
        <input
          :id="`${name}-min`"
          :name="`${name}-min`"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="minValue"
          :disabled="disabled"
          class="absolute w-full h-4 outline-none slider slider-min"
          style="-webkit-appearance: none; appearance: none; pointer-events: none"
          :class="{ 'disabled:opacity-50 disabled:cursor-not-allowed': disabled }"
          :aria-label="`${name} minimum`"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="minValue"
          @input="handleMinInput"
        />

        <!-- Max range input -->
        <input
          :id="`${name}-max`"
          :name="`${name}-max`"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="maxValue"
          :disabled="disabled"
          class="absolute w-full h-4 outline-none slider slider-max"
          style="-webkit-appearance: none; appearance: none; pointer-events: none"
          :class="{ 'disabled:opacity-50 disabled:cursor-not-allowed': disabled }"
          :aria-label="`${name} maximum`"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="maxValue"
          @input="handleMaxInput"
        />

        <!-- Visual track highlight between handles -->
        <div
          class="absolute top-0.5 h-3 bg-outline-5 rounded-full pointer-events-none z-0"
          :style="{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }"
        />
      </div>
    </div>
    <div v-if="showFields" class="flex justify-between gap-2 mt-1">
      <FormTextInput
        v-model="minValueString"
        size="sm"
        class="max-w-max"
        type="number"
        :name="`${name}-min`"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        placeholder="Min"
      />
      <FormTextInput
        v-model="maxValueString"
        size="sm"
        type="number"
        class="max-w-max"
        :name="`${name}-max`"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        placeholder="Max"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { FormTextInput } from '~~/src/lib'

const props = defineProps<{
  min: number
  max: number
  step: number
  name: string
  disabled?: boolean
  showFields?: boolean
}>()

const minValue = defineModel<number>('minValue', {
  default: 0
})

const maxValue = defineModel<number>('maxValue', {
  default: 100
})

const clampValue = (value: number): number => {
  return Math.max(props.min, Math.min(props.max, value))
}

// String versions for FormTextInput compatibility
const minValueString = computed({
  get: () => minValue.value.toString(),
  set: (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      const clampedValue = clampValue(numValue)
      // Ensure min doesn't exceed max
      const finalValue = Math.min(clampedValue, maxValue.value)
      minValue.value = finalValue
    }
  }
})

const maxValueString = computed({
  get: () => maxValue.value.toString(),
  set: (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      const clampedValue = clampValue(numValue)
      // Ensure max doesn't go below min
      const finalValue = Math.max(clampedValue, minValue.value)
      maxValue.value = finalValue
    }
  }
})

// Computed percentages for visual track
const minPercentage = computed(() => {
  return ((minValue.value - props.min) / (props.max - props.min)) * 100
})

const maxPercentage = computed(() => {
  return ((maxValue.value - props.min) / (props.max - props.min)) * 100
})

const handleMinInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = clampValue(Number(target.value))

  // Ensure min doesn't exceed max
  minValue.value = Math.min(value, maxValue.value)
}

const handleMaxInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = clampValue(Number(target.value))

  // Ensure max doesn't go below min
  maxValue.value = Math.max(value, minValue.value)
}
</script>

<style lang="postcss" scoped>
input[type='number']::-webkit-outer-spin-button,
input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type='number'] {
  -moz-appearance: textfield;
  appearance: textfield;
}

/* Show track for min slider */
.slider-min::-webkit-slider-runnable-track {
  @apply h-4 rounded-full outline-outline-2 bg-highlight-1 px-0.5;
  box-shadow: inset 0 1px 4px 0 rgba(0, 0, 0, 0.04);
  outline-width: 1px;
  outline-style: solid;
}

.slider-min::-moz-range-track {
  @apply h-4 rounded-full outline-outline-2 bg-highlight-1 px-0.5;
  box-shadow: inset 0 1px 4px 0 rgba(0, 0, 0, 0.04);
  outline-width: 1px;
  outline-style: solid;
}

/* Hide track for max slider */
.slider-max::-webkit-slider-runnable-track {
  background: transparent;
  border: none;
  outline: none;
  height: 16px;
  border-radius: 9999px;
}

.slider-max::-moz-range-track {
  background: transparent;
  border: none;
  outline: none;
  height: 16px;
  border-radius: 9999px;
}

/* Firefox specific track hiding */
.slider::-moz-range-progress {
  background: transparent;
}

.slider::-webkit-slider-thumb {
  @apply appearance-none h-3 w-3 mt-0.5 rounded-full bg-foreground-on-primary cursor-pointer outline-outline-5;
  outline-width: 1px;
  outline-style: solid;
  z-index: 20;
  position: relative;
  pointer-events: auto;
}

.slider::-moz-range-thumb {
  @apply appearance-none h-3 w-3 mt-0.5 rounded-full bg-foreground-on-primary cursor-pointer outline-outline-5;
  outline-width: 1px;
  outline-style: solid;
  z-index: 20;
  position: relative;
  pointer-events: auto;
}
</style>

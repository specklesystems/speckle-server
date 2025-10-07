<template>
  <div>
    <div class="w-full h-5 max-w-96" :style="props.style">
      <div class="relative">
        <!-- Min range input -->
        <input
          :id="`${name}-min`"
          :name="`${name}-min`"
          type="range"
          :min="min"
          :max="max"
          :step="step"
          :value="modelValue.min"
          :disabled="disabled"
          class="absolute w-full h-4 outline-none slider slider-min"
          style="-webkit-appearance: none; appearance: none; pointer-events: none"
          :class="{ 'disabled:opacity-50 disabled:cursor-not-allowed': disabled }"
          :aria-label="`${name} minimum`"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="modelValue.min"
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
          :value="modelValue.max"
          :disabled="disabled"
          class="absolute w-full h-4 outline-none slider slider-max px-0.5"
          style="-webkit-appearance: none; appearance: none; pointer-events: none"
          :class="{ 'disabled:opacity-50 disabled:cursor-not-allowed': disabled }"
          :aria-label="`${name} maximum`"
          :aria-valuemin="min"
          :aria-valuemax="max"
          :aria-valuenow="modelValue.max"
          @input="handleMaxInput"
        />

        <!-- Visual track highlight between handles -->
        <div
          class="absolute top-0.5 h-3 w-full pointer-events-none z-0 overflow-hidden"
          style="background: transparent"
        >
          <div
            class="absolute inset-0 bg-gray-300/60 dark:bg-gray-200/40"
            :style="{
              left: trackLeft,
              right: trackRight
            }"
          />
        </div>
      </div>
    </div>
    <div v-if="showFields" class="flex justify-between gap-2 mt-0.5">
      <input
        v-model="minValueString"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="`${name}-min`"
        placeholder="Min"
        class="mt-0 w-16 text-body-2xs text-foreground-2 bg-transparent border-0 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:ring-0 rounded !p-1"
      />

      <input
        v-model="maxValueString"
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-label="`${name}-max`"
        placeholder="Max"
        class="mt-0 w-16 text-body-2xs text-foreground-2 bg-transparent border-0 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:ring-0 rounded !p-1 text-right"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  min: number
  max: number
  step: number
  name: string
  disabled?: boolean
  showFields?: boolean
  style?: Record<string, string | number>
}>()

const modelValue = defineModel<{ min: number; max: number }>({
  default: () => ({ min: 0, max: 100 })
})

const clampValue = (value: number): number => {
  return Math.max(props.min, Math.min(props.max, value))
}

// String versions for FormTextInput compatibility
const minValueString = computed({
  get: () => modelValue.value.min.toString(),
  set: (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      const clampedValue = clampValue(numValue)
      const finalValue = Math.min(clampedValue, modelValue.value.max)
      modelValue.value = { ...modelValue.value, min: finalValue }
    }
  }
})

const maxValueString = computed({
  get: () => modelValue.value.max.toString(),
  set: (value: string) => {
    const numValue = Number(value)
    if (!isNaN(numValue)) {
      const clampedValue = clampValue(numValue)
      const finalValue = Math.max(clampedValue, modelValue.value.min)
      modelValue.value = { ...modelValue.value, max: finalValue }
    }
  }
})

const minPercentage = computed(() => {
  const basePercentage =
    ((modelValue.value.min - props.min) / (props.max - props.min)) * 100
  const thumbOffset = 0.5
  return Math.max(0, basePercentage - thumbOffset)
})

const maxPercentage = computed(() => {
  const basePercentage =
    ((modelValue.value.max - props.min) / (props.max - props.min)) * 100
  const thumbOffset = 0.5
  return Math.min(100, basePercentage + thumbOffset)
})

const trackLeft = computed(() => {
  const percentage = minPercentage.value
  if (percentage < 25) return `${percentage + 2.5}%`
  if (percentage > 75) return `${percentage - 2.5}%`
  return `${percentage}%`
})

const trackRight = computed(() => {
  const percentage = 100 - maxPercentage.value
  if (percentage < 25) return `${percentage + 2.5}%`
  if (percentage > 75) return `${percentage - 2.5}%`
  return `${percentage}%`
})

const handleMinInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = clampValue(Number(target.value))

  modelValue.value = {
    ...modelValue.value,
    min: Math.min(value, modelValue.value.max)
  }
}

const handleMaxInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = clampValue(Number(target.value))

  modelValue.value = {
    ...modelValue.value,
    max: Math.max(value, modelValue.value.min)
  }
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

/* Gradient styling for slider inputs when gradient custom properties are set */
.slider-min::-webkit-slider-runnable-track {
  background: linear-gradient(
    to right,
    var(--gradient-from, var(--highlight-1)),
    var(--gradient-to, var(--highlight-1))
  ) !important;
}

.slider-min::-moz-range-track {
  background: linear-gradient(
    to right,
    var(--gradient-from, var(--highlight-1)),
    var(--gradient-to, var(--highlight-1))
  ) !important;
}
</style>

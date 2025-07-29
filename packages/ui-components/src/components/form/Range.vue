<template>
  <div class="w-full py-4">
    <div class="flex items-center justify-between">
      <label :for="name" class="block text-body-2xs text-foreground">
        {{ label || name }}
      </label>
      <input
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :value="currentValue"
        :aria-label="`${label} current value`"
        class="w-8 text-body-2xs text-foreground bg-transparent border-0 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 rounded !p-0.5 text-right"
        @input="handleNumberInput"
        @blur="validateAndClamp"
      />
    </div>

    <input
      :id="name"
      :name="name"
      type="range"
      :min="min"
      :max="max"
      :step="step"
      :value="currentValue"
      class="mt-1.5 w-full h-4 outline-none slider"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="currentValue"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  min: number
  max: number
  step: number
  name: string
  label: string
}>()

const emit = defineEmits(['update:modelValue'])

const currentValue = defineModel({
  type: Number,
  default: 0
})

const clampValue = (value: number): number => {
  return Math.max(props.min, Math.min(props.max, value))
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  const clampedValue = clampValue(value)
  currentValue.value = clampedValue
  emit('update:modelValue', clampedValue)
}

const handleNumberInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  // Don't clamp during typing, only set the value
  currentValue.value = value
  emit('update:modelValue', value)
}

const validateAndClamp = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = Number(target.value)
  const clampedValue = clampValue(value)

  if (value !== clampedValue) {
    target.value = clampedValue.toString()
  }

  currentValue.value = clampedValue
  emit('update:modelValue', clampedValue)
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

.slider::-webkit-slider-runnable-track {
  @apply h-4 rounded-full outline-outline-2 bg-highlight-1 px-0.5;
  box-shadow: inset 0 1px 4px 0 rgba(0, 0, 0, 0.04);
  outline-width: 1px;
  outline-style: solid;
}

.slider::-moz-range-track {
  @apply h-4 rounded-full outline-outline-2 bg-highlight-1 px-0.5;
  box-shadow: inset 0 1px 4px 0 rgba(0, 0, 0, 0.04);
  outline-width: 1px;
  outline-style: solid;
}

.slider::-webkit-slider-thumb {
  @apply appearance-none h-3 w-3 mt-0.5 rounded-full bg-foreground-on-primary cursor-pointer outline-outline-5;
  outline-width: 1px;
  outline-style: solid;
}

.slider::-moz-range-thumb {
  @apply appearance-none h-3 w-3 mt-0.5 rounded-full bg-foreground-on-primary cursor-pointer outline-outline-5;
  outline-width: 1px;
  outline-style: solid;
}
</style>

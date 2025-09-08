<template>
  <div class="w-full flex flex-col gap-1.5" :style="props.style">
    <div v-if="!hideHeader" class="flex items-center justify-between">
      <label
        :for="name"
        class="block text-body-2xs"
        :class="disabled ? 'text-foreground-2' : 'text-foreground'"
      >
        {{ label || name }}
      </label>
      <input
        type="number"
        :min="min"
        :max="max"
        :step="step"
        :value="currentValue"
        :disabled="disabled"
        :aria-label="`${label} current value`"
        class="w-8 text-body-2xs text-foreground-2 bg-transparent border-0 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:ring-0 rounded !p-0.5 text-right"
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
      :disabled="disabled"
      class="mt-1.5 w-full h-4 outline-none slider slider-gradient"
      :class="{
        'disabled:opacity-50 disabled:cursor-not-allowed': disabled,
        '!mt-0': inputBelowSlider
      }"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="currentValue"
      @input="handleInput"
    />
    <input
      v-if="inputBelowSlider"
      type="number"
      :min="min"
      :max="max"
      :step="step"
      :value="currentValue"
      :disabled="disabled"
      :aria-label="`${label} current value`"
      class="w-16 text-body-2xs text-foreground-2 bg-transparent border-0 focus:outline-none hover:ring-1 hover:ring-outline-2 focus:ring-1 focus:ring-outline-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:ring-0 rounded !p-1"
      @input="handleNumberInput"
      @blur="validateAndClamp"
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
  disabled?: boolean
  hideHeader?: boolean
  inputBelowSlider?: boolean
  style?: Record<string, string | number>
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

/* Gradient styling for slider inputs when gradient custom properties are set */
.slider-gradient::-webkit-slider-runnable-track {
  background: linear-gradient(
    to right,
    var(--gradient-from, var(--highlight-1)),
    var(--gradient-to, var(--highlight-1))
  ) !important;
}
</style>

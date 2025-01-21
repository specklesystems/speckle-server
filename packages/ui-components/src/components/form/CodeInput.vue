<template>
  <div class="flex flex-col items-center">
    <div class="flex gap-2">
      <div v-for="(_, index) in digitCount" :key="index" class="w-10">
        <FormTextInput
          ref="inputRefs"
          v-model="digits[index]"
          class="text-center text-body-sm py-6 !px-2"
          color="foundation"
          :name="`code-${index}`"
          type="text"
          inputmode="numeric"
          :disabled="disabled"
          :error="internalError"
          :custom-error-message="internalError ? ' ' : undefined"
          maxlength="1"
          size="lg"
          @input="onInput(index)"
          @keydown="onKeyDown(index, $event)"
          @paste="onPaste"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { FormTextInput } from '~~/src/lib'

const props = withDefaults(
  defineProps<{
    modelValue: string
    digitCount?: number
    disabled?: boolean
    error?: boolean
    clearErrorOnEdit?: boolean
  }>(),
  {
    digitCount: 6,
    clearErrorOnEdit: true
  }
)

const emit = defineEmits(['update:modelValue', 'complete'])

const inputRefs = ref<Array<HTMLInputElement | null>>([])
const digits = ref<string[]>(new Array(props.digitCount).fill('') as string[])
const internalError = ref(props.error)

const onInput = (index: number) => {
  if (props.clearErrorOnEdit) {
    internalError.value = false
  }

  digits.value[index] = digits.value[index].replace(/[^0-9]/g, '')

  // Move to next input if available
  if (digits.value[index] && index < props.digitCount - 1) {
    inputRefs.value[index + 1]?.focus()
  }
}

const onKeyDown = (index: number, event: KeyboardEvent) => {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    if (props.clearErrorOnEdit) {
      internalError.value = false
    }
    // Move to previous input on backspace if current is empty
    digits.value[index - 1] = ''
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowLeft' && index > 0) {
    // Move to previous input on left arrow
    inputRefs.value[index - 1]?.focus()
  } else if (event.key === 'ArrowRight' && index < props.digitCount - 1) {
    // Move to next input on right arrow
    inputRefs.value[index + 1]?.focus()
  }
}

const onPaste = (event: ClipboardEvent) => {
  if (props.clearErrorOnEdit) {
    internalError.value = false
  }
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text')
  if (!pastedData) return

  const numbers = pastedData.replace(/[^0-9]/g, '').split('')

  digits.value = [
    ...numbers.slice(0, props.digitCount),
    ...(Array(Math.max(0, props.digitCount - numbers.length)).fill('') as string[])
  ]

  // Focus the next empty input or the last input
  const nextEmptyIndex = digits.value.findIndex((d) => !d)
  if (nextEmptyIndex !== -1) {
    inputRefs.value[nextEmptyIndex]?.focus()
  } else {
    inputRefs.value[props.digitCount - 1]?.focus()
  }
}

// Focus first input on mount
onMounted(() => {
  if (inputRefs.value[0]) {
    inputRefs.value[0].focus()
  }
})

// Watch external error prop changes
watch(
  () => props.error,
  (newValue) => {
    internalError.value = newValue
  }
)

// Watch for external value changes
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      const newDigits = newValue.split('')
      digits.value = [
        ...newDigits,
        ...(Array(props.digitCount - newDigits.length).fill('') as string[])
      ]
    } else {
      digits.value = Array(props.digitCount).fill('') as string[]
    }
  },
  { immediate: true }
)

// Watch for completion
watch(
  digits,
  (newDigits) => {
    const value = newDigits.join('')
    emit('update:modelValue', value)

    // Emit complete when all digits are filled
    if (value.length === props.digitCount) {
      emit('complete', value)
    }
  },
  { deep: true }
)
</script>

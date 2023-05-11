<template>
  <button :class="computedClasses" :disabled="disabled" @click="onClick">
    <slot>Text</slot>
  </button>
</template>
<script setup lang="ts">
import { computed } from 'vue'

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'click', v: MouseEvent): void
}>()

const props = defineProps<{
  disabled?: boolean
  modelValue?: boolean
}>()

const computedClasses = computed(() => {
  const classParts: string[] = [
    'h-20 bg-foundation-2 inline-flex justify-center items-center outline-none',
    'normal px-16 py-5 shadow rounded transition active:scale-95'
  ]

  if (props.disabled) {
    classParts.push('bg-foundation-disabled text-foreground-2 cursor-not-allowed')
  } else {
    classParts.push(
      props.modelValue
        ? 'bg-primary-focus text-foreground-on-primary'
        : 'bg-foundation text-foreground'
    )
    classParts.push('ring-outline-2 hover:ring-4')
  }

  return classParts.join(' ')
})

const onClick = (e: MouseEvent) => {
  if (props.disabled) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    return
  }

  emit('update:modelValue', !props.modelValue)
  emit('click', e)
}
</script>

<template>
  <button
    class="relative transition rounded-md w-8 h-8 shrink-0 flex items-center justify-center outline-none"
    :disabled="disabled"
    :class="buttonClasses"
  >
    <component :is="icon" v-if="icon" class="size-5" />
    <slot />
    <div
      v-if="dot"
      class="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-primary rounded-full border-2 border-foundation"
    />
  </button>
</template>

<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

const props = defineProps<{
  active?: boolean
  icon?: ConcreteComponent
  secondary?: boolean
  dot?: boolean
  disabled?: boolean
}>()

const buttonClasses = computed(() => {
  const baseClasses =
    'relative transition rounded-md w-8 h-8 shrink-0 flex items-center justify-center outline-none'
  const disabledClasses = props.disabled ? 'opacity-50' : ''

  const stateClasses = props.active
    ? 'bg-info-lighter text-primary-focus dark:text-foreground-on-primary'
    : `bg-foundation ${props.secondary ? 'text-foreground-3' : 'text-foreground'} ${
        !props.disabled
          ? 'md:hover:bg-primary-muted md:focus-visible:border-foundation'
          : ''
      }`

  return `${baseClasses} ${disabledClasses} ${stateClasses}`
})
</script>

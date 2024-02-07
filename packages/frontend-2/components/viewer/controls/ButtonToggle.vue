<template>
  <button
    :class="`transition rounded-lg w-8 md:w-10 h-8 md:h-10 shrink-0 flex items-center justify-center ${shadowClasses} ${colorClasses} active:scale-[0.9] outline-none`"
  >
    <slot></slot>
  </button>
</template>
<script setup lang="ts">
const props = defineProps<{
  active?: boolean
  flat?: boolean
  secondary?: boolean
}>()

const shadowClasses = computed(() => (props.flat ? '' : 'shadow-md'))

const colorClasses = computed(() => {
  const parts = []
  if (props.active) {
    if (props.secondary) parts.push('bg-foundation text-primary')
    else parts.push('bg-primary text-foreground-on-primary')
  } else {
    parts.push('bg-foundation text-foreground')
  }
  return parts.join(' ')
})
</script>

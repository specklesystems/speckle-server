<template>
  <button
    :class="`transition rounded-lg w-8 md:w-10 h-8 md:h-10 shrink-0 flex items-center justify-center ${colorClasses} outline-none ${
      props.flat ? '!w-7 md:!w-9' : 'border border-outline-2 w-8 md:w-10 shadow'
    }`"
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

const colorClasses = computed(() => {
  const parts = []
  if (props.active) {
    if (props.secondary) parts.push('bg-foundation text-primary')
    else parts.push('bg-primary text-foreground-on-primary border-primary')
  } else {
    parts.push('bg-foundation text-foreground')
  }
  return parts.join(' ')
})
</script>

<template>
  <div :class="classes">
    <slot />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  smallView?: boolean
}>()

const classes = computed(() => {
  const classParts = ['grid grid-cols-1 gap-2 sm:gap-4 sm:grid-cols-2']

  if (!props.smallView) {
    classParts.push('lg:gap-6 lg:grid-cols-3')
  }

  return classParts.join(' ')
})
</script>

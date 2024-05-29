<template>
  <div :class="classes">
    <slot />
  </div>
</template>
<script setup lang="ts">
const props = defineProps<{
  smallView?: boolean
  vertical?: boolean
}>()

const classes = computed(() => {
  const classParts = ['grid gap-4 lg:gap-6']

  if (props.vertical) {
    classParts.push('grid-cols-1')
  } else if (props.smallView) {
    classParts.push('grid-cols-1 sm:grid-cols-2')
  } else {
    classParts.push('grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')
  }

  return classParts.join(' ')
})
</script>

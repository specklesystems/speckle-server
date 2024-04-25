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

  if (!props.vertical) {
    classParts.push('sm:grid-cols-2')

    if (!props.smallView) {
      classParts.push('lg:grid-cols-3')
    }
  }

  return classParts.join(' ')
})
</script>

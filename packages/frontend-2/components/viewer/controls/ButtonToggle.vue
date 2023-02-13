<template>
  <button
    :class="`${
      active ? 'bg-primary text-foreground-on-primary' : 'bg-foundation text-foreground'
    } ${
      flat ? '' : 'shadow-md'
    } transition rounded-full w-10 h-10 flex items-center justify-center`"
  >
    <slot></slot>
  </button>
</template>
<script setup lang="ts">
defineProps<{
  active?: boolean
  flat?: boolean
}>()
</script>

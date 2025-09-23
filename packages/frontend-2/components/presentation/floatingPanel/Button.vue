<template>
  <button
    class="size-8 flex items-center justify-center bg-foundation rounded-xl hover:bg-info-lighter hover:text-primary-focus dark:hover:text-foreground-on-primary"
    :class="{
      'bg-info-lighter text-primary-focus dark:text-foreground-on-primary': isActive
    }"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isActive?: boolean
}>()
</script>

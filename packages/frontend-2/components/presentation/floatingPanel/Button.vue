<template>
  <button
    class="size-8 flex items-center text-foreground justify-center bg-foundation rounded-md hover:bg-primary-muted dark:hover:text-foreground-on-primary"
    :class="{
      'bg-info-lighter hover:!bg-info-lighter text-primary-focus dark:text-foreground-on-primary':
        isActive
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

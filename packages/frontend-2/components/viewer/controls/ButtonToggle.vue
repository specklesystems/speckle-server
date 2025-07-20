<template>
  <button
    class="transition rounded-md w-8 h-8 shrink-0 flex items-center justify-center outline-none"
    :class="
      active
        ? 'bg-info-lighter text-primary-focus dark:text-foreground-on-primary'
        : 'bg-foundation text-foreground hover:bg-primary-muted focus-visible:border-foundation'
    "
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
}>()
</script>

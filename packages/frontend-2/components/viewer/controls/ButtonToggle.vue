<template>
  <button
    class="transition rounded-lg w-8 h-8 shrink-0 flex items-center justify-center outline-none"
    :class="
      active
        ? 'bg-info-lighter text-primary-focus dark:text-foreground-on-primary'
        : 'bg-foundation text-foreground hover:bg-primary-muted focus-visible:border-foundation'
    "
  >
    <component :is="icon" v-if="icon" class="h-4 w-4 md:h-5 md:w-5" />
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
  icon?: string
}>()
</script>

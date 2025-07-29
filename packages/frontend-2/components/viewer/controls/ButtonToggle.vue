<template>
  <button
    class="transition rounded-md w-8 h-8 shrink-0 flex items-center justify-center outline-none"
    :class="
      active
        ? 'bg-info-lighter text-primary-focus dark:text-foreground-on-primary'
        : 'bg-foundation text-foreground md:hover:bg-primary-muted md:focus-visible:border-foundation'
    "
  >
    <component :is="icon" v-if="icon" class="size-5" />
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  active?: boolean
  icon?: string
}>()
</script>

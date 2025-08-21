<template>
  <button
    class="flex items-center justify-center rounded-lg text-foreground"
    :class="[
      isActive
        ? 'shadow-[0px_1px_2px_rgba(0,0,0,0.05),0px_0px_1px_rgba(0,0,0,0.05)] bg-foundation'
        : 'hover:bg-foundation-page'
    ]"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isActive?: boolean
}>()
</script>

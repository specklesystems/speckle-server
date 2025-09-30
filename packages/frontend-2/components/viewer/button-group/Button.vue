<template>
  <button
    class="flex items-center justify-center rounded-[5px] text-foreground"
    :class="[isActive ? 'shadow-md bg-foundation' : 'hover:bg-foundation-page']"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isActive?: boolean
}>()
</script>

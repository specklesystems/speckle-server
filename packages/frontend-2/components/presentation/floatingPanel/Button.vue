<template>
  <button
    class="size-8 flex items-center justify-center bg-foundation rounded-xl hover:bg-info-lighter hover:text-primary-focus"
    :class="{ 'bg-info-lighter text-primary-focus': isActive }"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isActive?: boolean
}>()
</script>

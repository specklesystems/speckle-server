<template>
  <div
    class="viewer-controls-button-group bg-foundation text-foreground rounded-lg flex justify-center items-center gap-1 border border-outline-2 p-1"
    :class="direction === 'horizontal' ? 'flex-row' : 'flex-col'"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'horizontal' | 'vertical'
  }>(),
  {
    direction: 'horizontal'
  }
)
</script>

<style scoped>
.viewer-controls-button-group {
  box-shadow: 0px 2px 4px -2px rgba(0, 0, 0, 0.02),
    0px 4px 6px -1px rgba(16, 16, 16, 0.02);
}
</style>

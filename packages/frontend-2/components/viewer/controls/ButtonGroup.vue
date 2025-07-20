<template>
  <div
    class="bg-foundation text-foreground rounded-lg flex justify-center items-center gap-1 border border-outline-2 shadow p-1"
    :class="direction === 'horizontal' ? 'flex-row' : 'flex-col'"
  >
    <slot></slot>
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

<template>
  <div
    class="bg-foundation basis-1/2 shrink-0 grow-0 border border-outline-3 rounded-lg"
  >
    <div class="px-4 py-2 border-b border-outline-3 mb-4">
      <h3 class="text-heading-sm">{{ title }}</h3>
    </div>
    <div class="px-4 pb-4">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

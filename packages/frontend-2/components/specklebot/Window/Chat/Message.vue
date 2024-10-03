<template>
  <div
    class="max-w-max w-7/12 text-body-xs rounded-md px-4 py-2 mb-4"
    :class="isUser ? 'ml-auto bg-primary text-foundation' : 'bg-highlight-3'"
  >
    <slot />
  </div>
</template>
<script setup lang="ts">
defineProps<{
  isUser: boolean
}>()
</script>

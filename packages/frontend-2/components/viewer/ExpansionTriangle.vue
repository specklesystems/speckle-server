<template>
  <button
    type="button"
    :aria-label="isExpanded ? 'Collapse' : 'Expand'"
    class="text-foreground-2 hover:text-foreground rounded-md h-8 w-4 flex items-center justify-center shrink-0"
    @click.stop="$emit('click')"
  >
    <IconTriangle class="w-4 h-4" :class="isExpanded ? 'rotate-90' : ''" />
    <span class="sr-only">
      {{ isExpanded ? 'Collapse' : 'Expand' }}
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  isExpanded?: boolean
}>()

defineEmits<{
  click: []
}>()
</script>

<template>
  <button
    type="button"
    class="group-hover:opacity-100 hover:bg-highlight-3 rounded-md h-5 w-4 flex items-center justify-center shrink-0"
    @click.stop="$emit('click')"
  >
    <IconTriangle
      class="w-4 h-4 text-foreground-2"
      :class="isExpanded ? 'rotate-90' : ''"
    />
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

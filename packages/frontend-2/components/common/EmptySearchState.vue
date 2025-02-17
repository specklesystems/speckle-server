<template>
  <CommonEmptyState :cta="cta">
    No items matching your search query found
  </CommonEmptyState>
</template>
<script setup lang="ts">
/**
 * NOTE: This is deprecated, use CommonGenericEmptyState instead
 */

const emit = defineEmits<{ 'clear-search': [] }>()

const cta = {
  text: 'Clear search',
  onClick: () => emit('clear-search')
}
</script>

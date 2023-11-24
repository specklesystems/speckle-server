<template>
  <CommonEmptyState :cta="cta">
    No items matching your search query found!
  </CommonEmptyState>
</template>
<script setup lang="ts">
const emit = defineEmits<{ 'clear-search': [] }>()

const cta = {
  text: 'Clear Search',
  onClick: () => emit('clear-search')
}
</script>

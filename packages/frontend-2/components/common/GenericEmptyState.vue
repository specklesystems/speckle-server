<template>
  <CommonEmptyState :cta="cta">
    {{ search ? 'No items matching your search query found!' : message }}
  </CommonEmptyState>
</template>
<script setup lang="ts">
const emit = defineEmits<{ 'clear-search': [] }>()

const props = withDefaults(
  defineProps<{
    search?: boolean
    message?: string
  }>(),
  {
    message: 'No items found!'
  }
)

const clearSearchCta = ref({
  text: 'Clear Search',
  onClick: () => emit('clear-search')
})

const cta = computed(() => (props.search ? clearSearchCta.value : undefined))
</script>

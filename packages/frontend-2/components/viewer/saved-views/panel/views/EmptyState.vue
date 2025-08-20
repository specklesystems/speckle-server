<template>
  <div class="flex flex-col gap-8 items-center my-16">
    <IllustrationEmptystateViewsTab />
    <div class="text-foreground-2 px-6">{{ message }}</div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    type?: 'base' | 'search'
  }>(),
  {
    type: 'base'
  }
)

const message = computed(() => {
  if (props.type === 'search') {
    return 'No saved scenes match your search criteria'
  }
  return 'There are no saved scenes yet'
})
</script>

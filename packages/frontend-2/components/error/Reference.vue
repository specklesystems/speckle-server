<template>
  <CommonCopyButton :title="title" :size="size" />
</template>
<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string
    size?: string
  }>(),
  {
    title:
      'If you would like help from the server administrators, click to copy the error reference.',
    size: 'text-body-3xs'
  }
)
</script>

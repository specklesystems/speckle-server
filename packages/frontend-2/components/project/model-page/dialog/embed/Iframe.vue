<template>
  <iframe
    :src="src"
    :title="title"
    :width="width"
    :height="height"
    frameborder="0"
    scrolling="no"
  ></iframe>
</template>

<script setup lang="ts">
defineProps<{
  src: string
  title: string
  width?: string | number
  height?: string | number
}>()
</script>

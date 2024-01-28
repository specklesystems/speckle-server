<template>
  <iframe
    :src="src"
    :title="title"
    :width="width"
    :height="height"
    :class="iframeClass"
    frameborder="0"
    scrolling="no"
  ></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  src: string
  title: string
  width?: string | number
  height?: string | number
  className?: string
}>()

const iframeClass = computed(() => props.className)
</script>

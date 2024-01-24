<template>
  <iframe
    v-if="shouldDisplay"
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

const props = defineProps({
  src: String,
  title: String,
  width: { type: [String, Number], default: '600' },
  height: { type: [String, Number], default: '400' },
  className: String,
  condition: Boolean
})

const shouldDisplay = computed(() => props.condition)
const iframeClass = computed(() => props.className)
</script>

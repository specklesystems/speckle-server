<template>
  <div
    :class="'absolute p-2 pointer-events-auto flex flex-col bg-foundation rounded-lg'"
    :style="{
      ...thread.style
    }"
  >
    {{ thread.rawText.substring(0, 5) + '...' }}
  </div>
</template>
<script setup lang="ts">
import { CommentBubbleModel } from '~~/lib/viewer/composables/commentBubbles'

defineProps<{
  thread: CommentBubbleModel
}>()
</script>

<template>
  <span
    v-keyboard-clickable
    :class="[
      'text-foreground-2 hover:text-foreground inline-block cursor-pointer',
      size
    ]"
  >
    <span v-if="title">
      {{ title + ' ' }}
    </span>
    <ClipboardIcon class="w-3 h-3 shrink-0 inline -mt-0.5" />
  </span>
</template>
<script setup lang="ts">
import { ClipboardIcon } from '@heroicons/vue/24/outline'

defineProps<{
  title?: string
  size?: string
}>()
</script>

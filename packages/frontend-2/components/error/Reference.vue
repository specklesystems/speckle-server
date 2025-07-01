<template>
  <span
    v-keyboard-clickable
    :class="[
      'text-foreground-2 hover:text-foreground inline-block cursor-pointer',
      size
    ]"
  >
    <span>
      {{ title + ' ' }}
    </span>
    <ClipboardIcon class="w-3 h-3 shrink-0 inline -mt-0.5" />
  </span>
</template>
<script setup lang="ts">
import { ClipboardIcon } from '@heroicons/vue/24/outline'

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

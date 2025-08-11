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
    <Clipboard
      :size="LucideSize.sm"
      :stroke-width="1.5"
      :absolute-stroke-width="true"
      class="shrink-0 inline -mt-0.5"
    />
  </span>
</template>
<script setup lang="ts">
import { Clipboard } from 'lucide-vue-next'

defineProps<{
  title?: string
  size?: string
}>()
</script>

<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <a
    :class="[
      'flex flex-col p-2 cursor-pointer rounded-md text-body-2xs',
      isSelected ? 'bg-foundation-focus dark:bg-foundation-2' : 'hover:bg-foundation-3'
    ]"
    @click="($event) => $emit('click', $event)"
  >
    <span class="truncate">{{ item.name }}</span>
  </a>
</template>
<script setup lang="ts">
import type { SuggestionOptionsItem } from '~~/lib/core/tiptap/mentionExtension'

defineEmits<{
  (e: 'click', val: MouseEvent): void
}>()

defineProps<{
  item: SuggestionOptionsItem
  isSelected?: boolean
}>()
</script>

<!-- eslint-disable vuejs-accessibility/no-static-element-interactions -->
<!-- eslint-disable vuejs-accessibility/click-events-have-key-events -->
<template>
  <a
    :class="[
      'flex flex-col p-2 cursor-pointer',
      isSelected ? 'bg-foundation-focus dark:bg-foundation-2' : 'hover:bg-foundation-3'
    ]"
    @click="($event) => $emit('click', $event)"
  >
    <span class="normal font-medium truncate">{{ item.name }}</span>
    <span v-if="item.company" class="label label--light truncate">
      {{ item.company }}
    </span>
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

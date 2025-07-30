<template>
  <div class="overflow-hidden flex flex-col h-full">
    <div
      class="flex flex-shrink-0 justify-between items-center border-b border-outline-3 h-10 pl-4"
    >
      <div class="text-body-xs text-foreground font-medium">
        <span v-if="title" class="truncate">{{ title }}</span>
        <slot name="title"></slot>
      </div>
      <slot name="actions"></slot>
    </div>
    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close'])

defineProps<{
  title?: string
}>()
</script>

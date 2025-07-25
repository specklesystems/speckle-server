<template>
  <div class="bg-foundation overflow-hidden border-outline-2 flex flex-col h-full">
    <div class="flex justify-between items-center border-b border-outline-3 p-2 pl-4">
      <div class="text-body-xs text-foreground font-medium">
        <span v-if="title" class="truncate">{{ title }}</span>
        <slot name="title"></slot>
      </div>
      <div>
        <slot name="actions"></slot>
      </div>
    </div>
    <div class="flex-1">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
defineEmits(['close'])

defineProps<{
  title?: string
}>()
</script>

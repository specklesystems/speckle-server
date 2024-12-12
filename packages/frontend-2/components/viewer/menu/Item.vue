<template>
  <button
    class="flex items-center justify-between hover:bg-highlight-1 text-foreground w-full h-full text-body-2xs sm:text-body-xs py-1 px-2 rounded-md"
    :class="{ 'bg-highlight-1': active }"
  >
    <div v-if="!hideActiveTick" class="w-5 shrink-0">
      <IconCheck v-if="active" class="h-4 w-4 text-foreground-2" />
    </div>
    <div class="flex-1 text-left">{{ label }}</div>
    <span v-if="shortcut" class="text-body-2xs text-foreground-2">
      {{ shortcut }}
    </span>
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  active?: boolean
  hideActiveTick?: boolean
  shortcut?: string
}>()
</script>

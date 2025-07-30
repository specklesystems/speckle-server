<template>
  <button
    v-tippy="description ? description : undefined"
    class="flex items-center justify-between hover:bg-highlight-1 text-foreground w-full h-full text-body-2xs py-1.5 pr-2 pl-1 rounded-md"
  >
    <div class="w-5 shrink-0">
      <IconCheck v-if="active && !hideActiveTick" class="h-4 w-4 text-foreground-2" />
    </div>
    <div class="flex-1 text-left">{{ label }}</div>
    <span v-if="shortcut" class="text-body-2xs text-foreground-2">
      {{ shortcut }}
    </span>
    <slot />
  </button>
</template>

<script setup lang="ts">
defineProps<{
  label: string
  description?: string
  active?: boolean
  hideActiveTick?: boolean
  shortcut?: string
}>()
</script>

<template>
  <div v-tippy="tooltip" class="flex items-center gap-1">
    <component :is="icon" class="w-4 h-4 text-foreground-2" />
    <div
      class="text-body-2xs font-medium text-foreground-2 bg-highlight-2 rounded px-1 py-px"
    >
      {{ count }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

defineProps<{
  icon: ConcreteComponent
  count: number | string
  tooltip: string
}>()
</script>

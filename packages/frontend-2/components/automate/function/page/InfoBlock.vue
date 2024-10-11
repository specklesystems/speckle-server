<template>
  <div
    class="bg-foundation basis-1/2 shrink-0 grow-0 border border-outline-3 rounded-lg"
  >
    <div class="flex items-center gap-2 px-4 py-2 border-b border-outline-3 mb-4">
      <Component :is="icon" class="w-5 h-5" />
      <h3 class="text-heading">{{ title }}</h3>
    </div>
    <div class="px-4 pb-4">
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { PropAnyComponent } from '@speckle/ui-components'

defineProps<{
  icon: PropAnyComponent
  title: string
}>()
</script>

<template>
  <div class="px-2 pb-4 bg-foundation rounded-lg basis-1/2 shrink-0 grow-0">
    <div class="flex items-center gap-2 py-2 border-b border-outline-3 mb-4">
      <Component :is="icon" class="w-5 h-5" />
      <h3 class="h5 font-bold">{{ title }}</h3>
    </div>
    <div>
      <slot />
    </div>
  </div>
</template>
<script setup lang="ts">
import type { ConcreteComponent } from 'vue'

defineProps<{
  icon: ConcreteComponent
  title: string
}>()
</script>

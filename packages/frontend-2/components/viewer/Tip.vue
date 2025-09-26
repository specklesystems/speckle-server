<template>
  <div
    class="group flex items-center select-none opacity-70 hover:opacity-90 transition"
  >
    <div
      class="relative z-10 h-7 w-7 rounded-full bg-foundation-2 shadow-xl flex items-center justify-center"
    >
      <Lightbulb
        :size="LucideSize.lg"
        :stroke-width="1.5"
        :absolute-stroke-width="true"
        class="text-foreground opacity-60 shrink-0 group-hover:text-warning group-hover:opacity-80 transition"
      />
    </div>
    <div class="text-xs bg-foundation-2 rounded-r-md p-[3px] pl-4 pr-2 -ml-3 shadow-xl">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Lightbulb } from 'lucide-vue-next'
</script>

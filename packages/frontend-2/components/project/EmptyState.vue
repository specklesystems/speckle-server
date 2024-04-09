<template>
  <div class="flex flex-col items-center max-w-[180px] mx-auto">
    <div
      class="relative text-foreground-2 h-32 w-full"
      :class="small ? 'scale-75 -mb-2' : 'mb-1'"
    >
      <slot name="image"></slot>
    </div>
    <div class="flex flex-col gap-1 items-center text-center">
      <span class="text-foreground font-bold">{{ title }}</span>
      <span v-if="text" class="text-xs text-foreground-2">
        {{ text }}
      </span>
    </div>
    <slot name="cta"></slot>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  small?: boolean
  title: string
  text?: string
}>()
</script>

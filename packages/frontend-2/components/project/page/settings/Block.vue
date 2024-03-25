<template>
  <div
    class="bg-foundation py-4 px-6 rounded-lg border border-primary-muted flex flex-col gap-3"
  >
    <div class="flex items-center gap-2 border-b border-outline-3 pb-3">
      <slot name="logo" />
      <h3 class="text-xl font-bold">{{ title }}</h3>
    </div>
    <div v-if="$slots.introduction" class="text-sm text-foreground">
      <slot name="introduction" />
    </div>
    <div class="flex flex-col gap-4">
      <slot />
    </div>
    <div v-if="$slots.buttons" class="flex gap-2 justify-end w-full mb-1 mt-2">
      <slot name="buttons" />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

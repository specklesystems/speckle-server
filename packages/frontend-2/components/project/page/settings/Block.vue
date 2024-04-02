<template>
  <div
    class="flex flex-col gap-3 w-full"
    :class="
      background
        ? 'bg-foundation border border-primary-muted py-4 px-6 rounded-lg '
        : ''
    "
  >
    <div class="flex items-center gap-4 border-b border-outline-3 pb-3 justify-between">
      <div class="flex items-center gap-2">
        <slot name="logo" />
        <h3 class="text-xl font-bold">{{ title }}</h3>
      </div>
      <div v-if="$slots.topButtons" class="hidden sm:flex gap-2">
        <slot name="topButtons" />
      </div>
    </div>
    <div v-if="$slots.topButtons" class="flex sm:hidden gap-2">
      <slot name="topButtons" />
    </div>
    <div v-if="$slots.introduction" class="text-sm text-foreground">
      <slot name="introduction" />
    </div>
    <div class="flex flex-col">
      <slot />
    </div>
    <div v-if="$slots.bottomButtons" class="flex gap-2 justify-end w-full mb-1 mt-2">
      <slot name="bottomButtons" />
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  background?: boolean
}>()
</script>

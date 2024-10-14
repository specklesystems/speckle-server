<template>
  <div class="flex flex-col border border-outline-3 rounded-lg pt-6 px-8 pb-10 h-full">
    <slot name="icon" />
    <div class="flex flex-col mt-4">
      <h5 class="text-foreground text-heading-sm">{{ title }}</h5>
      <p class="text-body-xs text-foreground-2">
        {{ description }}
      </p>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

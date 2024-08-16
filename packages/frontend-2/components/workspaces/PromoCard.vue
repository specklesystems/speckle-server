<template>
  <div class="flex flex-col">
    <slot name="image" />
    <div class="flex flex-col mt-5">
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

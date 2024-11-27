<template>
  <div>
    <div class="flex flex-col items-center gap-y-3">
      <h1 class="text-2xl font-medium text-center">{{ title }}</h1>
      <p v-if="description" class="text-body text-foreground-2">
        {{ description }}
      </p>
    </div>
    <div class="flex flex-col items-center pt-8">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

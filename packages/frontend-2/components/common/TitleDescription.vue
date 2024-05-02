<template>
  <div>
    <h2 class="h3 mb-2">{{ title }}</h2>
    <p class="font-light max-w-2xl text-foreground-2">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

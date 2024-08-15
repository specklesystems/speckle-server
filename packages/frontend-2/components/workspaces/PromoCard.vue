<template>
  <div class="flex flex-col">
    <div class="h-56 border border-outline rounded-lg bg-foundation-2 mb-5">
      <img :src="imageUrl" :alt="title" class="w-full h-full object-cover" />
    </div>
    <div class="flex flex-col">
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
  imageUrl: string
}>()
</script>

<template>
  <NuxtLink
    :to="url"
    target="_blank"
    class="rounded-xl w-full flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6 mb-4 select-none overflow-hidden"
    :class="isBackgroundImage ? '' : 'bg-[#27272a] text-white p-6 lg:p-8'"
  >
    <img
      v-if="isBackgroundImage"
      :src="image"
      class="w-full h-full"
      :alt="primaryText"
    />
    <div
      v-else
      class="flex flex-col lg:flex-row gap-2 lg:gap-6 items-start lg:items-center"
    >
      <div class="flex flex-col sm:flex-row sm:gap-1">
        <span class="font-medium">{{ primaryText }}</span>
        <span v-if="secondaryText">{{ secondaryText }}</span>
      </div>
    </div>
  </NuxtLink>
</template>
<script setup lang="ts">
defineProps<{
  primaryText: string
  secondaryText?: string
  url: string
  image: string
  isBackgroundImage?: boolean
}>()
</script>

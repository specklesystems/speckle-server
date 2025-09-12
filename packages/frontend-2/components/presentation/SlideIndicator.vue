<template>
  <ul class="flex flex-col space-y-2">
    <li v-for="i in slideCount" :key="i">
      <div
        class="w-2 h-[1px] bg-foreground-3 transition-all duration-200"
        :class="{ 'w-4 !bg-foreground': i === currentSlideIndex + 1 }"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
defineProps<{
  currentSlideIndex: number
  slideCount: number
}>()
</script>

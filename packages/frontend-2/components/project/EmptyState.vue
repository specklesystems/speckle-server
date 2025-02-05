<template>
  <div class="flex justify-center flex-col text-center my-12">
    <h3 class="text-heading mt-2 text-foreground">
      {{ title }}
    </h3>
    <h4 v-if="text" class="text-body-xs mb-4 mt-2 max-w-xs mx-auto text-foreground-2">
      {{ text }}
    </h4>
    <div class="flex flex-col items-center gap-2">
      <slot name="cta"></slot>
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  title: string
  text?: string
}>()
</script>

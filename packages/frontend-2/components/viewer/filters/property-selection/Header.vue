<template>
  <div class="px-2.5 flex items-center h-9">
    <div class="text-body-3xs font-medium text-foreground-2 tracking-wide">
      {{ title }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

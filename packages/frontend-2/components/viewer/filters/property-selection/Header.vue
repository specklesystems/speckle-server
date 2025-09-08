<template>
  <div class="px-2.5 flex items-center h-9">
    <div class="text-body-3xs font-semibold text-foreground-3">
      {{ title }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>

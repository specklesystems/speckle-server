<template>
  <NuxtLink
    class="shrink-0 w-8 h-8 rounded-full border-2 border-outline-1 inline-flex justify-center items-center"
    @click="$emit('click', $event)"
  >
    <slot />
  </NuxtLink>
</template>
<script setup lang="ts">
defineEmits<{
  (e: 'click', v: MouseEvent): void
}>()
</script>

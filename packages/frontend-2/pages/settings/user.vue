<template>
  <NuxtPage />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'settings'],
  layout: 'settings'
})
</script>

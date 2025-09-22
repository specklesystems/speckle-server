<template>
  <NuxtPage />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['auth', 'settings', 'admin'],
  layout: 'settings'
})
</script>

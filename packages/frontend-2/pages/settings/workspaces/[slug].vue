<template>
  <NuxtPage />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: [
    'auth',
    'settings',
    'requires-workspaces-enabled',
    'require-valid-workspace'
  ],
  layout: 'settings'
})
</script>

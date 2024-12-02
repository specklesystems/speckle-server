<template>
  <WorkspaceCreatePage />
</template>

<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth'],
  layout: 'empty'
})
useHead({
  title: 'Create a workspace'
})
</script>

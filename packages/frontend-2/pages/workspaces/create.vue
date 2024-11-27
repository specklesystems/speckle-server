<template>
  <div>
    <WorkspaceWizard />
  </div>
</template>
<script setup lang="ts">
definePageMeta({
  middleware: ['requires-workspaces-enabled', 'auth']
})
useHead({
  title: 'Create a workspace'
})
</script>
